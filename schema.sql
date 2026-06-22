-- PostgreSQL Database Schema for ClaimShield AI
-- Enterprise Healthcare Denial Management Platform

-- Enable UUID extension if not already loaded
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Users Table
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Billing Specialist', 'Physician', 'Appeals Specialist')),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- 2. Patients Table
-- ============================================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(50) UNIQUE NOT NULL, -- Medical Record Number
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Unknown')),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    insurance_group_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for patients
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_names ON patients(last_name, first_name);

-- ============================================================================
-- 3. Claims Table
-- ============================================================================
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    payer_name VARCHAR(100) NOT NULL,
    billing_provider VARCHAR(100) NOT NULL,
    rendering_provider VARCHAR(100),
    claim_date DATE NOT NULL,
    total_charges NUMERIC(12, 2) NOT NULL CHECK (total_charges >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    amount_allowed NUMERIC(12, 2) DEFAULT 0.00 CHECK (amount_allowed >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Paid', 'Denied', 'Under Appeal', 'Adjusted', 'Closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for claims
CREATE INDEX idx_claims_patient_id ON claims(patient_id);
CREATE INDEX idx_claims_claim_number ON claims(claim_number);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_claim_date ON claims(claim_date);

-- ============================================================================
-- 4. Denials Table
-- ============================================================================
CREATE TABLE denials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    denial_date DATE NOT NULL,
    carc_code VARCHAR(10) NOT NULL, -- Claim Adjustment Reason Code (e.g., CO-50)
    carc_description TEXT,
    rarc_code VARCHAR(10),           -- Remittance Advice Remark Code (e.g., N115)
    rarc_description TEXT,
    denied_amount NUMERIC(12, 2) NOT NULL CHECK (denied_amount >= 0),
    payer_notes TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewing', 'Appeal Drafted', 'Appealed', 'Overturned', 'Upheld', 'Ignored')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for denials
CREATE INDEX idx_denials_claim_id ON denials(claim_id);
CREATE INDEX idx_denials_carc ON denials(carc_code);
CREATE INDEX idx_denials_status ON denials(status);
CREATE INDEX idx_denials_assigned_to ON denials(assigned_to);

-- ============================================================================
-- 5. MedicalRecords Table
-- ============================================================================
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_date DATE NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'Clinical Notes' CHECK (document_type IN ('Clinical Notes', 'Lab Report', 'Imaging Report', 'Other')),
    clinical_notes TEXT NOT NULL,
    diagnoses_codes VARCHAR(15)[] NOT NULL, -- ICD-10 codes
    procedure_codes VARCHAR(15)[],          -- CPT/HCPCS codes
    extracted_diagnoses VARCHAR(100)[],      -- Diagnosis names (e.g. ['Atherosclerotic heart disease'])
    extracted_symptoms VARCHAR(100)[],       -- Symptoms (e.g. ['Chest pain', 'Shortness of breath'])
    failed_treatments TEXT[],                -- Failed treatments (e.g. ['PT for 6 months', 'NSAIDs'])
    risk_factors VARCHAR(100)[],             -- Risk factors (e.g. ['Hypertension', 'Family history'])
    recommendations TEXT,                    -- Recommendations (e.g. ['Schedule catheterization'])
    timeline_events JSONB,                   -- Structured patient timeline events
    facility_name VARCHAR(100),
    attending_physician VARCHAR(100),
    file_path VARCHAR(255),                  -- Reference to file storage
    status VARCHAR(20) NOT NULL DEFAULT 'Finalized' CHECK (status IN ('Draft', 'Finalized', 'Amended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for medical records
CREATE INDEX idx_medrec_patient ON medical_records(patient_id);
CREATE INDEX idx_medrec_encounter ON medical_records(encounter_date);
CREATE INDEX idx_medrec_diag_gin ON medical_records USING GIN (diagnoses_codes);

-- ============================================================================
-- 6. PayerPolicies Table
-- ============================================================================
CREATE TABLE payer_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_name VARCHAR(100) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_code VARCHAR(50) UNIQUE NOT NULL, -- Unique medical policy identifier
    description TEXT,
    criteria_details TEXT,                    -- General criteria summary
    coverage_criteria TEXT,                   -- Extracted coverage criteria
    exclusions TEXT,                          -- Extracted exclusions/non-covered items
    medical_necessity_requirements TEXT,      -- Medical necessity rules
    authorization_rules TEXT,                 -- Prior authorization parameters
    effective_date DATE NOT NULL,
    expiration_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Retired', 'Draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payer policies
CREATE INDEX idx_policies_payer ON payer_policies(payer_name);
CREATE INDEX idx_policies_code ON payer_policies(policy_code);

-- ============================================================================
-- 7. Appeals Table
-- ============================================================================
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    denial_id UUID NOT NULL REFERENCES denials(id) ON DELETE RESTRICT,
    appeal_number VARCHAR(50) UNIQUE NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    physician_signoff_by UUID REFERENCES users(id) ON DELETE SET NULL,
    appeal_letter_text TEXT NOT NULL,
    submission_date DATE,
    submission_method VARCHAR(30) CHECK (submission_method IN ('Fax', 'Electronic portal', 'Mail', 'Email')),
    tracking_number VARCHAR(100),
    outcome_date DATE,
    amount_recovered NUMERIC(12, 2) DEFAULT 0.00 CHECK (amount_recovered >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Physician Review Required', 'Pending Submission', 'Submitted', 'Approved', 'Rejected', 'Withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for appeals
CREATE INDEX idx_appeals_denial_id ON appeals(denial_id);
CREATE INDEX idx_appeals_appeal_number ON appeals(appeal_number);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_generated_by ON appeals(generated_by);

-- ============================================================================
-- 8. EvidenceMappings Table
-- ============================================================================
CREATE TABLE evidence_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    payer_policy_id UUID REFERENCES payer_policies(id) ON DELETE CASCADE,
    snippet_extracted TEXT NOT NULL, -- Specific snippet from patient chart/policy
    relevance_score NUMERIC(3, 2) CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disputed', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_reference_presence CHECK (medical_record_id IS NOT NULL OR payer_policy_id IS NOT NULL)
);

-- Indexes for evidence mappings
CREATE INDEX idx_evidence_appeal_id ON evidence_mappings(appeal_id);
CREATE INDEX idx_evidence_medrec_id ON evidence_mappings(medical_record_id);
CREATE INDEX idx_evidence_policy_id ON evidence_mappings(payer_policy_id);

-- ============================================================================
-- 9. Tasks Table
-- ============================================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    denial_id UUID REFERENCES denials(id) ON DELETE CASCADE,
    appeal_id UUID REFERENCES appeals(id) ON DELETE CASCADE,
    due_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tasks
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_claim ON tasks(claim_id);

-- ============================================================================
-- 10. Notifications Table
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Claim Denied', 'Task Assigned', 'Appeal Completed', 'Physician Review Required', 'System Alert')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- 11. AuditLogs Table
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'LOGIN', 'APPEAL_GENERATION', 'STATUS_CHANGE'
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- Audit logs are append-only; no updated_at column is necessary.
);

-- Indexes for audit logs
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS & FUNCTIONS FOR AUTOMATIC updated_at UPDATE
-- ============================================================================

-- Reusable trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_modtime BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_modtime BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_denials_modtime BEFORE UPDATE ON denials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_modtime BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payer_policies_modtime BEFORE UPDATE ON payer_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appeals_modtime BEFORE UPDATE ON appeals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidence_mappings_modtime BEFORE UPDATE ON evidence_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
