---
name: handover-progress
version: 1.0.0
priority: P0
trigger: always_on
---

# Handover and Progress Updates

## When this applies

For every project change—including code, configuration, migrations, deployment, documentation, rules and agreed scope changes—update both `docs/HANDOVER.md` and `docs/PROGRESS.md` before the final response. Apply this also when investigation or verification changes a documented status, blocker or next step. Pure explanations with no new project state need no documentation-only churn.

## Required workflow

1. Before work, read the relevant sections of both documents and the affected feature plan. Use them to identify current state and unresolved verification gaps.
2. After work, update both documents using the current date in `Africa/Dar_es_Salaam`:
   - **HANDOVER:** current capabilities, limitations, unresolved issues and recommended next action; add one concise change-log entry for the work item.
   - **PROGRESS:** implemented tasks, pending tasks, actual verification results and deployment status.
   - **Affected feature plan:** update its status/checklist when scope or task completion changes.
3. Distinguish **planned**, **implemented in source**, **deployed** and **verified**. Specify verification type: unit tests, real database tests, HTTP smoke checks or authenticated browser acceptance. A successful build or HTTP 200 is not end-to-end acceptance.
4. Record applicable test commands/results, affected services/migrations, deployment outcome and backup/rollback references. Mark unrun checks, failed checks and blocked work explicitly. Mark a broad phase complete only when all its requirements and acceptance checks pass.
5. Reconcile superseded statements across the documents. Preserve dated historical evidence, but label it as historical rather than current. Link to detailed plans instead of duplicating them wholesale.
6. Before the final response, check the documentation diff for consistency, valid paths/links and accurate dates. Mention the updated documents and any remaining blocker briefly.

## Safety and completion

- Record only observed evidence; do not invent deployment, test or acceptance results.
- Keep credentials, tokens and customer personal data out of these files. Backup references must not imply that a container-local file is a durable off-host backup.
- Preserve unrelated user edits and existing evidence.
- If either document cannot be updated, state the exact blocker and required follow-up in the final response; do not claim the documentation is current.
- This rule does not authorise deployment, destructive operations or broader application changes beyond the user's request.
