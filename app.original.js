// ClaimShield AI - Application JavaScript Engine
// Simulates the frontend UI, client-side database, OCR pipeline, and Developer Console API

// ============================================================================
// 1. Initial Database Mock State
// ============================================================================
const MOCK_DATABASE = {
    users: [
        { id: "u-1", username: "admin", first_name: "Eleanor", last_name: "Vance", role: "Admin", status: "Active" },
        { id: "u-2", username: "billingspec", first_name: "Marcus", last_name: "Chen", role: "Billing Specialist", status: "Active" },
        { id: "u-3", username: "dr_sarah", first_name: "Sarah", last_name: "Connor", role: "Physician", status: "Active" },
        { id: "u-4", username: "appealexpert", first_name: "Diana", last_name: "Prince", role: "Appeals Specialist", status: "Active" }
    ],
    patients: [
        { id: "p-1", mrn: "MRN-882910", first_name: "John", last_name: "Doe", date_of_birth: "1978-05-14", gender: "Male", insurance_provider: "Aetna", insurance_policy_number: "AE-99210-A", insurance_group_number: "GRP-3392", status: "Active" },
        { id: "p-2", mrn: "MRN-102938", first_name: "Jane", last_name: "Smith", date_of_birth: "1985-11-22", gender: "Female", insurance_provider: "UnitedHealthcare", insurance_policy_number: "UHC-7731-B", insurance_group_number: "GRP-8812", status: "Active" },
        { id: "p-3", mrn: "MRN-334921", first_name: "Robert", last_name: "Johnson", date_of_birth: "1960-03-08", gender: "Male", insurance_provider: "BCBS", insurance_policy_number: "BC-55210-C", insurance_group_number: "GRP-0941", status: "Active" }
    ],
    claims: [
        { id: "clm-1", claim_number: "CLM-99210", patient_id: "p-1", payer_name: "Aetna", billing_provider: "Metro General Hospital", rendering_provider: "Dr. Sarah Connor", claim_date: "2026-05-01", total_charges: 15400.00, amount_paid: 0.00, amount_allowed: 12000.00, status: "Denied" },
        { id: "clm-2", claim_number: "CLM-88231", patient_id: "p-2", payer_name: "UnitedHealthcare", billing_provider: "Metro General Hospital", rendering_provider: "Dr. Sarah Connor", claim_date: "2026-05-10", total_charges: 8200.00, amount_paid: 8200.00, amount_allowed: 8200.00, status: "Paid" },
        { id: "clm-3", claim_number: "CLM-44391", patient_id: "p-3", payer_name: "BCBS", billing_provider: "Metro General Hospital", rendering_provider: "Dr. Gregory House", claim_date: "2026-05-15", total_charges: 24500.00, amount_paid: 0.00, amount_allowed: 20000.00, status: "Denied" }
    ],
    denials: [
        { id: "den-1", claim_id: "clm-1", denial_date: "2026-05-18", carc_code: "CO-50", carc_description: "Medical necessity not established", rarc_code: "N115", rarc_description: "Decision based on medical policy criteria", denied_amount: 15400.00, payer_notes: "Documentation does not support acute inpatient level of care criteria.", severity: "High", status: "New", assigned_to: "u-4" },
        { id: "den-3", claim_id: "clm-3", denial_date: "2026-05-22", carc_code: "CO-29", carc_description: "Time limit for filing has expired", rarc_code: "N211", rarc_description: "Filing deadline not met", denied_amount: 24500.00, payer_notes: "Claim received 180 days past date of service.", severity: "Critical", status: "New", assigned_to: "u-2" }
    ],
    medical_records: [
        { id: "mr-1", patient_id: "p-1", encounter_date: "2026-04-30", clinical_notes: "Patient presented with severe chest pain, radiating to left arm. Admitted to acute care cardiology ward. Troponin levels elevated at 0.45 ng/mL. EKG shows ST elevation in leads V1-V3. Immediate cardiac catheterization indicated.", diagnoses_codes: ["I21.3", "R07.9"], procedure_codes: ["93454", "99223"], facility_name: "Metro General Hospital", attending_physician: "Dr. Sarah Connor", file_path: "/records/pt_john_doe_cardiac.pdf", status: "Finalized" },
        { id: "mr-2", patient_id: "p-3", encounter_date: "2025-11-10", clinical_notes: "Outpatient orthopedic consult for degenerative joint disease of right hip. Patient reports pain 8/10, failure of conservative therapy (PT and NSAIDs for 6 months). Right total hip arthroplasty recommended.", diagnoses_codes: ["M16.11"], procedure_codes: ["27130"], facility_name: "Metro Orthopedics Clinic", attending_physician: "Dr. Gregory House", file_path: "/records/pt_robert_johnson_ortho.pdf", status: "Finalized" }
    ],
    payer_policies: [
        { id: "pol-1", payer_name: "Aetna", policy_name: "Acute Inpatient Coronary Artery Disease Criteria", policy_code: "CPB-0982", description: "Coverage policy details for acute care cardiology admissions", criteria_details: "Inpatient admission is covered when patient exhibits ST segment deviations, cardiac biomarkers above 99th percentile (Troponin > 0.04 ng/mL), or unstable vital signs.", effective_date: "2025-01-01", expiration_date: null, status: "Active" },
        { id: "pol-2", payer_name: "BCBS", policy_name: "Timely Filing Guidelines for Commercial Plans", policy_code: "POL-TF-90", description: "Standard claims filing timeframes", criteria_details: "All commercial clean claims must be submitted within 90 days from the date of service. Claims filed past 90 days require medical exception proof.", effective_date: "2024-01-01", expiration_date: null, status: "Active" }
    ],
    appeals: [],
    evidence_mappings: [],
    tasks: [
        { id: "tsk-1", title: "Review Aetna Cardiology Denial", description: "Check ECG clinical notes and verify troponin levels for appeal.", assigned_to: "u-4", assigned_by: "u-2", claim_id: "clm-1", denial_id: "den-1", appeal_id: null, due_date: "2026-06-25", priority: "High", status: "Pending" },
        { id: "tsk-2", title: "Sign-off Clinical Letter - Doe Appeal", description: "Verify cardiac necessity arguments in the draft letter.", assigned_to: "u-3", assigned_by: "u-4", claim_id: "clm-1", denial_id: "den-1", appeal_id: null, due_date: "2026-06-28", priority: "Medium", status: "Pending" }
    ],
    notifications: [
        { id: "not-1", user_id: "u-4", title: "New Denial Assigned", message: "Aetna claim CLM-99210 has been denied (CO-50). Check assignment.", type: "Claim Denied", is_read: false, status: "Unread", created_at: "2026-06-20T10:00:00Z" }
    ],
    audit_logs: [
        { id: "aud-1", user_id: "u-1", action_type: "SYSTEM_INITIALIZATION", table_name: null, record_id: null, old_values: null, new_values: { system: "ClaimShield AI v1.0 Live" }, ip_address: "127.0.0.1", user_agent: "Mozilla/5.0 System", created_at: "2026-06-20T12:00:00Z" }
    ]
};

// Seed Local Storage if empty
if (!localStorage.getItem('CLAIMSHIELD_DB')) {
    localStorage.setItem('CLAIMSHIELD_DB', JSON.stringify(MOCK_DATABASE));
}

// Global App State
const AppState = {
    db: JSON.parse(localStorage.getItem('CLAIMSHIELD_DB')),
    currentUser: null,
    currentView: 'dashboard',
    activeIntakeFile: null,
    selectedDenialForAppeal: null,
    
    // Save DB changes helper
    saveChanges: function() {
        localStorage.setItem('CLAIMSHIELD_DB', JSON.stringify(this.db));
        this.logAudit("SYSTEM_SAVE", null, null, null, { action: "Local DB persistence sync" });
    },
    
    // Audit Logging Engine
    logAudit: function(actionType, tableName, recordId, oldValues, newValues) {
        const log = {
            id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user_id: this.currentUser ? this.currentUser.id : null,
            action_type: actionType,
            table_name: tableName,
            record_id: recordId,
            old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
            new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
            ip_address: "192.168.10.87",
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
        };
        this.db.audit_logs.unshift(log);
        localStorage.setItem('CLAIMSHIELD_DB', JSON.stringify(this.db));
        
        // Log to Developer Console API log automatically
        DevConsole.logAPIResponse("AUDIT_TRIGGER", { action: actionType, status: "Success", log_id: log.id });
    }
};

// ============================================================================
// 2. Sample Documents for Intake Processing Simulation
// ============================================================================
const SAMPLE_DOCUMENTS = {
    denial_cardiac: {
        fileName: "denial_letter_clm98741.pdf",
        fileSize: "1.2 MB",
        fileType: "Denial Letter",
        ocrText: `PAYER: UnitedHealthcare
DATE OF REMITTANCE: June 15, 2026
CLAIM ID: CLM-98741
PATIENT NAME: Sarah Jenkins
DATE OF SERVICE: May 20, 2026
CHARGES SUBMITTED: $8,450.00
CPT CODE: 93458 (Left Heart Catheterization)
ICD-10 CODE: I25.110 (Atherosclerotic heart disease with unstable angina pectoris)
DENIAL REASON CODE: CO-197
EXPLANATION: Pre-certification/authorization was absent. This procedure requires prior notification or authorization prior to rendering elective outpatient cardiac catheterizations.
APPEAL DEADLINE: September 13, 2026 (90 days from denial date)`,
        metadata: {
            claim_number: "CLM-98741",
            payer: "UnitedHealthcare",
            patient: "Sarah Jenkins",
            cpt_code: "93458",
            icd10_code: "I25.110",
            denial_reason: "CO-197: Pre-certification/authorization absent",
            appeal_deadline: "2026-09-13"
        }
    },
    denial_ortho: {
        fileName: "denial_letter_clm33491.pdf",
        fileSize: "980 KB",
        fileType: "Denial Letter",
        ocrText: `PAYER: Blue Cross Blue Shield
DATE OF NOTICE: June 18, 2026
CLAIM ID: CLM-33491
PATIENT NAME: Robert Johnson
DATE OF SERVICE: November 10, 2025
TOTAL CHARGES: $24,500.00
CPT CODE: 27130 (Total Hip Arthroplasty)
ICD-10 CODE: M16.11 (Primary osteoarthritis, right hip)
REASON CODE: CO-29
REMARK CODE: N211
EXPLANATION: Claim submitted past the timely filing limit. Timely filing for this commercial network plan is 90 days from date of service. Claim was received on May 22, 2026.
APPEAL DEADLINE: August 17, 2026`,
        metadata: {
            claim_number: "CLM-33491",
            payer: "BCBS",
            patient: "Robert Johnson",
            cpt_code: "27130",
            icd10_code: "M16.11",
            denial_reason: "CO-29 / N211: Timely filing limit expired",
            appeal_deadline: "2026-08-17"
        }
    }
};

// ============================================================================
// 3. User Authentication & Role Switching
// ============================================================================
function initAuth() {
    const roleSelect = document.getElementById('role-select');
    
    // Default to Billing Specialist
    const defaultUser = AppState.db.users.find(u => u.role === "Billing Specialist");
    AppState.currentUser = defaultUser;
    
    roleSelect.value = defaultUser.id;
    updateUserUI();
    
    roleSelect.addEventListener('change', (e) => {
        const userId = e.target.value;
        const user = AppState.db.users.find(u => u.id === userId);
        
        const oldRole = AppState.currentUser.role;
        AppState.currentUser = user;
        AppState.logAudit("ROLE_SWITCH", "users", user.id, { role: oldRole }, { role: user.role });
        
        updateUserUI();
        // Re-render current view with new role parameters
        renderView(AppState.currentView);
    });
}

function updateUserUI() {
    const user = AppState.currentUser;
    // Update Badge
    const badge = document.getElementById('user-role-badge');
    badge.className = `role-badge role-${user.role.toLowerCase().replace(' ', '-')}`;
    badge.textContent = user.role;
    
    // Update Profile Summary
    document.getElementById('profile-name').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('avatar-initials').textContent = `${user.first_name[0]}${user.last_name[0]}`;
    
    // Restrict Sidebar items based on role
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
        const allowedRoles = item.getAttribute('data-roles');
        if (allowedRoles && allowedRoles !== 'All') {
            const rolesArray = allowedRoles.split(',');
            if (!rolesArray.includes(user.role)) {
                item.style.display = 'none';
                // If current view is hidden for this role, bounce back to dashboard
                if (AppState.currentView === item.getAttribute('data-view')) {
                    navigateTo('dashboard');
                }
            } else {
                item.style.display = 'block';
            }
        } else {
            item.style.display = 'block';
        }
    });
}

// ============================================================================
// 4. SPA Router/Navigation
// ============================================================================
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-item a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.parentElement.getAttribute('data-view');
            navigateTo(viewName);
        });
    });
}

function navigateTo(viewName) {
    AppState.currentView = viewName;
    
    // Update Sidebar Active state
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Toggle active view content
    document.querySelectorAll('.page-content').forEach(page => {
        if (page.id === `${viewName}-view`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    // Header title updates
    const titleText = viewName.charAt(0).toUpperCase() + viewName.slice(1).replace('-', ' ');
    document.getElementById('header-title').textContent = titleText;
    
    renderView(viewName);
}

// Render Router
function renderView(viewName) {
    switch(viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'claims':
            renderClaims();
            break;
        case 'denials':
            renderDenials();
            break;
        case 'denial-intake':
            renderDenialIntake();
            break;
        case 'appeal-generator':
            renderAppealGenerator();
            break;
        case 'analytics':
            renderAnalytics();
            break;
        case 'admin-console':
            renderAdminConsole();
            break;
    }
}

// ============================================================================
// 5. Views Rendering & Business Logic
// ============================================================================

// --- DASHBOARD VIEW ---
function renderDashboard() {
    const claims = AppState.db.claims;
    const denials = AppState.db.denials;
    const appeals = AppState.db.appeals;
    
    // Metrics calculations
    const totalDeniedAmt = denials.reduce((sum, d) => sum + parseFloat(d.denied_amount), 0);
    const totalRecoveredAmt = appeals.filter(a => a.status === 'Approved').reduce((sum, a) => sum + parseFloat(a.amount_recovered), 0);
    const openTasksCount = AppState.db.tasks.filter(t => t.status === 'Pending').length;
    
    // Update dashboard visual counters
    document.getElementById('metric-denied-amt').textContent = `$${totalDeniedAmt.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('metric-recovered-amt').textContent = `$${totalRecoveredAmt.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('metric-denials-count').textContent = denials.length;
    document.getElementById('metric-tasks-count').textContent = openTasksCount;
    
    // Draw SVG Chart dynamically
    drawDashboardCharts();
    
    // Render Dashboard Tasks List
    const taskList = document.getElementById('dashboard-tasks-list');
    taskList.innerHTML = '';
    
    const userTasks = AppState.db.tasks.filter(t => t.assigned_to === AppState.currentUser.id || AppState.currentUser.role === 'Admin');
    
    if (userTasks.length === 0) {
        taskList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 20px;">No assigned tasks.</div>`;
    } else {
        userTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: var(--bg-surface-elevated); border-radius: var(--radius-sm); border-left: 3px solid " + 
                (task.priority === 'Critical' || task.priority === 'High' ? 'var(--color-danger)' : 'var(--color-info)');
            
            taskEl.innerHTML = `
                <div>
                    <h5 style="margin-bottom: 4px; font-size: 0.875rem;">${task.title}</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${task.description}</p>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); block;">Due: ${task.due_date}</span>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.6875rem; margin-top: 5px;" onclick="completeTask('${task.id}')">Complete</button>
                </div>
            `;
            taskList.appendChild(taskEl);
        });
    }
}

function completeTask(taskId) {
    const taskIndex = AppState.db.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const oldTask = AppState.db.tasks[taskIndex];
        const updatedTask = {...oldTask, status: 'Completed'};
        AppState.db.tasks[taskIndex] = updatedTask;
        AppState.logAudit("TASK_COMPLETE", "tasks", taskId, oldTask, updatedTask);
        AppState.saveChanges();
        renderDashboard();
    }
}

function drawDashboardCharts() {
    const chartBox = document.getElementById('svg-chart-container');
    if (!chartBox) return;
    
    // Draw visual bars
    const denials = AppState.db.denials;
    const appeals = AppState.db.appeals;
    
    const countAetna = denials.filter(d => d.payer_notes.includes("Aetna") || d.claim_id === "clm-1").length;
    const countUHC = denials.filter(d => d.carc_code === 'CO-197').length;
    const countBCBS = denials.filter(d => d.claim_id === "clm-3").length;
    
    const maxVal = Math.max(countAetna, countUHC, countBCBS, 1);
    
    const scale = (val) => (val / maxVal) * 160; // Max height 160px
    
    chartBox.innerHTML = `
        <svg viewBox="0 0 400 220" class="svg-chart">
            <!-- Grid Lines -->
            <line x1="40" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="80" x2="380" y2="80" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="180" x2="380" y2="180" stroke="rgba(255,255,255,0.1)" />
            
            <!-- Bars -->
            <!-- Aetna -->
            <rect x="75" y="${180 - scale(countAetna)}" width="45" height="${scale(countAetna)}" fill="url(#grad-teal)" rx="4" />
            <text x="97.5" y="${170 - scale(countAetna)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countAetna}</text>
            
            <!-- UHC -->
            <rect x="175" y="${180 - scale(countUHC)}" width="45" height="${scale(countUHC)}" fill="url(#grad-indigo)" rx="4" />
            <text x="197.5" y="${170 - scale(countUHC)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countUHC}</text>
            
            <!-- BCBS -->
            <rect x="275" y="${180 - scale(countBCBS)}" width="45" height="${scale(countBCBS)}" fill="url(#grad-amber)" rx="4" />
            <text x="297.5" y="${170 - scale(countBCBS)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countBCBS}</text>
            
            <!-- Labels -->
            <text x="97.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">Aetna</text>
            <text x="197.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">UnitedHealthcare</text>
            <text x="297.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">BCBS</text>
            
            <!-- Gradients -->
            <defs>
                <linearGradient id="grad-teal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--color-primary)" />
                    <stop offset="100%" stop-color="rgba(14, 165, 233, 0.2)" />
                </linearGradient>
                <linearGradient id="grad-indigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--color-secondary)" />
                    <stop offset="100%" stop-color="rgba(99, 102, 241, 0.2)" />
                </linearGradient>
                <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--color-warning)" />
                    <stop offset="100%" stop-color="rgba(245, 158, 11, 0.2)" />
                </linearGradient>
            </defs>
        </svg>
    `;
}

// --- CLAIMS VIEW ---
function renderClaims() {
    const tbody = document.getElementById('claims-table-body');
    tbody.innerHTML = '';
    
    AppState.db.claims.forEach(claim => {
        const patient = AppState.db.patients.find(p => p.id === claim.patient_id);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="claim-id">${claim.claim_number}</td>
            <td>${patient ? `${patient.last_name}, ${patient.first_name}` : 'Unknown'}</td>
            <td>${claim.payer_name}</td>
            <td>${claim.claim_date}</td>
            <td>$${claim.total_charges.toLocaleString('en-US')}</td>
            <td>$${claim.amount_paid.toLocaleString('en-US')}</td>
            <td><span class="status-badge status-${claim.status.toLowerCase().replace(' ', '')}">${claim.status}</span></td>
            <td>
                ${claim.status === 'Denied' ? `<button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDirectAppeal('${claim.claim_number}')">Appeal</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleDirectAppeal(claimNumber) {
    const claim = AppState.db.claims.find(c => c.claim_number === claimNumber);
    if (claim) {
        const denial = AppState.db.denials.find(d => d.claim_id === claim.id);
        if (denial) {
            AppState.selectedDenialForAppeal = denial.id;
            navigateTo('appeal-generator');
        }
    }
}

// --- DENIALS VIEW ---
function renderDenials() {
    const tbody = document.getElementById('denials-table-body');
    tbody.innerHTML = '';
    
    AppState.db.denials.forEach(denial => {
        const claim = AppState.db.claims.find(c => c.id === denial.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        const assignee = AppState.db.users.find(u => u.id === denial.assigned_to);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="claim-id">${claim ? claim.claim_number : 'N/A'}</td>
            <td>${patient ? `${patient.last_name}, ${patient.first_name}` : 'Unknown'}</td>
            <td>${claim ? claim.payer_name : 'N/A'}</td>
            <td>${denial.carc_code}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${denial.carc_description}</td>
            <td>$${denial.denied_amount.toLocaleString('en-US')}</td>
            <td><span class="status-badge status-${denial.status.toLowerCase().replace(' ', '')}">${denial.status}</span></td>
            <td>${assignee ? assignee.first_name : 'Unassigned'}</td>
            <td>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="generateAppealFromDenial('${denial.id}')">Appeal</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function generateAppealFromDenial(denialId) {
    AppState.selectedDenialForAppeal = denialId;
    navigateTo('appeal-generator');
}

// --- DENIAL INTAKE VIEW ---
function renderDenialIntake() {
    const fileDrag = document.getElementById('file-drag');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('doc-preview-container');
    const previewBody = document.getElementById('doc-viewer-body');
    const extractionFields = document.getElementById('extraction-fields');
    
    // Reset file drag hover states
    fileDrag.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDrag.classList.add('dragover');
    });
    
    fileDrag.addEventListener('dragleave', () => {
        fileDrag.classList.remove('dragover');
    });
    
    fileDrag.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDrag.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUploadedFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });
}

// Visual OCR Processing Pipeline simulation
function handleUploadedFile(file) {
    const fileDrag = document.getElementById('file-drag');
    const ocrOverlay = document.getElementById('ocr-progress');
    const step1 = document.getElementById('step-ocr');
    const step2 = document.getElementById('step-class');
    const step3 = document.getElementById('step-meta');
    
    fileDrag.style.display = 'none';
    ocrOverlay.style.display = 'flex';
    
    // Reset classes
    step1.className = 'pipeline-step active';
    step2.className = 'pipeline-step';
    step3.className = 'pipeline-step';
    
    // Simulate OCR Scanning Stage (1.2s)
    setTimeout(() => {
        step1.className = 'pipeline-step completed';
        step2.className = 'pipeline-step active';
        
        // Simulate Document Classification Stage (1s)
        setTimeout(() => {
            step2.className = 'pipeline-step completed';
            step3.className = 'pipeline-step active';
            
            // Simulate Metadata Extraction Stage (1s)
            setTimeout(() => {
                step3.className = 'pipeline-step completed';
                
                // Done. Populate fields.
                ocrOverlay.style.display = 'none';
                fileDrag.style.display = 'flex';
                
                // Use a default mockup data if custom uploaded
                const data = SAMPLE_DOCUMENTS.denial_cardiac;
                populateExtractedData(data);
                
                AppState.logAudit("INTAKE_OCR_COMPLETED", "medical_records", null, null, { file_name: file.name, size: file.size });
            }, 1000);
        }, 1000);
    }, 1200);
}

// Load a specific sample document directly
function loadSampleIntake(type) {
    const docData = SAMPLE_DOCUMENTS[type];
    if (!docData) return;
    
    const fileDrag = document.getElementById('file-drag');
    const ocrOverlay = document.getElementById('ocr-progress');
    const step1 = document.getElementById('step-ocr');
    const step2 = document.getElementById('step-class');
    const step3 = document.getElementById('step-meta');
    
    fileDrag.style.display = 'none';
    ocrOverlay.style.display = 'flex';
    
    // Reset steps
    step1.className = 'pipeline-step active';
    step2.className = 'pipeline-step';
    step3.className = 'pipeline-step';
    
    setTimeout(() => {
        step1.className = 'pipeline-step completed';
        step2.className = 'pipeline-step active';
        
        setTimeout(() => {
            step2.className = 'pipeline-step completed';
            step3.className = 'pipeline-step active';
            
            setTimeout(() => {
                step3.className = 'pipeline-step completed';
                ocrOverlay.style.display = 'none';
                fileDrag.style.display = 'flex';
                
                populateExtractedData(docData);
                
                // Post API payload logging to DevConsole
                DevConsole.logAPIResponse("POST_INTAKE_OCR", docData.metadata);
            }, 800);
        }, 800);
    }, 1000);
}

function populateExtractedData(docData) {
    const ocrBox = document.getElementById('ocr-extracted-text');
    ocrBox.textContent = docData.ocrText;
    
    // Populate form inputs
    document.getElementById('intake-claim-number').value = docData.metadata.claim_number;
    document.getElementById('intake-payer').value = docData.metadata.payer;
    document.getElementById('intake-patient').value = docData.metadata.patient;
    document.getElementById('intake-cpt').value = docData.metadata.cpt_code;
    document.getElementById('intake-icd10').value = docData.metadata.icd10_code;
    document.getElementById('intake-reason').value = docData.metadata.denial_reason;
    document.getElementById('intake-deadline').value = docData.metadata.appeal_deadline;
}

// Submit intake results to database
function submitIntake() {
    const claimNumber = document.getElementById('intake-claim-number').value;
    const payer = document.getElementById('intake-payer').value;
    const patientName = document.getElementById('intake-patient').value;
    const cpt = document.getElementById('intake-cpt').value;
    const icd10 = document.getElementById('intake-icd10').value;
    const reason = document.getElementById('intake-reason').value;
    const deadline = document.getElementById('intake-deadline').value;
    
    if (!claimNumber || !patientName || !payer) {
        alert("Please extract and verify claim number, patient, and payer details first!");
        return;
    }
    
    // Check if patient already exists, otherwise create
    let patient = AppState.db.patients.find(p => `${p.first_name} ${p.last_name}`.toLowerCase() === patientName.toLowerCase());
    if (!patient) {
        const parts = patientName.split(' ');
        patient = {
            id: `p-${Date.now()}`,
            mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
            first_name: parts[0] || "Unknown",
            last_name: parts[1] || "Patient",
            date_of_birth: "1980-01-01",
            gender: "Unknown",
            insurance_provider: payer,
            insurance_policy_number: `POL-${Math.floor(10000 + Math.random() * 90000)}`,
            insurance_group_number: "GRP-MOCK",
            status: "Active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        AppState.db.patients.push(patient);
    }
    
    // Add to claims
    const claimId = `clm-${Date.now()}`;
    const newClaim = {
        id: claimId,
        claim_number: claimNumber,
        patient_id: patient.id,
        payer_name: payer,
        billing_provider: "Metro General Hospital",
        rendering_provider: "Dr. Sarah Connor",
        claim_date: new Date().toISOString().split('T')[0],
        total_charges: 8450.00,
        amount_paid: 0.00,
        amount_allowed: 8000.00,
        status: "Denied"
    };
    AppState.db.claims.push(newClaim);
    
    // Add to denials
    const denialId = `den-${Date.now()}`;
    const partsReason = reason.split(':');
    const carcCode = partsReason[0].trim();
    const carcDesc = partsReason[1] ? partsReason[1].trim() : reason;
    
    const newDenial = {
        id: denialId,
        claim_id: claimId,
        denial_date: new Date().toISOString().split('T')[0],
        carc_code: carcCode,
        carc_description: carcDesc,
        rarc_code: "N115",
        rarc_description: "Appeals documentation requirements",
        denied_amount: 8450.00,
        payer_notes: `Processed by ClaimShield AI Denial Intake. ${reason}. CPT: ${cpt}, ICD-10: ${icd10}`,
        severity: "High",
        status: "New",
        assigned_to: AppState.currentUser.id
    };
    AppState.db.denials.push(newDenial);
    
    // Add Audit Log
    AppState.logAudit("DENIAL_INTAKE_SUBMIT", "denials", denialId, null, newDenial);
    AppState.saveChanges();
    
    alert(`Success! Denial letter processed. Claim ${claimNumber} has been logged and assigned.`);
    
    // Clean inputs
    document.getElementById('intake-claim-number').value = '';
    document.getElementById('intake-payer').value = '';
    document.getElementById('intake-patient').value = '';
    document.getElementById('intake-cpt').value = '';
    document.getElementById('intake-icd10').value = '';
    document.getElementById('intake-reason').value = '';
    document.getElementById('intake-deadline').value = '';
    document.getElementById('ocr-extracted-text').textContent = 'Upload or select a document to perform OCR scan and extract details.';
    
    navigateTo('denials');
}

// --- APPEAL GENERATOR VIEW ---
function renderAppealGenerator() {
    const listDiv = document.getElementById('denials-selection-list');
    listDiv.innerHTML = '';
    
    // Filter denials that need appeal drafting
    const activeDenials = AppState.db.denials.filter(d => d.status === 'New' || d.status === 'Reviewing' || d.status === 'Appeal Drafted');
    
    if (activeDenials.length === 0) {
        listDiv.innerHTML = `<p style="color: var(--text-muted); font-size: 0.875rem;">No active denials in queue requiring appeal.</p>`;
        return;
    }
    
    activeDenials.forEach(denial => {
        const claim = AppState.db.claims.find(c => c.id === denial.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        
        const option = document.createElement('div');
        option.style.cssText = `padding: 12px; background-color: var(--bg-surface-elevated); border: 1px solid ${AppState.selectedDenialForAppeal === denial.id ? 'var(--color-primary)' : 'var(--border-color)'}; border-radius: var(--radius-sm); margin-bottom: 8px; cursor: pointer; transition: var(--transition-fast);`;
        
        option.innerHTML = `
            <div style="font-weight: 600; font-size: 0.875rem; display: flex; justify-content: space-between;">
                <span>${claim ? claim.claim_number : 'CLM-N/A'} - ${claim ? claim.payer_name : 'N/A'}</span>
                <span class="status-badge status-${denial.status.toLowerCase().replace(' ', '')}">${denial.status}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                Patient: ${patient ? `${patient.last_name}, ${patient.first_name}` : 'Unknown'} | Reason: ${denial.carc_code} (${denial.carc_description})
            </div>
        `;
        
        option.addEventListener('click', () => {
            AppState.selectedDenialForAppeal = denial.id;
            renderAppealGenerator(); // Reload to update selections
        });
        
        listDiv.appendChild(option);
    });
    
    // Populate Right Panel details if denial is selected
    const selectedDenial = AppState.db.denials.find(d => d.id === AppState.selectedDenialForAppeal);
    const detailBox = document.getElementById('selected-denial-details');
    
    if (selectedDenial) {
        const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        
        detailBox.innerHTML = `
            <div><strong>Claim Ref:</strong> ${claim ? claim.claim_number : 'N/A'}</div>
            <div><strong>Patient Name:</strong> ${patient ? `${patient.first_name} ${patient.last_name}` : 'N/A'} (DOB: ${patient ? patient.date_of_birth : 'N/A'})</div>
            <div><strong>Payer Provider:</strong> ${claim ? claim.payer_name : 'N/A'}</div>
            <div><strong>Denial Reason Code:</strong> ${selectedDenial.carc_code} - ${selectedDenial.carc_description}</div>
            <div><strong>Total Denied Amount:</strong> $${selectedDenial.denied_amount.toLocaleString('en-US')}</div>
            <div><strong>Clinical Notes Extracted:</strong> Troponin levels elevated (0.45 ng/mL). Vital signs unstable. ECG shows acute ST elevation.</div>
        `;
    } else {
        detailBox.innerHTML = `<div style="color: var(--text-muted);">Please select a denied claim from the list on the left to review metrics and evidence.</div>`;
    }
}

// Generate the Appeal Letter draft using pre-configured clinical and billing templates
function generateAppealDraft(templateType) {
    const selectedDenial = AppState.db.denials.find(d => d.id === AppState.selectedDenialForAppeal);
    if (!selectedDenial) {
        alert("Please select a denial from the list first!");
        return;
    }
    
    const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
    const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
    const policy = AppState.db.payer_policies.find(pol => pol.payer_name === claim.payer_name);
    
    const txtBox = document.getElementById('appeal-letter-text');
    
    // Highlight template selection in UI
    document.querySelectorAll('.template-option').forEach(opt => {
        if (opt.getAttribute('data-type') === templateType) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    let template = '';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (templateType === 'medical_necessity') {
        template = `CLAIMSHIELD AI CLINICAL APPEAL ASSISTANCE
DATE: ${dateStr}

TO: ${claim.payer_name} Appeals Department
RE: Medical Necessity Appeal for Claim Number ${claim.claim_number}

PATIENT INFORMATION:
Patient Name: ${patient.first_name} ${patient.last_name}
Date of Birth: ${patient.date_of_birth}
Insurance Policy #: ${patient.insurance_policy_number}
Group #: ${patient.insurance_group_number}
Date of Service: ${claim.claim_date}

Dear Appeals Committee,

This letter serves as a formal appeal regarding the denial of the acute coronary treatment provided on ${claim.claim_date}. Your denial reference asserts "${selectedDenial.carc_description}".

We dispute this denial as the treatment meets all criteria of clinical coverage policies (including CPB-0982):
1. Patient presented to the emergency department with severe, crushing chest pain radiating to the left arm.
2. Objective clinical evidence: Troponin levels were critically elevated at 0.45 ng/mL (standard range < 0.04 ng/mL), establishing active myocardial damage.
3. Diagnostic testing: EKG demonstrated acute ST elevations in leads V1-V3.

Under medical guidelines, acute cardiac catheterization was immediately indicated to preserve life. Discharging the patient or providing treatment in an outpatient setting would have violated standard cardiology treatment protocols.

We request an immediate review and reversal of this denial. Please credit the amount of $${selectedDenial.denied_amount} to our accounts.

Sincerely,
Dr. Sarah Connor, MD
Metro General Cardiology`;
    } 
    else if (templateType === 'timely_filing') {
        template = `CLAIMSHIELD AI BILLING APPEAL ASSISTANCE
DATE: ${dateStr}

TO: ${claim.payer_name} Appeals Department
RE: Timely Filing Appeal for Claim Number ${claim.claim_number}

PATIENT INFORMATION:
Patient Name: ${patient.first_name} ${patient.last_name}
Date of Birth: ${patient.date_of_birth}
Insurance Policy #: ${patient.insurance_policy_number}
Date of Service: ${claim.claim_date}

Dear Appeals Coordinator,

This is an appeal for the timely filing denial of Claim ${claim.claim_number}. The claim was returned with denial code CO-29.

We would like to note that the delay in submission was due to an administration error in recording the patient's primary insurance coverage. The claim was submitted immediately upon receiving updated billing coordinates. 

Additionally, the patient's record shows they were hospitalized and unable to provide the policy cards. Enclosed you will find:
1. Copy of the patient intake record demonstrating initial documentation attempts.
2. Proof of timely coordination from the secondary payer.

We request a timely filing waiver be applied to this claim. Thank you for your review.

Sincerely,
Billing Department
Metro General Hospital`;
    }
    else {
        template = `CLAIMSHIELD AI PRIOR AUTHORIZATION APPEAL
DATE: ${dateStr}

TO: ${claim.payer_name} Appeals and Grievances
RE: Prior Authorization Retroactive Appeal for Claim ${claim.claim_number}

PATIENT INFORMATION:
Patient Name: ${patient.first_name} ${patient.last_name}
Date of Birth: ${patient.date_of_birth}
Insurance Policy #: ${patient.insurance_policy_number}

Dear Appeals Reviewer,

We are appealing the denial of coverage due to lack of prior authorization. 

The procedure was rendered on an urgent basis. The patient was admitted through the emergency department, and immediate intervention was necessary due to deteriorating hemodynamics. Prior authorization was not clinically feasible without compromising patient outcome.

We ask for retroactive review and approval of coverage.

Sincerely,
Appeals Specialist`;
    }
    
    txtBox.value = template;
    
    // Log API simulation output
    DevConsole.logAPIResponse("POST_APPEAL_DRAFT", {
        denial_id: selectedDenial.id,
        template: templateType,
        generated_letters_count: 1
    });
}

function submitAppealLetter() {
    const text = document.getElementById('appeal-letter-text').value;
    const selectedDenial = AppState.db.denials.find(d => d.id === AppState.selectedDenialForAppeal);
    
    if (!text || !selectedDenial) {
        alert("Please generate or write an appeal letter draft first!");
        return;
    }
    
    // Create new appeal record in database
    const appealId = `app-${Date.now()}`;
    const newAppeal = {
        id: appealId,
        denial_id: selectedDenial.id,
        appeal_number: `APP-${Math.floor(100000 + Math.random() * 900000)}`,
        generated_by: AppState.currentUser.id,
        physician_signoff_by: AppState.currentUser.role === 'Physician' ? AppState.currentUser.id : null,
        appeal_letter_text: text,
        submission_date: new Date().toISOString().split('T')[0],
        submission_method: "Electronic portal",
        tracking_number: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
        outcome_date: null,
        amount_recovered: 0.00,
        status: AppState.currentUser.role === 'Physician' ? 'Pending Submission' : 'Physician Review Required'
    };
    AppState.db.appeals.push(newAppeal);
    
    // Update denial status
    const oldDenial = {...selectedDenial};
    selectedDenial.status = 'Appeal Drafted';
    
    // Update claim status
    const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
    if (claim) {
        claim.status = 'Under Appeal';
    }
    
    // Log Audit and save
    AppState.logAudit("APPEAL_SUBMIT", "appeals", appealId, null, newAppeal);
    AppState.logAudit("DENIAL_STATUS_UPDATE", "denials", selectedDenial.id, oldDenial, selectedDenial);
    AppState.saveChanges();
    
    alert(`Appeal letter successfully created! Status: ${newAppeal.status}`);
    
    // Reset view selection
    AppState.selectedDenialForAppeal = null;
    document.getElementById('appeal-letter-text').value = '';
    navigateTo('denials');
}

// --- ANALYTICS VIEW ---
function renderAnalytics() {
    const totalDenied = AppState.db.denials.reduce((sum, d) => sum + parseFloat(d.denied_amount), 0);
    const recovered = AppState.db.appeals.filter(a => a.status === 'Approved').reduce((sum, a) => sum + parseFloat(a.amount_recovered), 0);
    const pendingAppeals = AppState.db.appeals.filter(a => a.status === 'Submitted' || a.status === 'Pending Submission' || a.status === 'Physician Review Required').length;
    
    document.getElementById('analytics-denied-total').textContent = `$${totalDenied.toLocaleString('en-US')}`;
    document.getElementById('analytics-recovered-total').textContent = `$${recovered.toLocaleString('en-US')}`;
    document.getElementById('analytics-pending-count').textContent = pendingAppeals;
}

// --- ADMIN CONSOLE VIEW ---
function renderAdminConsole() {
    const list = document.getElementById('admin-audit-logs-list');
    list.innerHTML = '';
    
    AppState.db.audit_logs.forEach(log => {
        const user = AppState.db.users.find(u => u.id === log.user_id);
        const item = document.createElement('div');
        item.className = 'audit-log-item';
        
        item.innerHTML = `
            <div class="audit-meta">
                <span style="color: var(--color-primary); font-weight: bold;">${log.action_type}</span>
                <span style="color: var(--text-muted);">${new Date(log.created_at).toLocaleString()}</span>
            </div>
            <div>
                <strong>User:</strong> ${user ? `${user.first_name} ${user.last_name} (${user.role})` : 'System'} | 
                <strong>Target table:</strong> ${log.table_name || 'N/A'} | 
                <span class="audit-json-toggle" onclick="toggleAuditJSON('${log.id}')">Toggle Raw JSON Payload</span>
            </div>
            <pre id="json-${log.id}" class="audit-json">${JSON.stringify(log, null, 2)}</pre>
        `;
        list.appendChild(item);
    });
}

function toggleAuditJSON(logId) {
    const pre = document.getElementById(`json-${logId}`);
    if (pre) {
        pre.classList.toggle('active');
    }
}

// ============================================================================
// 6. Developer Console Panel (DB Schema, API swagger docs, Mock calls)
// ============================================================================
const DevConsole = {
    activeTab: 'schema',
    
    toggle: function() {
        const consoleEl = document.getElementById('dev-console');
        consoleEl.classList.toggle('active');
        if (consoleEl.classList.contains('active')) {
            this.render();
            AppState.logAudit("DEV_CONSOLE_OPEN", null, null, null, null);
        }
    },
    
    switchTab: function(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('.dev-tab').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        this.render();
    },
    
    render: function() {
        const body = document.getElementById('dev-body');
        body.innerHTML = '';
        
        if (this.activeTab === 'schema') {
            body.innerHTML = `
                <div class="schema-diagram-box">
                    <h4 style="color: white; margin-bottom: 10px;">PostgreSQL Tables & Entity Definition</h4>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 15px;">
                        Schema scripts generated are saved in <a href="file:///c:/Users/AmeetKumarPanda/Documents/AI Docs/ClaimShield-AI/schema.sql" style="color: var(--color-primary)">schema.sql</a>. 
                    </div>
                    
                    <div class="schema-table-def">
                        <div class="schema-table-title">users (PK: id)</div>
                        <div class="schema-field-list">
                            <span class="schema-field-name">id</span><span class="schema-field-type">UUID DEFAULT uuid_generate_v4()</span>
                            <span class="schema-field-name">username</span><span class="schema-field-type">VARCHAR(50) UNIQUE</span>
                            <span class="schema-field-name">role</span><span class="schema-field-type">VARCHAR(30) (Admin, Physician...)</span>
                            <span class="schema-field-name">status</span><span class="schema-field-type">VARCHAR(20) DEFAULT 'Active'</span>
                        </div>
                    </div>
                    
                    <div class="schema-table-def">
                        <div class="schema-table-title">claims (PK: id, FK: patient_id)</div>
                        <div class="schema-field-list">
                            <span class="schema-field-name">id</span><span class="schema-field-type">UUID DEFAULT uuid_generate_v4()</span>
                            <span class="schema-field-name">claim_number</span><span class="schema-field-type">VARCHAR(50) UNIQUE</span>
                            <span class="schema-field-name">patient_id</span><span class="schema-field-type">UUID REFERENCES patients(id)</span>
                            <span class="schema-field-name">total_charges</span><span class="schema-field-type">NUMERIC(12, 2)</span>
                            <span class="schema-field-name">status</span><span class="schema-field-type">VARCHAR(30)</span>
                        </div>
                    </div>

                    <div class="schema-table-def">
                        <div class="schema-table-title">denials (PK: id, FK: claim_id)</div>
                        <div class="schema-field-list">
                            <span class="schema-field-name">id</span><span class="schema-field-type">UUID DEFAULT uuid_generate_v4()</span>
                            <span class="schema-field-name">claim_id</span><span class="schema-field-type">UUID REFERENCES claims(id)</span>
                            <span class="schema-field-name">carc_code</span><span class="schema-field-type">VARCHAR(10)</span>
                            <span class="schema-field-name">denied_amount</span><span class="schema-field-type">NUMERIC(12, 2)</span>
                            <span class="schema-field-name">status</span><span class="schema-field-type">VARCHAR(30)</span>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (this.activeTab === 'api') {
            body.innerHTML = `
                <div class="api-client-panel">
                    <h4 style="color: white; margin-bottom: 5px;">REST API Swagger Specification & Mock Sandbox</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 15px;">Send test requests to simulated endpoints to inspect response data.</p>
                    
                    <div class="endpoint-selector">
                        <select id="api-endpoint" style="flex-grow: 1;">
                            <option value="GET_CLAIMS">GET /api/claims (Fetch all claims)</option>
                            <option value="GET_DENIALS">GET /api/denials (Fetch active denials)</option>
                            <option value="POST_INTAKE">POST /api/denials/intake (Simulate OCR document upload)</option>
                        </select>
                        <button class="btn btn-primary" onclick="DevConsole.runMockAPI()">Send Request</button>
                    </div>
                    
                    <div style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); margin-top: 15px;">RESPONSE BODY (200 OK)</div>
                    <div id="api-response-box" class="response-log">Select an endpoint and click Send Request to inspect JSON metadata output.</div>
                </div>
            `;
        }
    },
    
    runMockAPI: function() {
        const endpoint = document.getElementById('api-endpoint').value;
        const resBox = document.getElementById('api-response-box');
        
        let result = {};
        if (endpoint === 'GET_CLAIMS') {
            result = AppState.db.claims;
        } else if (endpoint === 'GET_DENIALS') {
            result = AppState.db.denials;
        } else if (endpoint === 'POST_INTAKE') {
            result = {
                status: "success",
                code: 201,
                extracted_document: {
                    type: "Remittance Advice / Denial Letter",
                    claim_id: "CLM-98741",
                    payer: "UnitedHealthcare",
                    patient_name: "Sarah Jenkins",
                    codes: {
                        cpt: ["93458"],
                        icd10: ["I25.110"]
                    },
                    extraction_confidence: 0.98,
                    timely_filing_deadline: "2026-09-13"
                }
            };
        }
        resBox.textContent = JSON.stringify(result, null, 2);
    },
    
    logAPIResponse: function(apiAction, payload) {
        const resBox = document.getElementById('api-response-box');
        if (resBox) {
            resBox.textContent = `[API LOG - ${new Date().toLocaleTimeString()}] Action: ${apiAction}\n` + JSON.stringify(payload, null, 2);
        }
    }
};

// ============================================================================
// 7. App Initialization
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    
    // Open default view (Dashboard)
    navigateTo('dashboard');
    
    // Global exposure of functions for inline HTML event bindings
    window.navigateTo = navigateTo;
    window.loadSampleIntake = loadSampleIntake;
    window.submitIntake = submitIntake;
    window.generateAppealDraft = generateAppealDraft;
    window.submitAppealLetter = submitAppealLetter;
    window.toggleAuditJSON = toggleAuditJSON;
    window.completeTask = completeTask;
    window.handleDirectAppeal = handleDirectAppeal;
    window.generateAppealFromDenial = generateAppealFromDenial;
});
