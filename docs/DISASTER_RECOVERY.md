# QUARDCUBE LABS — ENTERPRISE DISASTER RECOVERY & BACKUP RUNBOOK

**Target System:** QuardCube Labs Business Cloud & Admin Dashboard  
**Architecture:** Next.js (Vercel) + Supabase Managed PostgreSQL + Local Fallback Resiliency Layer  
**Document Revision:** 2.0 (Post-Hardening Audit)  
**Classification:** Confidential — Operations & DevOps Lead  

---

## 1. Executive Overview & Objectives

This runbook establishes standard operating procedures (SOPs) for continuous backups, point-in-time recovery (PITR), catastrophic failover, and credential compromise response for QuardCube Labs.

### Target Recovery Metrics
* **Recovery Point Objective (RPO):** < 15 minutes (Database state loss cannot exceed 15 minutes in a disaster).
* **Recovery Time Objective (RTO):** < 60 minutes (System must be restored to production-ready status within 1 hour).

---

## 2. Backup Topology & Architecture

QuardCube Labs maintains a **multi-tier dual-redundancy backup strategy**:

### Tier 1: Cloud-Native Supabase Automated Backups & PITR
* **Mechanism:** Continuous Write-Ahead Logging (WAL) archiving paired with automated daily physical base backups managed by Supabase.
* **Retention Period:** 30 days continuous PITR (Pro/Enterprise tier) with roll-back granularity down to the individual second.
* **Storage Location:** AWS S3 encrypted at rest (AES-256) across multiple availability zones.

### Tier 2: Automated Logical Database Snapshots (Offsite Cold Storage)
* **Frequency:** Daily at `02:00 UTC` via encrypted GitHub Actions runner or automated cron worker.
* **Command Script:**
  ```bash
  pg_dump -h db.<PROJECT_REF>.supabase.co -U postgres -d postgres -F c -b -v -f "quardcube_backup_$(date +%Y%m%d_%H%M%S).dump"
  ```
* **Retention Policy:**
  * Daily snapshots retained for 14 days.
  * Weekly snapshots retained for 8 weeks.
  * Monthly financial close snapshots retained for 7 years (Tanzania TRA regulatory compliance).

### Tier 3: Zero-Downtime Local JSON State Mirroring
* To protect operations during external WAN disconnection or Supabase network partitioning, core operational ledgers (`db/audit_logs_data.json`, `db/document_verifications.json`, `db/reports_data.json`) maintain local append-only copies on the runtime server file system.

---

## 3. Disaster Recovery Procedures

### Scenario A: Accidental Data Truncation or Corrupted Mutation
*Trigger:* An unauthorized script or administrative error corrupts a batch of invoices or orders.

1. **Freeze Traffic:**
   * In Vercel Project Settings, immediately enable Maintenance Mode or route traffic to a static holding page to prevent further transactions.
2. **Identify Target Timestamp:**
   * Query the immutable audit logs table:
     ```sql
     SELECT id, timestamp, user_email, action, description 
     FROM public.audit_logs 
     ORDER BY timestamp DESC 
     LIMIT 50;
     ```
   * Pinpoint the exact second $T_{\text{target}}$ prior to the anomalous operation.
3. **Trigger Supabase PITR Restore:**
   * Access the Supabase Management Console -> Database -> Backups.
   * Select **Point in Time Restore**.
   * Specify $T_{\text{target}}$ in UTC.
   * Supabase provisions a restored clone database.
4. **Validation:**
   * Verify row counts in `invoices`, `orders`, `staff_members`, and `audit_logs`.
5. **Switch Connection String:**
   * Update `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables.
   * Trigger production redeployment.

---

### Scenario B: Credential Compromise / API Key Exposure
*Trigger:* `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_SECRET` suspected of exposure.

1. **Revoke Exposed Tokens Immediately:**
   * Navigate to Supabase Dashboard -> Project Settings -> API.
   * Click **Generate New API Secret Key** (`service_role` and `anon`).
2. **Update Vercel Secrets:**
   * Run the CLI command or update via web console:
     ```bash
     vercel env add SUPABASE_SERVICE_ROLE_KEY production
     ```
3. **Invalidate Active Admin Sessions:**
   * Update `NEXTAUTH_SECRET` or `JWT_SECRET` in environment variables.
   * Existing signed cookies become instantly invalid, forcing all administrators to re-authenticate with multi-factor credentials.
4. **Inspect Audit Log for Unauthorized Activity:**
   * Review all actions executed during the suspected exposure window:
     ```sql
     SELECT * FROM public.audit_logs 
     WHERE timestamp >= NOW() - INTERVAL '48 HOURS' 
       AND action IN ('deleted', 'updated', 'permission_change');
     ```

---

## 4. Periodic Restoration Drill Protocol

*A backup is never trusted until tested.*

1. **Drill Cadence:** Conducted on the 1st Saturday of every calendar quarter.
2. **Environment:** Staging sandbox environment (`staging-quardcube.supabase.co`).
3. **Execution Steps:**
   * Take the latest production dump file.
   * Restore into staging schema:
     ```bash
     pg_restore --clean --if-exists -d postgres -h db.staging-ref.supabase.co -U postgres quardcube_backup_sample.dump
     ```
   * Run test suite:
     ```bash
     npm run build
     npm test
     ```
   * Verify QR document verification engine successfully resolves existing tokens.
4. **Sign-off:** The DevOps Lead logs drill success in the official operations register.
