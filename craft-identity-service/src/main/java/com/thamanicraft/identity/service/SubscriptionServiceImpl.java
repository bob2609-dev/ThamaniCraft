package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.SubscriptionPlanDto;
import com.thamanicraft.identity.dto.TenantSubscriptionDto;
import com.thamanicraft.identity.entity.SubscriptionPlan;
import com.thamanicraft.identity.entity.Tenant;
import com.thamanicraft.identity.entity.TenantSubscription;
import com.thamanicraft.identity.exception.ResourceNotFoundException;
import com.thamanicraft.identity.dto.SubscriptionInvoiceDto;
import com.thamanicraft.identity.entity.SubscriptionInvoice;
import com.thamanicraft.identity.repository.SubscriptionInvoiceRepository;
import com.thamanicraft.identity.repository.SubscriptionPlanRepository;
import com.thamanicraft.identity.repository.TenantRepository;
import com.thamanicraft.identity.repository.TenantSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final TenantSubscriptionRepository tenantSubRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;

    @Override
    public List<SubscriptionPlanDto> getAllPlans() {
        return getAllPlans(false);
    }

    @Override
    public List<SubscriptionPlanDto> getAllPlans(boolean publicOnly) {
        List<SubscriptionPlan> plans = publicOnly 
                ? planRepository.findAllPublicPlans() 
                : planRepository.findAll();
        return plans.stream()
                .map(this::mapToPlanDto)
                .collect(Collectors.toList());
    }

    @Override
    public SubscriptionPlanDto getPlanByCode(String code) {
        SubscriptionPlan plan = planRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with code: " + code));
        return mapToPlanDto(plan);
    }

    @Override
    @Transactional
    public SubscriptionPlanDto createPlan(SubscriptionPlanDto planDto) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setCode(planDto.getCode());
        plan.setName(planDto.getName());
        plan.setDescription(planDto.getDescription());
        plan.setMonthlyPrice(planDto.getMonthlyPrice());
        plan.setMaxUsers(planDto.getMaxUsers());
        plan.setIncludedModules(planDto.getIncludedModules());
        plan.setActive(planDto.isActive());
        plan.setVisibleToCustomers(planDto.isVisibleToCustomers());
        
        return mapToPlanDto(planRepository.save(plan));
    }

    @Override
    @Transactional
    public SubscriptionPlanDto updatePlan(UUID id, SubscriptionPlanDto planDto) {
        SubscriptionPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        plan.setName(planDto.getName());
        plan.setDescription(planDto.getDescription());
        plan.setMonthlyPrice(planDto.getMonthlyPrice());
        plan.setMaxUsers(planDto.getMaxUsers());
        plan.setIncludedModules(planDto.getIncludedModules());
        plan.setActive(planDto.isActive());
        plan.setVisibleToCustomers(planDto.isVisibleToCustomers());
        
        return mapToPlanDto(planRepository.save(plan));
    }

    @Override
    public TenantSubscriptionDto getTenantSubscription(UUID tenantId) {
        // First try to find ACTIVE, then PENDING_PAYMENT
        TenantSubscription sub = tenantSubRepository.findByTenantIdAndStatus(tenantId, "ACTIVE")
                .orElseGet(() -> tenantSubRepository.findByTenantIdAndStatus(tenantId, "PENDING_PAYMENT")
                .orElseThrow(() -> new ResourceNotFoundException("No active or pending subscription for tenant")));
        return mapToTenantSubDto(sub);
    }

    @Override
    @Transactional
    public TenantSubscriptionDto assignPlanToTenant(UUID tenantId, String planCode) {
        return assignPlanToTenant(tenantId, planCode, false, false);
    }

    @Override
    @Transactional
    public TenantSubscriptionDto assignPlanToTenant(UUID tenantId, String planCode, boolean autoActivate, boolean isSuperAdmin) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        SubscriptionPlan plan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + planCode));

        if (!isSuperAdmin && (!plan.isActive() || !plan.isVisibleToCustomers())) {
            throw new IllegalArgumentException("Plan is not available for customer subscription");
        }
                
        tenantSubRepository.findByTenantIdAndStatus(tenantId, "ACTIVE").ifPresent(existing -> {
            existing.setStatus("CANCELLED");
            existing.setEndDate(LocalDate.now());
            tenantSubRepository.save(existing);
        });
        tenantSubRepository.findByTenantIdAndStatus(tenantId, "PENDING_PAYMENT").ifPresent(existing -> {
            existing.setStatus("CANCELLED");
            existing.setEndDate(LocalDate.now());
            tenantSubRepository.save(existing);
        });
        
        boolean shouldActivate = autoActivate || (plan.getMonthlyPrice() != null && plan.getMonthlyPrice().compareTo(BigDecimal.ZERO) == 0);

        TenantSubscription newSub = new TenantSubscription();
        newSub.setTenant(tenant);
        newSub.setPlan(plan);
        newSub.setStatus(shouldActivate ? "ACTIVE" : "PENDING_PAYMENT");
        newSub.setStartDate(LocalDate.now());
        newSub.setNextBillingDate(shouldActivate ? LocalDate.now().plusMonths(1) : LocalDate.now());
        newSub.setAutoRenew(true);
        TenantSubscription savedSub = tenantSubRepository.save(newSub);
        
        // Generate Invoice
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setTenantId(tenantId);
        invoice.setPlanCode(planCode);
        invoice.setAmount(plan.getMonthlyPrice());
        invoice.setBillingPeriodStart(LocalDateTime.now());
        invoice.setBillingPeriodEnd(LocalDateTime.now().plusMonths(1));
        if (shouldActivate) {
            invoice.setStatus("PAID");
            invoice.setPaidAt(LocalDateTime.now());
            invoice.setPaymentReference("ADMIN-ASSIGNED");
        } else {
            invoice.setStatus("UNPAID");
        }
        invoiceRepository.save(invoice);
        
        return mapToTenantSubDto(savedSub);
    }

    @Override
    public List<SubscriptionInvoiceDto> getTenantInvoices(UUID tenantId) {
        return invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::mapToInvoiceDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SubscriptionInvoiceDto> getPendingInvoices() {
        return invoiceRepository.findByStatusOrderByCreatedAtDesc("PENDING_VERIFICATION").stream()
                .map(this::mapToInvoiceDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubscriptionInvoiceDto submitProofOfPayment(UUID invoiceId, String reference, String fileUrl) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        
        invoice.setPaymentReference(reference);
        if (fileUrl != null && !fileUrl.isEmpty()) {
            invoice.setProofUrl(fileUrl);
        }
        invoice.setStatus("PENDING_VERIFICATION");
        
        return mapToInvoiceDto(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public SubscriptionInvoiceDto approvePayment(UUID invoiceId) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        
        invoice.setStatus("PAID");
        invoice.setPaidAt(LocalDateTime.now());
        SubscriptionInvoice savedInvoice = invoiceRepository.save(invoice);
        
        // Activate subscription
        TenantSubscription sub = tenantSubRepository.findByTenantIdAndStatus(invoice.getTenantId(), "PENDING_PAYMENT")
                .orElseGet(() -> tenantSubRepository.findByTenantIdAndStatus(invoice.getTenantId(), "ACTIVE")
                        .orElseThrow(() -> new ResourceNotFoundException("Subscription not found for invoice")));
                        
        sub.setStatus("ACTIVE");
        sub.setNextBillingDate(invoice.getBillingPeriodEnd().toLocalDate());
        tenantSubRepository.save(sub);
        
        return mapToInvoiceDto(savedInvoice);
    }

    @Override
    @Transactional
    public SubscriptionInvoiceDto rejectPayment(UUID invoiceId, String reason) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        
        invoice.setStatus("UNPAID");
        // We don't store rejection reason in db yet, but status goes back to UNPAID
        return mapToInvoiceDto(invoiceRepository.save(invoice));
    }
    
    private SubscriptionInvoiceDto mapToInvoiceDto(SubscriptionInvoice invoice) {
        SubscriptionInvoiceDto dto = new SubscriptionInvoiceDto();
        dto.setId(invoice.getId());
        dto.setTenantId(invoice.getTenantId());
        dto.setPlanCode(invoice.getPlanCode());
        dto.setAmount(invoice.getAmount());
        dto.setBillingPeriodStart(invoice.getBillingPeriodStart());
        dto.setBillingPeriodEnd(invoice.getBillingPeriodEnd());
        dto.setStatus(invoice.getStatus());
        dto.setPaymentMethod(invoice.getPaymentMethod());
        dto.setPaymentReference(invoice.getPaymentReference());
        dto.setProofUrl(invoice.getProofUrl());
        dto.setPaidAt(invoice.getPaidAt());
        dto.setCreatedAt(invoice.getCreatedAt());
        return dto;
    }
    
    private SubscriptionPlanDto mapToPlanDto(SubscriptionPlan plan) {
        SubscriptionPlanDto dto = new SubscriptionPlanDto();
        dto.setId(plan.getId());
        dto.setCode(plan.getCode());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setMonthlyPrice(plan.getMonthlyPrice());
        dto.setMaxUsers(plan.getMaxUsers());
        dto.setIncludedModules(plan.getIncludedModules());
        dto.setActive(plan.isActive());
        dto.setVisibleToCustomers(plan.isVisibleToCustomers());
        return dto;
    }
    
    private TenantSubscriptionDto mapToTenantSubDto(TenantSubscription sub) {
        TenantSubscriptionDto dto = new TenantSubscriptionDto();
        dto.setId(sub.getId());
        dto.setTenantId(sub.getTenant().getId());
        dto.setPlan(mapToPlanDto(sub.getPlan()));
        dto.setStatus(sub.getStatus());
        dto.setStartDate(sub.getStartDate());
        dto.setEndDate(sub.getEndDate());
        dto.setNextBillingDate(sub.getNextBillingDate());
        dto.setAutoRenew(sub.isAutoRenew());
        return dto;
    }
}
