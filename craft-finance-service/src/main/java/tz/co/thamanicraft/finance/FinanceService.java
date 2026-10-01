package tz.co.thamanicraft.finance;

import com.thamanicraft.security.context.TenantContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Date;
import java.util.*;

@Service
public class FinanceService {
    private final JdbcTemplate jdbc;
    private final tz.co.thamanicraft.finance.ledger.LedgerService ledgerService;
    public FinanceService(JdbcTemplate jdbc, tz.co.thamanicraft.finance.ledger.LedgerService ledgerService) { 
        this.jdbc = jdbc; 
        this.ledgerService = ledgerService;
    }
    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant context required");
        return id;
    }

    public List<Map<String, Object>> assets() {
        return jdbc.queryForList("""
            SELECT id,name,category,purchase_date AS "purchaseDate",purchase_cost AS "purchaseCost",
                status,reference,notes FROM finance.fixed_assets WHERE tenant_id=? ORDER BY purchase_date DESC,created_at DESC
            """, tenant());
    }

    public List<Map<String, Object>> expenses() {
        return jdbc.queryForList("""
            SELECT id,title,category,expense_date AS "expenseDate",amount,reference,notes
            FROM finance.expenses WHERE tenant_id=? ORDER BY expense_date DESC,created_at DESC
            """, tenant());
    }

    public List<Map<String, Object>> leases() {
        return jdbc.queryForList("""
            SELECT id,title,start_date AS "startDate",end_date AS "endDate",total_amount AS "totalAmount",
                billing_period_months AS "billingPeriodMonths",active
            FROM finance.facility_leases WHERE tenant_id=? ORDER BY created_at DESC
            """, tenant());
    }

    @Transactional
    public UUID saveAsset(UUID id, FinanceRequests.Asset a) {
        UUID tenant = tenant(), user = TenantContext.getCurrentUserId();
        if (id == null) {
            id = UUID.randomUUID();
            jdbc.update("""
                INSERT INTO finance.fixed_assets(id,tenant_id,name,category,purchase_date,purchase_cost,
                  status,reference,notes,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)
                """, id,tenant,a.name().trim(),a.category(),Date.valueOf(a.purchaseDate()),a.purchaseCost(),
                a.status(),a.reference(),a.notes(),user,user);
        } else {
            checkUpdated(jdbc.update("""
                UPDATE finance.fixed_assets SET name=?,category=?,purchase_date=?,purchase_cost=?,
                  status=?,reference=?,notes=?,updated_by=?,updated_at=CURRENT_TIMESTAMP
                WHERE id=? AND tenant_id=?
                """,a.name().trim(),a.category(),Date.valueOf(a.purchaseDate()),a.purchaseCost(),
                a.status(),a.reference(),a.notes(),user,id,tenant));
        }
        return id;
    }

    @Transactional
    public UUID saveExpense(UUID id, FinanceRequests.Expense e) {
        UUID tenant = tenant(), user = TenantContext.getCurrentUserId();
        if (id == null) {
            id = UUID.randomUUID();
            jdbc.update("""
                INSERT INTO finance.expenses(id,tenant_id,title,category,expense_date,amount,reference,notes,created_by,updated_by)
                VALUES (?,?,?,?,?,?,?,?,?,?)
                """,id,tenant,e.title().trim(),e.category(),Date.valueOf(e.expenseDate()),e.amount(),e.reference(),e.notes(),user,user);
        } else {
            checkUpdated(jdbc.update("""
                UPDATE finance.expenses SET title=?,category=?,expense_date=?,amount=?,reference=?,notes=?,
                  updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?
                """,e.title().trim(),e.category(),Date.valueOf(e.expenseDate()),e.amount(),e.reference(),e.notes(),user,id,tenant));
        }
        return id;
    }

    @Transactional
    public UUID quickExpense(FinanceRequests.Expense e) {
        UUID id = saveExpense(null, e);
        
        tz.co.thamanicraft.finance.ledger.Account expenseAccount = new tz.co.thamanicraft.finance.ledger.Account();
        expenseAccount.setCode("5100"); // Operating Expenses
        tz.co.thamanicraft.finance.ledger.Account cashAccount = new tz.co.thamanicraft.finance.ledger.Account();
        cashAccount.setCode("1000"); // Cash
        
        tz.co.thamanicraft.finance.ledger.JournalLine debitLine = new tz.co.thamanicraft.finance.ledger.JournalLine();
        debitLine.setAccount(expenseAccount);
        debitLine.setDebitAmount(e.amount());
        
        tz.co.thamanicraft.finance.ledger.JournalLine creditLine = new tz.co.thamanicraft.finance.ledger.JournalLine();
        creditLine.setAccount(cashAccount);
        creditLine.setCreditAmount(e.amount());
        
        List<tz.co.thamanicraft.finance.ledger.JournalLine> lines = List.of(debitLine, creditLine);
        
        ledgerService.postJournalEntry(tenant(), "EXP-" + id.toString().substring(0,8), "Quick Expense - " + e.title(), e.expenseDate().atStartOfDay(), lines);
        return id;
    }

    private void checkUpdated(int count) {
        if (count == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
    }
}
