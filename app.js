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

// Seed Local Storage if empty or outdated
const existingDbStr = localStorage.getItem('CLAIMSHIELD_DB');
let existingDb = null;
try {
    existingDb = existingDbStr ? JSON.parse(existingDbStr) : null;
} catch (e) {
    console.error("Failed to parse existing DB:", e);
}
if (!existingDb || !existingDb.users || !existingDb.audit_logs) {
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
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    if (token) {
        const payload = parseJwt(token);
        if (payload && payload.exp * 1000 > Date.now()) {
            AppState.sessionToken = token;
            const nameParts = (payload.name || "").split(" ");
            AppState.currentUser = {
                id: payload.user_id,
                name: payload.name,
                first_name: nameParts[0] || "User",
                last_name: nameParts.slice(1).join(" ") || "",
                email: payload.email,
                avatar_url: payload.avatar_url,
                role: payload.role,
                role_status: payload.role_status || "Approved",
                requested_role: payload.requested_role || null
            };

            const loginContainer = document.getElementById('login-container');
            const appContainer = document.getElementById('app-container');
            const reqContainer = document.getElementById('role-request-container');

            if (AppState.currentUser.role === 'Pending' || AppState.currentUser.role_status === 'Pending') {
                if (loginContainer) loginContainer.style.display = 'none';
                if (appContainer) appContainer.style.display = 'none';
                if (reqContainer) {
                    reqContainer.style.display = 'flex';
                    const statusText = document.getElementById('role-request-status-text');
                    const formArea = document.getElementById('role-request-form-area');
                    const pendingArea = document.getElementById('role-request-pending-area');
                    
                    if (AppState.currentUser.requested_role) {
                        if (formArea) formArea.style.display = 'none';
                        if (pendingArea) pendingArea.style.display = 'flex';
                        if (statusText) statusText.innerHTML = `Your access request for the role of <strong>${AppState.currentUser.requested_role}</strong> has been submitted and is pending review by an administrator.`;
                    } else {
                        if (formArea) formArea.style.display = 'flex';
                        if (pendingArea) pendingArea.style.display = 'none';
                        if (statusText) statusText.textContent = "To access the ClaimShield AI platform, please submit a request for the role you require. An administrator will review and assign your role.";
                    }
                }
                return;
            } else if (AppState.currentUser.role_status === 'Rejected') {
                if (loginContainer) loginContainer.style.display = 'none';
                if (appContainer) appContainer.style.display = 'none';
                if (reqContainer) {
                    reqContainer.style.display = 'flex';
                    const statusText = document.getElementById('role-request-status-text');
                    const formArea = document.getElementById('role-request-form-area');
                    const pendingArea = document.getElementById('role-request-pending-area');
                    if (formArea) formArea.style.display = 'flex';
                    if (pendingArea) pendingArea.style.display = 'none';
                    if (statusText) statusText.innerHTML = `<span style="color: var(--color-danger); font-weight: 600;">Access request rejected.</span> Please select a role to submit a new request.`;
                }
                return;
            }

            // Approved user flow
            if (loginContainer) loginContainer.style.display = 'none';
            if (reqContainer) reqContainer.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';
            
            // Instantly show the cached user details in UI
            updateUserUI();
            
            // Sync profile from backend database and then hydrate DB
            fetch("/api/users/me?cb=" + Date.now(), {
                headers: { 'Authorization': 'Bearer ' + token }
            }).then(meRes => {
                if (meRes.ok) {
                    return meRes.json();
                }
                throw new Error("Failed to sync profile");
            }).then(meData => {
                sessionStorage.setItem('CLAIMSHIELD_TOKEN', meData.session_token);
                AppState.sessionToken = meData.session_token;
                const freshPayload = parseJwt(meData.session_token);
                if (freshPayload) {
                    const nameParts = (freshPayload.name || "").split(" ");
                    AppState.currentUser = {
                        id: freshPayload.user_id,
                        name: freshPayload.name,
                        first_name: nameParts[0] || "User",
                        last_name: nameParts.slice(1).join(" ") || "",
                        email: freshPayload.email,
                        avatar_url: freshPayload.avatar_url,
                        role: freshPayload.role,
                        role_status: freshPayload.role_status || "Approved",
                        requested_role: freshPayload.requested_role || null
                    };
                }
            }).catch(err => {
                console.warn("Profile sync warning:", err);
            }).finally(() => {
                loadDbFromBackend().then(() => {
                    updateUserUI();
                    setupRoleSwitcher();
                    // Ensure current view is re-rendered with loaded data
                    const currentView = document.querySelector('.page-content.active');
                    if (currentView) {
                        navigateTo(currentView.id.replace('-view', ''));
                    } else {
                        navigateTo('dashboard');
                    }
                });
            });
            return;
        } else {
            sessionStorage.removeItem('CLAIMSHIELD_TOKEN');
        }
    }
    
    // Not logged in
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const reqContainer = document.getElementById('role-request-container');
    if (loginContainer) loginContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    if (reqContainer) reqContainer.style.display = 'none';
    
    const roleSelect = document.getElementById('role-select');
    const defaultUser = AppState.db.users.find(u => u.role === "Admin");
    AppState.currentUser = defaultUser;
    if (roleSelect) roleSelect.value = defaultUser.id;
    updateUserUI();
    
    if (roleSelect) {
        const newSelect = roleSelect.cloneNode(true);
        roleSelect.parentNode.replaceChild(newSelect, roleSelect);
        newSelect.addEventListener('change', (e) => {
            const userId = e.target.value;
            const user = AppState.db.users.find(u => u.id === userId);
            const oldRole = AppState.currentUser.role;
            AppState.currentUser = user;
            AppState.logAudit("ROLE_SWITCH", "users", user.id, { role: oldRole }, { role: user.role });
            updateUserUI();
            if(AppState.currentView) renderView(AppState.currentView);
        });
    }
    
    // Attempt to initialize Google SSO button immediately if SDK is already loaded
    initGoogleButton();
}

function setupRoleSwitcher() {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) return;
    
    // Set initial value based on current user's role
    const roleMap = {
        "Admin": "u-1",
        "Billing Specialist": "u-2",
        "Physician": "u-3",
        "Appeals Specialist": "u-4"
    };
    if (AppState.currentUser && AppState.currentUser.role) {
        roleSelect.value = roleMap[AppState.currentUser.role] || "u-2";
    }
    
    // Show role switcher only for ameetkumar709@gmail.com and mock logins
    const isMockOrAmeet = AppState.currentUser && (
        AppState.currentUser.id.startsWith("u-google-") ? (AppState.currentUser.email === "ameetkumar709@gmail.com") : true
    );
    const switcherContainer = document.querySelector('.user-selector-container');
    if (switcherContainer) {
        switcherContainer.style.display = isMockOrAmeet ? 'block' : 'none';
    }
    
    // Clone and replace element to prevent duplicate event listeners
    const newSelect = roleSelect.cloneNode(true);
    roleSelect.parentNode.replaceChild(newSelect, roleSelect);
    
    newSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        const targetRoles = {
            "u-1": "Admin",
            "u-2": "Billing Specialist",
            "u-3": "Physician",
            "u-4": "Appeals Specialist"
        };
        const newRole = targetRoles[val];
        if (!newRole) return;
        
        console.log("Switching session role to:", newRole);
        
        // If not logged in, just do mock local switch
        if (!AppState.sessionToken) {
            const user = AppState.db.users.find(u => u.id === val);
            if (user) {
                const oldRole = AppState.currentUser.role;
                AppState.currentUser = user;
                AppState.logAudit("ROLE_SWITCH", "users", user.id, { role: oldRole }, { role: user.role });
                updateUserUI();
                if (AppState.currentView) renderView(AppState.currentView);
            }
            return;
        }
        
        // Logged in: Call backend switch-role API
        try {
            const res = await fetch("/api/auth/switch-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + AppState.sessionToken
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('CLAIMSHIELD_TOKEN', data.session_token);
                window.location.reload();
            } else {
                console.error("Failed to switch role on backend:", await res.text());
            }
        } catch (err) {
            console.error("Error switching role:", err);
        }
    });
}

function updateUserUI() {
    const user = AppState.currentUser;
    if (!user) return;
    
    // Fallback parsing for first_name / last_name from user.name if needed
    let firstName = user.first_name || "";
    let lastName = user.last_name || "";
    if (!firstName && user.name) {
        const parts = user.name.split(" ");
        firstName = parts[0] || "User";
        lastName = parts.slice(1).join(" ") || "";
    }
    
    // Update Badge
    const badge = document.getElementById('user-role-badge');
    if (badge && user.role) {
        let roleClass = 'admin';
        if (user.role === 'Billing Specialist') roleClass = 'billing';
        else if (user.role === 'Physician') roleClass = 'physician';
        else if (user.role === 'Appeals Specialist') roleClass = 'appeals';
        else if (user.role === 'Admin') roleClass = 'admin';
        else roleClass = user.role.toLowerCase().replace(' ', '-');
        
        badge.className = `role-badge role-${roleClass}`;
        badge.textContent = user.role;
    }
    
    // Update Profile Summary
    const nameEl = document.getElementById('profile-name');
    if (nameEl) {
        nameEl.textContent = user.name || `${firstName} ${lastName}`.trim();
    }
    
    const initialsEl = document.getElementById('avatar-initials');
    if (initialsEl) {
        const firstInit = firstName ? firstName[0] : "U";
        const lastInit = lastName ? lastName[0] : "";
        initialsEl.textContent = `${firstInit}${lastInit}`.toUpperCase();
    }
    
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
        case 'document-intelligence':
            renderDocumentIntelligence();
            break;
        case 'analytics':
            renderAnalytics();
            break;
        case 'admin-console':
            renderAdminConsole();
            break;
        case 'medical-records':
            renderMedicalRecords();
            break;
        case 'payer-policies':
            renderPayerPolicies();
            break;
        case 'agent-workflow':
            renderAgentWorkflow();
            break;
        case 'copilot':
            renderCopilot();
            break;
        case 'n8n-workflows':
            switchN8NWorkflow(1);
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
    
    // Ensure tasks exist and have correct role assignments in AppState.db
    if (!AppState.db.tasks || AppState.db.tasks.length === 0) {
        AppState.db.tasks = [
            { id: "tsk-1", title: "Review HealthFirst Cardiology Denial", description: "Verify cardiac necessity arguments for patient appeal.", assigned_to: "u-4", assigned_by: "u-2", due_date: "2026-06-25", priority: "High", status: "Pending" },
            { id: "tsk-2", title: "Sign-off Clinical Letter - Doe Appeal", description: "Verify MRI clinical notes and signature requirement.", assigned_to: "u-3", assigned_by: "u-4", due_date: "2026-06-28", priority: "Medium", status: "Pending" }
        ];
        AppState.saveChanges();
    } else {
        // Correct task assignments if they got assigned to a google ID during seeding
        let changed = false;
        AppState.db.tasks.forEach(t => {
            if (t.id === "tsk-1" && t.assigned_to.startsWith("u-google")) {
                t.assigned_to = "u-4";
                changed = true;
            }
            if (t.id === "tsk-2" && t.assigned_to.startsWith("u-google")) {
                t.assigned_to = "u-3";
                changed = true;
            }
        });
        if (changed) {
            AppState.saveChanges();
        }
    }
    
    // Fetch Disaster Recovery status from backend
    if (AppState.sessionToken) {
        fetch("/api/recovery/status", {
            headers: { 'Authorization': 'Bearer ' + AppState.sessionToken }
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed to load DR status");
        })
        .then(data => {
            const drTotalDocs = document.getElementById('dashboard-dr-total-docs');
            const drLastBackup = document.getElementById('dashboard-dr-last-backup');
            const drStatus = document.getElementById('dashboard-dr-recovery-status');
            
            if (drTotalDocs) drTotalDocs.textContent = data.total_documents;
            if (drLastBackup) drLastBackup.textContent = data.last_backup_time;
            if (drStatus) {
                drStatus.textContent = data.sync_status === 'Synced' ? 'Healthy' : 'Syncing';
                drStatus.style.color = data.sync_status === 'Synced' ? 'var(--color-success)' : 'var(--color-warning)';
            }
        })
        .catch(err => console.warn("DR status sync warning:", err));
    }
    
    const roleIdMap = {
        'Admin': 'u-1',
        'Billing Specialist': 'u-2',
        'Physician': 'u-3',
        'Appeals Specialist': 'u-4'
    };
    const mappedMockId = roleIdMap[AppState.currentUser.role] || '';
    
    // Generate dynamic tasks from active appeals requiring physician review or payer submission
    const dynamicTasks = [];
    appeals.forEach(appeal => {
        const denial = AppState.db.denials.find(d => d.id === appeal.denial_id);
        const claim = denial ? AppState.db.claims.find(c => c.id === denial.claim_id) : null;
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";
        
        if (appeal.status === 'Physician Review Required') {
            dynamicTasks.push({
                id: `task-review-${appeal.id}`,
                title: `Sign-off Appeal Letter - ${appeal.appeal_number}`,
                description: `Verify clinical necessity and sign off for ${patientName}.`,
                assigned_to: 'u-3', // Physician
                due_date: appeal.submission_date || new Date().toISOString().split('T')[0],
                priority: 'High',
                status: 'Pending'
            });
        } else if (appeal.status === 'Pending Submission') {
            dynamicTasks.push({
                id: `task-submit-${appeal.id}`,
                title: `Submit Appeal ${appeal.appeal_number} to Payer`,
                description: `Submit signed-off appeal for ${patientName} to payer portal.`,
                assigned_to: 'u-4', // Appeals Specialist
                due_date: appeal.submission_date || new Date().toISOString().split('T')[0],
                priority: 'Critical',
                status: 'Pending'
            });
        }
    });

    const allTasks = [...(AppState.db.tasks || []), ...dynamicTasks];

    // Filter tasks that are pending and assigned to the current user's ID, role, or if user is Admin (admins see all)
    const userTasks = allTasks.filter(t => 
        t.status === 'Pending' && (
            t.assigned_to === AppState.currentUser.id || 
            t.assigned_to === mappedMockId || 
            AppState.currentUser.role === 'Admin'
        )
    );

    // Metrics calculations
    const totalDeniedAmt = denials.reduce((sum, d) => sum + (parseFloat(d.denied_amount) || 8450.00), 0);
    const totalRecoveredAmt = appeals.filter(a => a.status === 'Approved').reduce((sum, a) => sum + (parseFloat(a.amount_recovered) || 8450.00), 0);
    const openTasksCount = userTasks.length;
    
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
    
    // Render Dashboard Active Appeals Ledger
    const appealsTbody = document.getElementById('dashboard-appeals-table-body');
    if (appealsTbody) {
        appealsTbody.innerHTML = '';
        const appeals = AppState.db.appeals || [];
        if (appeals.length === 0) {
            appealsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">No active appeals.</td></tr>`;
        } else {
            appeals.forEach(appeal => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                
                // Find linked denial, claim, patient
                const denial = AppState.db.denials.find(d => d.id === appeal.denial_id);
                const claim = denial ? AppState.db.claims.find(c => c.id === denial.claim_id) : null;
                const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
                
                const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "N/A";
                const payerName = claim ? claim.payer_name : "N/A";
                
                // Status Badge Color Class
                let badgeClass = 'status-badge-pending';
                if (appeal.status === 'Approved') badgeClass = 'status-badge-success';
                else if (appeal.status === 'Rejected') badgeClass = 'status-badge-danger';
                else if (appeal.status === 'Submitted') badgeClass = 'status-badge-info';
                
                // Determine action buttons based on status and user role
                let actionHtml = '';
                if (appeal.status === 'Draft') {
                    actionHtml = `<button class="btn btn-primary" onclick="submitDraftForReview('${appeal.id}')" style="padding: 4px 8px; font-size: 0.75rem;">Submit for Review</button>`;
                } else if (appeal.status === 'Physician Review Required') {
                    if (AppState.currentUser.role === 'Physician' || AppState.currentUser.role === 'Admin') {
                        actionHtml = `<button class="btn btn-success" onclick="approveAppeal('${appeal.id}')" style="padding: 4px 8px; font-size: 0.75rem;">Approve & Sign Off</button>`;
                    } else {
                        actionHtml = `<span style="color: var(--text-muted); font-size: 0.75rem; font-style: italic;">Awaiting Sign-off</span>`;
                    }
                } else if (appeal.status === 'Pending Submission') {
                    actionHtml = `<button class="btn btn-primary" onclick="submitAppealToPayer('${appeal.id}')" style="padding: 4px 8px; font-size: 0.75rem;">Submit to Payer</button>`;
                } else if (appeal.status === 'Submitted') {
                    actionHtml = `
                        <button class="btn btn-success" onclick="simulatePayerDecision('${appeal.id}', 'Approved')" style="padding: 4px 8px; font-size: 0.7125rem; margin-right: 5px; cursor: pointer;">Simulate Approve</button>
                        <button class="btn btn-danger" onclick="simulatePayerDecision('${appeal.id}', 'Rejected')" style="padding: 4px 8px; font-size: 0.7125rem; cursor: pointer;">Simulate Reject</button>
                    `;
                } else {
                    actionHtml = `<span style="color: var(--text-muted); font-size: 0.75rem;">Completed</span>`;
                }
                
                tr.innerHTML = `
                    <td style="padding: 10px 5px; color: white; font-weight: 500;">${appeal.appeal_number}</td>
                    <td style="padding: 10px 5px; color: var(--text-secondary);">${patientName}</td>
                    <td style="padding: 10px 5px; color: var(--text-secondary);">${payerName}</td>
                    <td style="padding: 10px 5px; color: var(--text-secondary);">${appeal.submission_date || "N/A"}</td>
                    <td style="padding: 10px 5px; color: var(--text-secondary);">${appeal.tracking_number || "N/A"}</td>
                    <td style="padding: 10px 5px;">
                        <span class="status-badge ${badgeClass}">${appeal.status}</span>
                    </td>
                    <td style="padding: 10px 5px;">${actionHtml}</td>
                `;
                appealsTbody.appendChild(tr);
            });
        }
    }
}

async function completeTask(taskId) {
    if (taskId.startsWith('task-review-')) {
        const appealId = taskId.replace('task-review-', '');
        await approveAppeal(appealId);
    } else if (taskId.startsWith('task-submit-')) {
        const appealId = taskId.replace('task-submit-', '');
        await submitAppealToPayer(appealId);
    } else {
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
}

async function submitDraftForReview(appealId) {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        const res = await fetch(`/api/appeals/${appealId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ 
                status: "Physician Review Required"
            })
        });
        if (!res.ok) throw new Error("Failed to update appeal status on backend.");

        AppState.logAudit("APPEAL_SUBMIT_REVIEW", "appeals", appealId, null, { status: "Physician Review Required" });

        alert("Appeal successfully submitted for physician review!");
        await loadDbFromBackend();
        renderDashboard();
    } catch (err) {
        console.error("Error submitting appeal for review:", err);
        alert("Submission failed: " + err.message);
    }
}

function drawDashboardCharts() {
    const chartBox = document.getElementById('svg-chart-container');
    if (!chartBox) return;
    
    // Draw visual bars
    const denials = AppState.db.denials || [];
    const claims = AppState.db.claims || [];
    
    // Dynamic real-time count by payer
    let countHealthFirst = 0;
    let countUHC = 0;
    let countAetna = 0;
    
    denials.forEach(d => {
        const claim = claims.find(c => c.id === d.claim_id);
        if (claim && claim.payer_name) {
            const payer = claim.payer_name.toUpperCase();
            if (payer.includes("HEALTHFIRST")) {
                countHealthFirst++;
            } else if (payer.includes("UNITEDHEALTHCARE") || payer.includes("UHC")) {
                countUHC++;
            } else if (payer.includes("AETNA")) {
                countAetna++;
            }
        } else if (d.payer_notes && d.payer_notes.toUpperCase().includes("AETNA")) {
            countAetna++;
        }
    });
    
    const maxVal = Math.max(countHealthFirst, countUHC, countAetna, 1);
    const scale = (val) => (val / maxVal) * 160; // Max height 160px
    
    chartBox.innerHTML = `
        <svg viewBox="0 0 400 220" class="svg-chart">
            <!-- Grid Lines -->
            <line x1="40" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="80" x2="380" y2="80" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="180" x2="380" y2="180" stroke="rgba(255,255,255,0.1)" />
            
            <!-- Bars -->
            <!-- HealthFirst -->
            <rect x="75" y="${180 - scale(countHealthFirst)}" width="45" height="${scale(countHealthFirst)}" fill="url(#grad-teal)" rx="4" />
            <text x="97.5" y="${170 - scale(countHealthFirst)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countHealthFirst}</text>
            
            <!-- UHC -->
            <rect x="175" y="${180 - scale(countUHC)}" width="45" height="${scale(countUHC)}" fill="url(#grad-indigo)" rx="4" />
            <text x="197.5" y="${170 - scale(countUHC)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countUHC}</text>
            
            <!-- Aetna -->
            <rect x="275" y="${180 - scale(countAetna)}" width="45" height="${scale(countAetna)}" fill="url(#grad-amber)" rx="4" />
            <text x="297.5" y="${170 - scale(countAetna)}" fill="#fff" font-size="10" text-anchor="middle" font-weight="600">${countAetna}</text>
            
            <!-- Labels -->
            <text x="97.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">HealthFirst</text>
            <text x="197.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">UnitedHealthcare</text>
            <text x="297.5" y="200" fill="var(--text-secondary)" font-size="10" text-anchor="middle">Aetna</text>
            
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
    if (!tbody) return;
    tbody.innerHTML = '';
    
    AppState.db.claims.forEach(claim => {
        const patient = AppState.db.patients.find(p => p.id === claim.patient_id);
        const tr = document.createElement('tr');
        
        const totalCharges = parseFloat(claim.total_charges) || 0.00;
        const amountPaid = parseFloat(claim.amount_paid) || 0.00;
        
        tr.innerHTML = `
            <td class="claim-id">${claim.claim_number}</td>
            <td>${patient ? `${patient.last_name}, ${patient.first_name}` : 'Unknown'}</td>
            <td>${claim.payer_name}</td>
            <td>${claim.claim_date}</td>
            <td>$${totalCharges.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>$${amountPaid.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td><span class="status-badge status-${claim.status.toLowerCase().replace(' ', '')}">${claim.status}</span></td>
            <td>
                ${claim.status === 'Denied' ? `<button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; cursor: pointer;" onclick="handleDirectAppeal('${claim.claim_number}')">Appeal</button>` : ''}
                ${claim.status === 'Under Appeal' ? `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.75rem; cursor: pointer;" onclick="viewClaimAppeal('${claim.id}')">View Appeal</button>` : ''}
                ${claim.status !== 'Denied' && claim.status !== 'Under Appeal' ? '-' : ''}
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

function viewClaimAppeal(claimId) {
    const denial = AppState.db.denials.find(d => d.claim_id === claimId);
    if (denial) {
        const appeal = AppState.db.appeals.find(a => a.denial_id === denial.id);
        if (appeal) {
            navigateTo('dashboard');
            setTimeout(() => {
                const ledger = document.getElementById('dashboard-appeals-table-body');
                if (ledger) {
                    ledger.scrollIntoView({ behavior: 'smooth' });
                    const rows = ledger.getElementsByTagName('tr');
                    for (let row of rows) {
                        if (row.textContent.includes(appeal.appeal_number)) {
                            row.style.backgroundColor = 'rgba(14, 165, 233, 0.15)';
                            setTimeout(() => {
                                row.style.backgroundColor = '';
                            }, 3000);
                            break;
                        }
                    }
                }
            }, 100);
            return;
        }
    }
    alert("No active appeal found for this claim.");
}

function viewDenialAppeal(denialId) {
    const appeal = AppState.db.appeals.find(a => a.denial_id === denialId);
    if (appeal) {
        navigateTo('dashboard');
        setTimeout(() => {
            const ledger = document.getElementById('dashboard-appeals-table-body');
            if (ledger) {
                ledger.scrollIntoView({ behavior: 'smooth' });
                const rows = ledger.getElementsByTagName('tr');
                for (let row of rows) {
                    if (row.textContent.includes(appeal.appeal_number)) {
                        row.style.backgroundColor = 'rgba(14, 165, 233, 0.15)';
                        setTimeout(() => {
                            row.style.backgroundColor = '';
                        }, 3000);
                        break;
                    }
                }
            }
        }, 100);
        return;
    }
    alert("No active appeal found for this denial.");
}

// --- DENIALS VIEW ---
function renderDenials() {
    const tbody = document.getElementById('denials-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    AppState.db.denials.forEach(denial => {
        const claim = AppState.db.claims.find(c => c.id === denial.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        const assignee = AppState.db.users.find(u => u.id === denial.assigned_to);
        const tr = document.createElement('tr');
        
        const deniedAmt = parseFloat(denial.denied_amount) || 0.00;
        
        tr.innerHTML = `
            <td class="claim-id">${claim ? claim.claim_number : 'N/A'}</td>
            <td>${patient ? `${patient.last_name}, ${patient.first_name}` : 'Unknown'}</td>
            <td>${claim ? claim.payer_name : 'N/A'}</td>
            <td>${denial.carc_code}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${denial.carc_description}</td>
            <td>$${deniedAmt.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td><span class="status-badge status-${denial.status.toLowerCase().replace(' ', '')}">${denial.status}</span></td>
            <td>${assignee ? assignee.first_name : 'Unassigned'}</td>
            <td>
                ${denial.status === 'New' ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem; cursor: pointer;" onclick="generateAppealFromDenial('${denial.id}')">Appeal</button>` : ''}
                ${denial.status === 'Appealed' || denial.status === 'Appeal Drafted' ? `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem; cursor: pointer;" onclick="viewDenialAppeal('${denial.id}')">View Appeal</button>` : ''}
                ${denial.status === 'Resolved' ? '<span style="color: var(--color-success); font-size: 0.75rem;">Resolved</span>' : ''}
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
    
    // Intercept click on fileInput to prevent bubble recursion
    fileInput.onclick = (e) => {
        e.stopPropagation();
    };
    
    // Trigger hidden input click
    fileDrag.onclick = () => {
        fileInput.click();
    };
    
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
    
    // Render the documents table
    const tbody = document.getElementById('denial-documents-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const docs = AppState.db.documents || [];
    if (docs.length === 0) {
        tbody.innerHTML = `<tr id="denial-empty-row"><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No documents uploaded yet.</td></tr>`;
        return;
    }
    
    docs.forEach(doc => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        let badgeColorClass = 'status-badge-pending';
        if (doc.status === 'Completed' || doc.status === 'Analyzed') {
            badgeColorClass = 'status-badge-success';
        } else if (doc.status === 'Processing') {
            badgeColorClass = 'status-badge-progress';
        }
        
        tr.innerHTML = `
            <td style="padding: 10px 5px; color: white; font-weight: 500;">${doc.filename}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.document_type}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.upload_date}</td>
            <td style="padding: 10px 5px;">
                <span class="status-badge ${badgeColorClass}">${doc.status}</span>
            </td>
            <td style="padding: 10px 5px; text-align: right;">
                <button class="btn btn-secondary" onclick="viewDocumentPreview('${doc.id}')" style="padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); color: #cbd5e1; cursor: pointer;">
                    View Extraction
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleUploadedFile(file) {
    const docTypeSelect = document.getElementById('intake-doc-type');
    const docType = docTypeSelect ? docTypeSelect.value : "Denial Letter";
    
    const fileDrag = document.getElementById('file-drag');
    const ocrOverlay = document.getElementById('ocr-progress');
    const step1 = document.getElementById('step-ocr');
    const step2 = document.getElementById('step-class');
    const step3 = document.getElementById('step-meta');
    
    fileDrag.style.display = 'none';
    ocrOverlay.style.display = 'flex';
    
    step1.className = 'pipeline-step active';
    step2.className = 'pipeline-step';
    step3.className = 'pipeline-step';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    
    const headers = {};
    if (AppState.sessionToken) {
        headers['Authorization'] = 'Bearer ' + AppState.sessionToken;
    }
    
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: headers,
            body: formData
        });
        
        if (!res.ok) {
            throw new Error(await res.text());
        }
        
        const uploadResult = await res.json();
        const docId = uploadResult.id;
        console.log("File uploaded successfully. Doc ID:", docId);
        
        const pollInterval = setInterval(async () => {
            try {
                const checkRes = await fetch(`/api/documents/${docId}/extraction`, {
                    headers: headers
                });
                if (!checkRes.ok) return;
                
                const docDetails = await checkRes.json();
                
                const docListRes = await fetch("/api/documents", { headers: headers });
                if (!docListRes.ok) return;
                
                const docs = await docListRes.json();
                const currentDoc = docs.find(d => d.id === docId);
                if (!currentDoc) return;
                
                const status = currentDoc.status;
                console.log(`Polling doc status: ${status}`);
                
                if (status === "Uploaded") {
                    step1.className = 'pipeline-step active';
                } else if (status === "Processing") {
                    step1.className = 'pipeline-step completed';
                    step2.className = 'pipeline-step active';
                } else if (status === "Analyzed") {
                    step1.className = 'pipeline-step completed';
                    step2.className = 'pipeline-step completed';
                    step3.className = 'pipeline-step active';
                } else if (status === "Completed") {
                    step1.className = 'pipeline-step completed';
                    step2.className = 'pipeline-step completed';
                    step3.className = 'pipeline-step completed';
                    
                    clearInterval(pollInterval);
                    
                    ocrOverlay.style.display = 'none';
                    fileDrag.style.display = 'flex';
                    
                    const extData = docDetails.extracted_data || {};
                    const formattedData = {
                        ocrText: docDetails.text_content,
                        metadata: {
                            claim_number: extData.claim_number || "Extracted-" + docId,
                            payer: extData.payer || "Unknown Payer",
                            patient: extData.patient_name || "Extracted Patient",
                            cpt_code: extData.cpt_code || "",
                            icd10_code: extData.icd10_code || "",
                            denial_reason: extData.denial_reason || "Medical necessity not established.",
                            appeal_deadline: extData.appeal_deadline || ""
                        }
                    };
                    
                    populateExtractedData(formattedData);
                    
                    AppState.logAudit("INTAKE_OCR_COMPLETED", "medical_records", docId, null, { file_name: file.name, size: file.size });
                    
                    await loadDbFromBackend();
                    renderDenialIntake();
                }
            } catch (pollErr) {
                console.error("Error polling document status:", pollErr);
            }
        }, 1000);
        
    } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        alert("Failed to upload/process document: " + uploadErr.message);
        ocrOverlay.style.display = 'none';
        fileDrag.style.display = 'flex';
    }
}

function populateExtractedData(docData) {
    const ocrBox = document.getElementById('ocr-extracted-text');
    if (ocrBox) ocrBox.textContent = docData.ocrText;
    
    document.getElementById('intake-claim-number').value = docData.metadata.claim_number;
    document.getElementById('intake-payer').value = docData.metadata.payer;
    document.getElementById('intake-patient').value = docData.metadata.patient;
    document.getElementById('intake-cpt').value = docData.metadata.cpt_code;
    document.getElementById('intake-icd10').value = docData.metadata.icd10_code;
    document.getElementById('intake-reason').value = docData.metadata.denial_reason;
    document.getElementById('intake-deadline').value = docData.metadata.appeal_deadline;
}

async function submitIntake() {
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
    
    const headers = {
        "Content-Type": "application/json"
    };
    if (AppState.sessionToken) {
        headers["Authorization"] = "Bearer " + AppState.sessionToken;
    }
    
    try {
        let patient = AppState.db.patients.find(p => `${p.first_name} ${p.last_name}`.toLowerCase() === patientName.toLowerCase());
        let patientId = patient ? patient.id : null;
        
        if (!patient) {
            patientId = `pat-${Math.floor(Date.now() % 1000000)}`;
            const parts = patientName.split(' ');
            const newPatient = {
                id: patientId,
                first_name: parts[0] || "Unknown",
                last_name: parts.slice(1).join(" ") || "Patient",
                date_of_birth: "1980-01-01",
                insurance_provider: payer,
                insurance_policy_number: `POL-${Math.floor(10000 + Math.random() * 90000)}`
            };
            const pRes = await fetch("/api/patients", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(newPatient)
            });
            if (!pRes.ok) throw new Error("Failed to create patient: " + await pRes.text());
        }
        
        const claimId = `clm-${Math.floor(Date.now() % 1000000)}`;
        const newClaim = {
            id: claimId,
            claim_number: claimNumber,
            patient_id: patientId,
            payer_name: payer,
            claim_date: new Date().toISOString().split('T')[0],
            total_charges: 8450.00,
            amount_paid: 0.00,
            status: "Denied"
        };
        const cRes = await fetch("/api/claims", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(newClaim)
        });
        if (!cRes.ok) throw new Error("Failed to create claim: " + await cRes.text());
        
        const denialId = `den-${Math.floor(Date.now() % 1000000)}`;
        const partsReason = reason.split(':');
        const carcCode = partsReason[0].trim();
        const carcDesc = partsReason[1] ? partsReason[1].trim() : reason;
        
        const newDenial = {
            id: denialId,
            claim_id: claimId,
            denial_date: new Date().toISOString().split('T')[0],
            carc_code: carcCode,
            carc_description: carcDesc,
            denied_amount: 8450.00,
            payer_notes: `Processed by ClaimShield AI Denial Intake. ${reason}. CPT: ${cpt}, ICD-10: ${icd10}`,
            status: "New",
            assigned_to: AppState.currentUser ? AppState.currentUser.id : "u-1"
        };
        const dRes = await fetch("/api/denials", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(newDenial)
        });
        if (!dRes.ok) throw new Error("Failed to create denial: " + await dRes.text());
        
        AppState.logAudit("DENIAL_INTAKE_SUBMIT", "denials", denialId, null, newDenial);
        
        alert("Intake successfully processed and saved to Claims DB!");
        
        document.getElementById('intake-claim-number').value = '';
        document.getElementById('intake-payer').value = '';
        document.getElementById('intake-patient').value = '';
        document.getElementById('intake-cpt').value = '';
        document.getElementById('intake-icd10').value = '';
        document.getElementById('intake-reason').value = '';
        document.getElementById('intake-deadline').value = '';
        document.getElementById('ocr-extracted-text').textContent = 'Upload or select a document to perform OCR scan and extract details.';
        
        await loadDbFromBackend();
        navigateTo('denials');
        
    } catch (e) {
        console.error("Error submitting intake:", e);
        alert("Failed to submit intake: " + e.message);
    }
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
            <div><strong>Total Denied Amount:</strong> $${(parseFloat(selectedDenial.denied_amount) || 0.00).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div><strong>Clinical Notes Extracted:</strong> Troponin levels elevated (0.45 ng/mL). Vital signs unstable. ECG shows acute ST elevation.</div>
        `;
    } else {
        detailBox.innerHTML = `<div style="color: var(--text-muted);">Please select a denied claim from the list on the left to review metrics and evidence.</div>`;
    }
}

// Generate the Appeal Letter draft using pre-configured clinical and billing templates
async function generateAppealDraft(templateType) {
    const selectedDenial = AppState.db.denials.find(d => d.id === AppState.selectedDenialForAppeal);
    if (!selectedDenial) {
        alert("Please select a denial from the list first!");
        return;
    }
    
    document.querySelectorAll('.template-option').forEach(opt => {
        if (opt.getAttribute('data-type') === templateType) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    const txtBox = document.getElementById('appeal-letter-text');
    txtBox.value = "Generating appeal dynamically via AI... (this may take a few seconds)";
    
    const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
    const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
    const policy = claim ? AppState.db.payer_policies.find(p => p.payer_name === claim.payer_name) : null;
    
    const payload = {
        denial_reason: selectedDenial.carc_description || selectedDenial.payer_notes || "Medical necessity not established.",
        patient_info: patient ? `${patient.first_name} ${patient.last_name}, DOB: ${patient.date_of_birth}, Policy: ${patient.insurance_policy_number}` : "Unknown Patient",
        clinical_evidence: AppState.activeClinicalTimeline ? AppState.activeClinicalTimeline.map(t => `${t.date}: ${t.description}`).join(' | ') : "Evidence extracted from medical records."
    };
    
    try {
        const res = await fetch("/api/ai/appeal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error("Appeal generation failed.");
        const data = await res.json();
        
        txtBox.value = data.appeal_letter;
        
    } catch (e) {
        console.error("Error generating appeal:", e);
        txtBox.value = "Failed to generate appeal. Backend might be unavailable or missing dependencies.";
    }
}


async function submitAppealLetter() {
    const text = document.getElementById('appeal-letter-text').value;
    const selectedDenial = AppState.db.denials.find(d => d.id === AppState.selectedDenialForAppeal);
    
    if (!text || !selectedDenial) {
        alert("Please generate or write an appeal letter draft first!");
        return;
    }
    
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    
    // Create new appeal record
    const appealId = `app-${Date.now()}`;
    const newAppeal = {
        id: appealId,
        denial_id: selectedDenial.id,
        appeal_number: `APP-${Math.floor(100000 + Math.random() * 900000)}`,
        generated_by: AppState.currentUser ? AppState.currentUser.id : "u-2",
        physician_signoff_by: AppState.currentUser && (AppState.currentUser.role === 'Physician' || AppState.currentUser.role === 'Admin') ? AppState.currentUser.id : null,
        appeal_letter_text: text,
        submission_date: new Date().toISOString().split('T')[0],
        submission_method: "Electronic portal",
        tracking_number: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
        outcome_date: null,
        amount_recovered: 0.00,
        status: AppState.currentUser && (AppState.currentUser.role === 'Physician' || AppState.currentUser.role === 'Admin') ? 'Pending Submission' : 'Physician Review Required'
    };

    try {
        if (token) {
            // Post appeal to backend
            const appRes = await fetch("/api/appeals", {
                method: "POST",
                headers,
                body: JSON.stringify(newAppeal)
            });
            if (!appRes.ok) throw new Error("Failed to save appeal on backend: " + await appRes.text());

            // Update denial status
            await fetch(`/api/denials/${selectedDenial.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status: "Appeal Drafted" })
            });

            // Update claim status
            const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
            if (claim) {
                await fetch(`/api/claims/${claim.id}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ status: "Under Appeal" })
                });
            }
        } else {
            // Fallback for no-login local storage mode
            AppState.db.appeals.push(newAppeal);
            selectedDenial.status = 'Appeal Drafted';
            const claim = AppState.db.claims.find(c => c.id === selectedDenial.claim_id);
            if (claim) {
                claim.status = 'Under Appeal';
            }
        }

        // Log Audit and save locally
        AppState.logAudit("APPEAL_SUBMIT", "appeals", appealId, null, newAppeal);
        AppState.logAudit("DENIAL_STATUS_UPDATE", "denials", selectedDenial.id, { status: selectedDenial.status }, { status: "Appeal Drafted" });
        AppState.saveChanges();
        
        alert(`Appeal letter successfully created! Status: ${newAppeal.status}`);
        
        // Reset view selection
        AppState.selectedDenialForAppeal = null;
        document.getElementById('appeal-letter-text').value = '';
        
        await loadDbFromBackend();
        navigateTo('denials');
    } catch (err) {
        console.error("Error submitting appeal:", err);
        alert("Submission failed: " + err.message);
    }
}

// --- ANALYTICS VIEW ---
// --- ANALYTICS VIEW ---
function renderAnalytics() {
    const claims = AppState.db.claims || [];
    const denials = AppState.db.denials || [];
    const appeals = AppState.db.appeals || [];

    // Helper to calculate denied amount with robust fallbacks
    const getDeniedAmount = (d) => {
        if (d.denied_amount !== null && d.denied_amount !== undefined) {
            const amt = parseFloat(d.denied_amount);
            if (!isNaN(amt) && amt > 0) return amt;
        }
        const claim = claims.find(c => c.id === d.claim_id);
        if (claim) {
            const amt = parseFloat(claim.total_charges) || parseFloat(claim.amount_paid) || 0;
            if (amt > 0) return amt;
        }
        return 8450.00; // standard fallback
    };

    // Helper to calculate recovered amount with robust fallbacks
    const getRecoveredAmount = (a) => {
        if (a.amount_recovered !== null && a.amount_recovered !== undefined) {
            const amt = parseFloat(a.amount_recovered);
            if (!isNaN(amt)) return amt;
        }
        if (a.status === 'Approved') {
            const denial = denials.find(d => d.id === a.denial_id);
            if (denial) {
                return getDeniedAmount(denial);
            }
            return 8450.00;
        }
        return 0;
    };

    // KPI 1: Total Claims Count
    const totalClaimsCount = claims.length;
    const elTotalClaims = document.getElementById('analytics-total-claims');
    if (elTotalClaims) elTotalClaims.textContent = totalClaimsCount;

    // KPI 2: Total Denials Value (Gross Value Denied)
    const totalDeniedAmount = denials.reduce((sum, d) => sum + getDeniedAmount(d), 0);
    const elTotalDenials = document.getElementById('analytics-total-denials');
    if (elTotalDenials) elTotalDenials.textContent = `$${totalDeniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // KPI 3: Appeals Generated Count
    const totalAppealsCount = appeals.length;
    const elTotalAppeals = document.getElementById('analytics-total-appeals');
    if (elTotalAppeals) elTotalAppeals.textContent = totalAppealsCount;

    // KPI 4: Approval Rate (Overturn Success)
    const resolvedAppeals = appeals.filter(a => a.status === 'Approved' || a.status === 'Rejected');
    const approvedAppealsCount = resolvedAppeals.filter(a => a.status === 'Approved').length;
    const approvalRate = resolvedAppeals.length > 0 ? (approvedAppealsCount / resolvedAppeals.length) * 100 : 0.0;
    const elApprovalRate = document.getElementById('analytics-approval-rate');
    if (elApprovalRate) elApprovalRate.textContent = `${approvalRate.toFixed(1)}%`;

    // KPI 5: Recovered Revenue (Total Overturned)
    const totalRecoveredAmount = appeals.reduce((sum, a) => sum + getRecoveredAmount(a), 0);
    const elRecoveredRevenue = document.getElementById('analytics-recovered-revenue');
    if (elRecoveredRevenue) elRecoveredRevenue.textContent = `$${totalRecoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // KPI 6: Average Processing Time (Filing Turnaround)
    let totalDays = 0;
    let validDiffCount = 0;
    appeals.forEach(a => {
        if (a.submission_date) {
            const denial = denials.find(d => d.id === a.denial_id);
            if (denial && denial.denial_date) {
                const diffTime = new Date(a.submission_date) - new Date(denial.denial_date);
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                if (!isNaN(diffDays) && diffDays >= 0) {
                    totalDays += diffDays;
                    validDiffCount++;
                }
            }
        }
    });
    const avgDays = validDiffCount > 0 ? (totalDays / validDiffCount) : 2.4;
    const elProcessingTime = document.getElementById('analytics-processing-time');
    if (elProcessingTime) elProcessingTime.textContent = `${avgDays.toFixed(1)} Days`;

    // --- Revenue Recovery Monthly Trajectory SVG Chart ---
    const trendContainer = document.getElementById('analytics-trend-chart');
    if (trendContainer) {
        trendContainer.innerHTML = '';
        const width = 500;
        const height = 220;
        
        // Define last 6 months dynamically
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = d.toLocaleString('en-US', { month: 'short' });
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push({ key, label: monthStr });
        }
        
        const monthDenials = {};
        const monthRecoveries = {};
        months.forEach(m => {
            monthDenials[m.key] = 0;
            monthRecoveries[m.key] = 0;
        });
        
        denials.forEach(d => {
            if (d.denial_date) {
                const mKey = d.denial_date.substring(0, 7);
                if (monthDenials[mKey] !== undefined) {
                    monthDenials[mKey] += getDeniedAmount(d);
                }
            }
        });
        
        appeals.forEach(a => {
            const dateStr = a.outcome_date || a.submission_date || a.created_at;
            if (dateStr) {
                const mKey = dateStr.substring(0, 7);
                if (monthRecoveries[mKey] !== undefined) {
                    monthRecoveries[mKey] += getRecoveredAmount(a);
                }
            }
        });
        
        const maxVal = Math.max(...Object.values(monthDenials), ...Object.values(monthRecoveries), 1000);
        
        const padLeft = 60;
        const padRight = 20;
        const padTop = 25;
        const padBottom = 30;
        const activeW = width - padLeft - padRight;
        const activeH = height - padTop - padBottom;
        
        let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">`;
        svg += `
            <defs>
                <linearGradient id="trend-denial-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/>
                </linearGradient>
                <linearGradient id="trend-recovery-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
        `;
        
        // Draw grid lines and Y-axis ticks
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
            const y = padTop + activeH - (i / ticks) * activeH;
            const val = (i / ticks) * maxVal;
            svg += `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />`;
            svg += `<text x="${padLeft - 8}" y="${y + 4}" fill="var(--text-secondary)" font-size="10" text-anchor="end">$${Math.round(val).toLocaleString()}</text>`;
        }
        
        // Calculate points
        const pointsDenial = [];
        const pointsRecovery = [];
        months.forEach((m, idx) => {
            const x = padLeft + idx * (activeW / 5);
            const yD = padTop + activeH - (monthDenials[m.key] / maxVal) * activeH;
            const yR = padTop + activeH - (monthRecoveries[m.key] / maxVal) * activeH;
            pointsDenial.push({ x, y: yD, val: monthDenials[m.key] });
            pointsRecovery.push({ x, y: yR, val: monthRecoveries[m.key] });
            
            svg += `<text x="${x}" y="${height - 10}" fill="var(--text-secondary)" font-size="11" text-anchor="middle">${m.label}</text>`;
        });
        
        // Draw Area Paths
        let dAreaD = `M ${pointsDenial[0].x} ${padTop + activeH}`;
        let dLineD = `M ${pointsDenial[0].x} ${pointsDenial[0].y}`;
        let dAreaR = `M ${pointsRecovery[0].x} ${padTop + activeH}`;
        let dLineR = `M ${pointsRecovery[0].x} ${pointsRecovery[0].y}`;
        
        for (let i = 1; i < pointsDenial.length; i++) {
            dAreaD += ` L ${pointsDenial[i].x} ${pointsDenial[i].y}`;
            dLineD += ` L ${pointsDenial[i].x} ${pointsDenial[i].y}`;
            dAreaR += ` L ${pointsRecovery[i].x} ${pointsRecovery[i].y}`;
            dLineR += ` L ${pointsRecovery[i].x} ${pointsRecovery[i].y}`;
        }
        dAreaD += ` L ${pointsDenial[pointsDenial.length - 1].x} ${padTop + activeH} Z`;
        dAreaR += ` L ${pointsRecovery[pointsRecovery.length - 1].x} ${padTop + activeH} Z`;
        
        svg += `<path d="${dAreaD}" fill="url(#trend-denial-area)" />`;
        svg += `<path d="${dAreaR}" fill="url(#trend-recovery-area)" />`;
        
        svg += `<path d="${dLineD}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
        svg += `<path d="${dLineR}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
        
        const appendDots = (points, color) => {
            points.forEach(p => {
                svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#161b22" stroke-width="1.5" />`;
                if (p.val > 0) {
                    svg += `<text x="${p.x}" y="${p.y - 8}" fill="white" font-size="9" text-anchor="middle" font-weight="bold">$${Math.round(p.val).toLocaleString()}</text>`;
                }
            });
        };
        appendDots(pointsDenial, '#ef4444');
        appendDots(pointsRecovery, '#10b981');
        
        svg += `
            <g transform="translate(${width - 150}, 10)">
                <circle cx="5" cy="5" r="4" fill="#ef4444" />
                <text x="15" y="8" fill="var(--text-secondary)" font-size="10">Denials</text>
                <circle cx="70" cy="5" r="4" fill="#10b981" />
                <text x="80" y="8" fill="var(--text-secondary)" font-size="10">Recoveries</text>
            </g>
        `;
        
        svg += `</svg>`;
        trendContainer.innerHTML = svg;
    }

    // --- Denial Reason Code Distribution SVG Chart ---
    const reasonContainer = document.getElementById('analytics-reason-chart');
    if (reasonContainer) {
        reasonContainer.innerHTML = '';
        const width = 500;
        const height = 220;
        
        const getCarcCategory = (d) => {
            const code = (d.carc_code || '').toUpperCase().trim();
            const desc = (d.carc_description || d.payer_notes || '').toLowerCase();
            
            if (code === 'CO-50' || code.includes('50') || desc.includes('necessity') || desc.includes('conservative treatment') || desc.includes('medical records') || desc.includes('guideline')) {
                return 'CO-50';
            }
            if (code === 'CO-197' || code.includes('197') || desc.includes('authorization') || desc.includes('pre-certification') || desc.includes('pre-auth') || desc.includes('prior auth')) {
                return 'CO-197';
            }
            if (code === 'CO-29' || code.includes('29') || desc.includes('filing limit') || desc.includes('timely filing') || desc.includes('expired')) {
                return 'CO-29';
            }
            return 'Other';
        };
        
        const carcCounts = {
            'CO-50': 0,
            'CO-197': 0,
            'CO-29': 0,
            'Other': 0
        };
        
        denials.forEach(d => {
            const cat = getCarcCategory(d);
            carcCounts[cat]++;
        });
        
        const padLeft = 45;
        const padRight = 20;
        const padTop = 25;
        const padBottom = 30;
        const activeW = width - padLeft - padRight;
        const activeH = height - padTop - padBottom;
        
        const categories = Object.keys(carcCounts);
        const counts = Object.values(carcCounts);
        const maxCount = Math.max(...counts, 5);
        
        let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">`;
        svg += `
            <defs>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#2563eb" />
                </linearGradient>
            </defs>
        `;
        
        // Draw grid lines
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
            const y = padTop + activeH - (i / ticks) * activeH;
            const val = Math.round((i / ticks) * maxCount);
            svg += `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />`;
            svg += `<text x="${padLeft - 8}" y="${y + 4}" fill="var(--text-secondary)" font-size="10" text-anchor="end">${val}</text>`;
        }
        
        // Draw bars
        const barWidth = 50;
        categories.forEach((cat, idx) => {
            const count = carcCounts[cat];
            const barHeight = (count / maxCount) * activeH;
            const x = padLeft + (idx * (activeW / 4)) + (activeW / 8) - (barWidth / 2);
            const y = padTop + activeH - barHeight;
            
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(1, barHeight)}" fill="url(#bar-gradient)" rx="4" ry="4" />`;
            svg += `<text x="${x + barWidth / 2}" y="${y - 6}" fill="white" font-size="10" font-weight="bold" text-anchor="middle">${count}</text>`;
            svg += `<text x="${x + barWidth / 2}" y="${height - 12}" fill="var(--text-secondary)" font-size="11" text-anchor="middle">${cat}</text>`;
        });
        
        svg += `</svg>`;
        reasonContainer.innerHTML = svg;
    }

    // --- Historical Appeal Performance Matrix Table ---
    const tableBody = document.getElementById('analytics-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        const payerGroups = {};
        const standardPayers = ['HealthFirst', 'Aetna', 'UnitedHealthcare', 'BCBS'];
        standardPayers.forEach(p => {
            payerGroups[p.toLowerCase()] = {
                name: p,
                denialsCount: 0,
                appealsFiled: 0,
                overturned: 0,
                upheld: 0,
                totalFilingDays: 0,
                filingCount: 0
            };
        });
        
        denials.forEach(d => {
            const claim = claims.find(c => c.id === d.claim_id);
            if (!claim || !claim.payer_name) return;
            
            let pKey = claim.payer_name.toLowerCase().trim();
            if (pKey.includes('healthfirst')) pKey = 'healthfirst';
            else if (pKey.includes('aetna')) pKey = 'aetna';
            else if (pKey.includes('united') || pKey === 'uhc') pKey = 'unitedhealthcare';
            else if (pKey.includes('bcbs') || pKey.includes('blue cross') || pKey.includes('shield')) pKey = 'bcbs';
            
            if (!payerGroups[pKey]) {
                payerGroups[pKey] = {
                    name: claim.payer_name,
                    denialsCount: 0,
                    appealsFiled: 0,
                    overturned: 0,
                    upheld: 0,
                    totalFilingDays: 0,
                    filingCount: 0
                };
            }
            payerGroups[pKey].denialsCount++;
        });
        
        appeals.forEach(a => {
            const denial = denials.find(d => d.id === a.denial_id);
            const claim = denial ? claims.find(c => c.id === denial.claim_id) : null;
            if (!claim || !claim.payer_name) return;
            
            let pKey = claim.payer_name.toLowerCase().trim();
            if (pKey.includes('healthfirst')) pKey = 'healthfirst';
            else if (pKey.includes('aetna')) pKey = 'aetna';
            else if (pKey.includes('united') || pKey === 'uhc') pKey = 'unitedhealthcare';
            else if (pKey.includes('bcbs') || pKey.includes('blue cross') || pKey.includes('shield')) pKey = 'bcbs';
            
            if (!payerGroups[pKey]) {
                payerGroups[pKey] = {
                    name: claim.payer_name,
                    denialsCount: 0,
                    appealsFiled: 0,
                    overturned: 0,
                    upheld: 0,
                    totalFilingDays: 0,
                    filingCount: 0
                };
            }
            
            payerGroups[pKey].appealsFiled++;
            if (a.status === 'Approved') {
                payerGroups[pKey].overturned++;
            } else if (a.status === 'Rejected') {
                payerGroups[pKey].upheld++;
            }
            
            if (a.submission_date && denial && denial.denial_date) {
                const diffTime = new Date(a.submission_date) - new Date(denial.denial_date);
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                if (!isNaN(diffDays) && diffDays >= 0) {
                    payerGroups[pKey].totalFilingDays += diffDays;
                    payerGroups[pKey].filingCount++;
                }
            }
        });
        
        Object.values(payerGroups).forEach(group => {
            const totalAppealsResolved = group.overturned + group.upheld;
            const successRatio = totalAppealsResolved > 0 ? (group.overturned / totalAppealsResolved) * 100 : 0;
            const avgFilingTime = group.filingCount > 0 ? (group.totalFilingDays / group.filingCount) : 2.4;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${group.name}</strong></td>
                <td>${group.denialsCount}</td>
                <td>${group.appealsFiled}</td>
                <td><span class="status-badge status-paid">${group.overturned}</span></td>
                <td><span class="status-badge status-denied">${group.upheld}</span></td>
                <td><strong>${successRatio.toFixed(1)}%</strong></td>
                <td>${avgFilingTime.toFixed(1)} Days</td>
            `;
            tableBody.appendChild(tr);
        });
    }
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
// Document Intelligence, Evidence Mapping & Appeals Workflows Handlers
// ============================================================================

function renderDocumentIntelligence() {
    // Hide sub-screens
    const resScreen = document.getElementById('intel-results-screen');
    const mapScreen = document.getElementById('intel-mapping-screen');
    const appScreen = document.getElementById('intel-appeal-screen');
    if (resScreen) resScreen.style.display = 'none';
    if (mapScreen) mapScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'none';

    // Clear dropdown selectors
    const denialSelect = document.getElementById('intel-denial-select');
    const medicalSelect = document.getElementById('intel-medical-select');
    const policySelect = document.getElementById('intel-policy-select');

    if (denialSelect) denialSelect.innerHTML = '<option value="">-- No denial document selected --</option>';
    if (medicalSelect) medicalSelect.innerHTML = '<option value="">-- No medical document selected --</option>';
    if (policySelect) policySelect.innerHTML = '<option value="">-- No policy document selected --</option>';

    const docs = AppState.db.documents || [];
    docs.forEach(doc => {
        if (doc.status !== 'Completed' && doc.status !== 'Analyzed') return;
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = `${doc.filename} (Uploaded: ${doc.upload_date})`;

        if ((doc.document_type === 'Denial Letter' || doc.document_type === 'EOB' || doc.document_type === 'Supporting Document') && denialSelect) {
            denialSelect.appendChild(opt);
        } else if (doc.document_type === 'Medical Record' && medicalSelect) {
            medicalSelect.appendChild(opt);
        } else if (doc.document_type === 'Policy' && policySelect) {
            policySelect.appendChild(opt);
        }
    });
}

async function runDocumentIntelligenceWorkflow() {
    const denialSelect = document.getElementById('intel-denial-select');
    const medicalSelect = document.getElementById('intel-medical-select');
    const policySelect = document.getElementById('intel-policy-select');

    const denialId = denialSelect ? denialSelect.value : "";
    const medicalId = medicalSelect ? medicalSelect.value : "";
    const policyId = policySelect ? policySelect.value : "";

    if (!denialId || !medicalId || !policyId) {
        alert("Please select a Denial Letter, a Medical Record, and a Policy document!");
        return;
    }

    const btn = document.querySelector('[onclick="runDocumentIntelligenceWorkflow()"]');
    const originalText = btn ? btn.textContent : "Process & Map Evidence";
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Processing & Mapping...";
    }

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        // 1. Fetch extractions in parallel
        const [denialRes, medicalRes, policyRes] = await Promise.all([
            fetch(`/api/documents/${denialId}/extraction`, { headers }),
            fetch(`/api/documents/${medicalId}/extraction`, { headers }),
            fetch(`/api/documents/${policyId}/extraction`, { headers })
        ]);

        if (!denialRes.ok || !medicalRes.ok || !policyRes.ok) {
            throw new Error("Failed to retrieve extraction results for one or more documents.");
        }

        const [denialData, medicalData, policyData] = await Promise.all([
            denialRes.json(),
            medicalRes.json(),
            policyRes.json()
        ]);

        const denialExt = denialData.extracted_data || {};
        const medicalExt = medicalData.extracted_data || {};
        const policyExt = policyData.extracted_data || {};

        // Cache in AppState
        AppState.intelDenial = denialExt;
        AppState.intelMedical = medicalExt;
        AppState.intelPolicy = policyExt;
        AppState.intelDenialId = denialId;

        // 2. Populate results cards in the UI
        document.getElementById('res-claim-number').textContent = denialExt.claim_number || "N/A";
        document.getElementById('res-payer').textContent = denialExt.payer || "N/A";
        document.getElementById('res-cpt-code').textContent = denialExt.cpt_code || "N/A";
        document.getElementById('res-icd10-code').textContent = denialExt.icd10_code || "N/A";
        document.getElementById('res-appeal-deadline').textContent = denialExt.appeal_deadline || "N/A";
        document.getElementById('res-denial-reason').textContent = denialExt.denial_reason || "N/A";

        document.getElementById('res-diagnoses').textContent = (medicalExt.diagnoses || []).join(', ') || "N/A";
        document.getElementById('res-symptoms').textContent = (medicalExt.symptoms || []).join(', ') || "N/A";
        document.getElementById('res-treatments').textContent = (medicalExt.failed_treatments || []).join(', ') || "N/A";
        document.getElementById('res-neuro').textContent = (medicalExt.neurological_findings || []).join(', ') || "N/A";
        document.getElementById('res-recommendation').textContent = medicalExt.physician_recommendation || "N/A";

        document.getElementById('res-policy-criteria').textContent = (policyExt.coverage_criteria || []).join(', ') || "N/A";
        document.getElementById('res-policy-necessity').textContent = (policyExt.medical_necessity_requirements || []).join(', ') || "N/A";
        document.getElementById('res-policy-exclusions').textContent = (policyExt.exclusions || []).join(', ') || "N/A";

        // Show results screen
        const resScreen = document.getElementById('intel-results-screen');
        if (resScreen) resScreen.style.display = 'flex';

        // 3. Perform Evidence Mapping
        const mapRes = await fetch("/api/ai/evidence-map", {
            method: "POST",
            headers,
            body: JSON.stringify({
                medical_record: medicalExt,
                policy: policyExt
            })
        });

        if (!mapRes.ok) throw new Error("Evidence mapping request failed.");
        const mapData = await mapRes.json();
        const mappings = mapData.evidence_mappings || [];

        // 4. Render mappings table
        const tbody = document.getElementById('intel-mapping-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            if (mappings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">No evidence mapped.</td></tr>`;
            } else {
                mappings.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid var(--border-color)';
                    
                    let statusBadgeClass = 'status-badge-pending';
                    if (m.status === 'Met') {
                        statusBadgeClass = 'status-badge-success';
                    } else if (m.status === 'Not Met') {
                        statusBadgeClass = 'status-badge-danger';
                    }
                    
                    let confColor = 'var(--text-secondary)';
                    if (m.confidence === 'High') confColor = 'var(--color-success)';
                    else if (m.confidence === 'Low') confColor = 'var(--color-danger)';
                    
                    tr.innerHTML = `
                        <td style="padding: 10px 5px; color: white; font-weight: 500;">${m.requirement}</td>
                        <td style="padding: 10px 5px; color: var(--text-secondary);">${m.evidence_found}</td>
                        <td style="padding: 10px 5px; text-align: center; color: ${confColor}; font-weight: 600;">${m.confidence}</td>
                        <td style="padding: 10px 5px; text-align: center;">
                            <span class="status-badge ${statusBadgeClass}">${m.status}</span>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // Show mapping screen
        const mapScreen = document.getElementById('intel-mapping-screen');
        if (mapScreen) mapScreen.style.display = 'block';

        AppState.logAudit("INTEL_EVIDENCE_MAP", "documents", denialId, null, {
            denial_id: denialId,
            medical_id: medicalId,
            policy_id: policyId
        });

    } catch (err) {
        console.error("Error running document intelligence workflow:", err);
        alert("Workflow processing failed: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

async function generateDocIntelAppeal() {
    if (!AppState.intelDenial || !AppState.intelMedical || !AppState.intelPolicy) {
        alert("Please map evidence first!");
        return;
    }

    const appealScreen = document.getElementById('intel-appeal-screen');
    const textarea = document.getElementById('intel-appeal-textarea');
    if (appealScreen) appealScreen.style.display = 'block';
    if (textarea) textarea.value = "Generating customized clinical appeal letter via advanced AI model... (this may take a few seconds)";

    if (appealScreen) {
        appealScreen.scrollIntoView({ behavior: 'smooth' });
    }

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        const res = await fetch("/api/ai/generate-appeal-advanced", {
            method: "POST",
            headers,
            body: JSON.stringify({
                denial: AppState.intelDenial,
                medical_record: AppState.intelMedical,
                policy: AppState.intelPolicy
            })
        });

        if (!res.ok) throw new Error("Appeal generation request failed.");
        const data = await res.json();
        if (textarea) textarea.value = data.appeal_letter;

        AppState.logAudit("INTEL_APPEAL_GENERATE", null, null, null, null);
    } catch (err) {
        console.error("Error generating advanced appeal letter:", err);
        if (textarea) textarea.value = "Error generating appeal: " + err.message;
    }
}

function copyIntelAppealText() {
    const textarea = document.getElementById('intel-appeal-textarea');
    const text = textarea ? textarea.value : "";
    if (!text || text.startsWith("Generating appeal") || text.startsWith("Error")) {
        alert("No appeal letter text to copy!");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        alert("Appeal letter copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard API failed, attempting fallback:", err);
        if (textarea) {
            textarea.select();
            document.execCommand('copy');
            alert("Appeal letter selected. Please press Ctrl+C (or Cmd+C) to copy.");
        }
    });
}

async function saveIntelAppealToRegistry() {
    const textarea = document.getElementById('intel-appeal-textarea');
    const text = textarea ? textarea.value : "";
    if (!text || text.startsWith("Generating appeal") || text.startsWith("Error")) {
        alert("Please generate a valid appeal letter draft first!");
        return;
    }

    const denialExt = AppState.intelDenial;
    const claimNum = denialExt ? denialExt.claim_number : null;

    let claim = AppState.db.claims.find(c => c.claim_number === claimNum);
    let denial = claim ? AppState.db.denials.find(d => d.claim_id === claim.id) : null;

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        // If Denial/Claim not found in local DB state, create placeholder records
        if (!claim) {
            const claimId = `clm-${Date.now()}`;
            claim = {
                id: claimId,
                claim_number: claimNum || `CLM-${Date.now()}`,
                patient_id: "p-1", // Fallback John Doe
                payer_name: denialExt.payer || "Unknown Payer",
                claim_date: new Date().toISOString().split('T')[0],
                total_charges: 8450.00,
                amount_paid: 0.00,
                status: "Denied"
            };
            const cRes = await fetch("/api/claims", {
                method: "POST",
                headers,
                body: JSON.stringify(claim)
            });
            if (!cRes.ok) throw new Error("Failed to create claim record on backend.");
        }

        if (!denial) {
            const denialId = `den-${Date.now()}`;
            const partsReason = (denialExt.denial_reason || "Medical necessity not established").split(':');
            const carcCode = partsReason[0].trim();
            const carcDesc = partsReason[1] ? partsReason[1].trim() : (denialExt.denial_reason || "Medical necessity not established");

            denial = {
                id: denialId,
                claim_id: claim.id,
                denial_date: new Date().toISOString().split('T')[0],
                carc_code: carcCode,
                carc_description: carcDesc,
                denied_amount: 8450.00,
                payer_notes: denialExt.denial_reason || "Medical necessity not established",
                status: "New",
                assigned_to: AppState.currentUser ? AppState.currentUser.id : "u-1"
            };
            const dRes = await fetch("/api/denials", {
                method: "POST",
                headers,
                body: JSON.stringify(denial)
            });
            if (!dRes.ok) throw new Error("Failed to create denial record on backend.");
        }

        // Create the Appeal record
        const appealId = `app-${Date.now()}`;
        const newAppeal = {
            id: appealId,
            denial_id: denial.id,
            appeal_number: `APP-${Math.floor(100000 + Math.random() * 900000)}`,
            generated_by: AppState.currentUser ? AppState.currentUser.id : "u-2",
            physician_signoff_by: AppState.currentUser && (AppState.currentUser.role === 'Physician' || AppState.currentUser.role === 'Admin') ? AppState.currentUser.id : null,
            appeal_letter_text: text,
            submission_date: new Date().toISOString().split('T')[0],
            submission_method: "Electronic portal",
            tracking_number: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
            outcome_date: null,
            amount_recovered: 0.00,
            status: AppState.currentUser && (AppState.currentUser.role === 'Physician' || AppState.currentUser.role === 'Admin') ? 'Pending Submission' : 'Physician Review Required'
        };

        const appRes = await fetch("/api/appeals", {
            method: "POST",
            headers,
            body: JSON.stringify(newAppeal)
        });
        if (!appRes.ok) throw new Error("Failed to save appeal on backend: " + await appRes.text());

        // Update denial and claim statuses
        await fetch(`/api/denials/${denial.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "Appeal Drafted" })
        });

        await fetch(`/api/claims/${claim.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "Under Appeal" })
        });

        // Log audits
        AppState.logAudit("APPEAL_SUBMIT", "appeals", appealId, null, newAppeal);
        AppState.logAudit("DENIAL_STATUS_UPDATE", "denials", denial.id, { status: denial.status }, { status: "Appeal Drafted" });

        alert(`Appeal letter successfully saved to registry! Status: ${newAppeal.status}`);

        // Reset dropdowns and screens
        AppState.intelDenial = null;
        AppState.intelMedical = null;
        AppState.intelPolicy = null;
        AppState.intelDenialId = null;

        const resScreen = document.getElementById('intel-results-screen');
        const mapScreen = document.getElementById('intel-mapping-screen');
        const appScreen = document.getElementById('intel-appeal-screen');
        if (resScreen) resScreen.style.display = 'none';
        if (mapScreen) mapScreen.style.display = 'none';
        if (appScreen) appScreen.style.display = 'none';

        const dSel = document.getElementById('intel-denial-select');
        const mSel = document.getElementById('intel-medical-select');
        const pSel = document.getElementById('intel-policy-select');
        if (dSel) dSel.value = "";
        if (mSel) mSel.value = "";
        if (pSel) pSel.value = "";

        // Refresh and redirect
        await loadDbFromBackend();
        navigateTo('dashboard');

    } catch (err) {
        console.error("Error saving appeal:", err);
        alert("Failed to save appeal: " + err.message);
    }
}

async function approveAppeal(appealId) {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        const res = await fetch(`/api/appeals/${appealId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ 
                status: "Pending Submission", 
                physician_signoff_by: AppState.currentUser ? AppState.currentUser.id : "u-3" 
            })
        });
        if (!res.ok) throw new Error("Failed to update appeal status on backend.");

        AppState.logAudit("APPEAL_APPROVE", "appeals", appealId, null, { status: "Pending Submission" });

        alert("Appeal successfully approved and signed off!");
        await loadDbFromBackend();
        renderDashboard();
    } catch (err) {
        console.error("Error approving appeal:", err);
        alert("Approval failed: " + err.message);
    }
}

async function submitAppealToPayer(appealId) {
    const appeal = AppState.db.appeals.find(a => a.id === appealId);
    if (!appeal) {
        alert("Appeal record not found!");
        return;
    }
    const denial = AppState.db.denials.find(d => d.id === appeal.denial_id);
    const claim = denial ? AppState.db.claims.find(c => c.id === denial.claim_id) : null;

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        const trackingNum = `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`;
        const appRes = await fetch(`/api/appeals/${appealId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ 
                status: "Submitted", 
                tracking_number: trackingNum,
                submission_date: new Date().toISOString().split('T')[0]
            })
        });
        if (!appRes.ok) throw new Error("Failed to submit appeal.");

        if (denial) {
            await fetch(`/api/denials/${denial.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status: "Appealed" })
            });
        }

        if (claim) {
            await fetch(`/api/claims/${claim.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status: "Under Appeal" })
            });
        }

        AppState.logAudit("APPEAL_SUBMIT_PAYER", "appeals", appealId, null, { status: "Submitted", tracking_number: trackingNum });

        alert("Appeal successfully submitted electronically to payer portal!");
        await loadDbFromBackend();
        renderDashboard();
    } catch (err) {
        console.error("Error submitting appeal:", err);
        alert("Submission failed: " + err.message);
    }
}

async function simulatePayerDecision(appealId, outcome) {
    const appeal = AppState.db.appeals.find(a => a.id === appealId);
    if (!appeal) {
        alert("Appeal record not found!");
        return;
    }
    const denial = AppState.db.denials.find(d => d.id === appeal.denial_id);
    const claim = denial ? AppState.db.claims.find(c => c.id === denial.claim_id) : null;

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    try {
        const deniedAmount = denial ? parseFloat(denial.denied_amount) : 8450.00;
        const recoveredAmt = outcome === 'Approved' ? deniedAmount : 0.00;
        const appealStatus = outcome === 'Approved' ? 'Approved' : 'Rejected';

        const appRes = await fetch(`/api/appeals/${appealId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ 
                status: appealStatus, 
                amount_recovered: recoveredAmt,
                outcome_date: new Date().toISOString().split('T')[0]
            })
        });
        if (!appRes.ok) throw new Error("Failed to simulate payer decision.");

        if (denial) {
            await fetch(`/api/denials/${denial.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status: "Resolved" })
            });
        }

        if (claim) {
            const claimStatus = outcome === 'Approved' ? 'Paid' : 'Denied';
            const amtPaid = outcome === 'Approved' ? deniedAmount : 0.00;
            await fetch(`/api/claims/${claim.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status: claimStatus, amount_paid: amtPaid })
            });
        }

        AppState.logAudit("SIMULATE_DECISION", "appeals", appealId, null, { outcome: outcome, recovered_amount: recoveredAmt });

        alert(`Payer response simulated! Appeal status: ${appealStatus}. Amount Recovered: $${recoveredAmt}`);
        await loadDbFromBackend();
        renderDashboard();
    } catch (err) {
        console.error("Error simulating decision:", err);
        alert("Simulation failed: " + err.message);
    }
}

async function viewDocumentPreview(docId) {
    const modal = document.getElementById('document-preview-modal');
    if (!modal) return;

    document.getElementById('preview-modal-title').textContent = "Loading Document...";
    document.getElementById('preview-modal-type').textContent = "...";
    document.getElementById('preview-modal-date').textContent = "...";
    document.getElementById('preview-modal-status').textContent = "...";
    document.getElementById('preview-modal-body').textContent = "Fetching extraction data from server...";
    modal.style.display = 'flex';

    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

    try {
        const res = await fetch(`/api/documents/${docId}/extraction`, { headers });
        if (!res.ok) throw new Error("Failed to load document details");
        
        const data = await res.json();
        document.getElementById('preview-modal-title').textContent = data.filename || "Document Preview";
        document.getElementById('preview-modal-type').textContent = data.document_type || "N/A";
        
        const docFromDb = AppState.db.documents.find(d => d.id === docId);
        document.getElementById('preview-modal-date').textContent = docFromDb ? docFromDb.upload_date : "N/A";
        
        const statusSpan = document.getElementById('preview-modal-status');
        if (statusSpan) {
            statusSpan.textContent = docFromDb ? docFromDb.status : "Completed";
        }
        
        let bodyText = "";
        if (data.text_content) {
            bodyText += "=== EXTRACTED TEXT CONTENT ===\n" + data.text_content + "\n\n";
        }
        if (data.extracted_data && Object.keys(data.extracted_data).length > 0) {
            bodyText += "=== PARSED CLINICAL ENTITIES ===\n" + JSON.stringify(data.extracted_data, null, 2);
        }
        if (!bodyText) {
            bodyText = "No content extracted yet. Document is likely still processing.";
        }
        document.getElementById('preview-modal-body').textContent = bodyText;
    } catch (err) {
        console.error("Error viewing document preview:", err);
        document.getElementById('preview-modal-body').textContent = "Error: " + err.message;
    }
}

function closeDocumentPreview() {
    const modal = document.getElementById('document-preview-modal');
    if (modal) modal.style.display = 'none';
}

// ============================================================================
// 8. MEDICAL RECORD INTELLIGENCE PORTAL HANDLERS
// ============================================================================
function renderMedicalRecords() {
    const fileDrag = document.getElementById('clinical-file-drag');
    const fileInput = document.getElementById('clinical-file-input');
    
    if (fileDrag && fileInput) {
        fileInput.onclick = (e) => { e.stopPropagation(); };
        fileDrag.onclick = () => { fileInput.click(); };
        
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
                handleUploadedClinicalFile(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                handleUploadedClinicalFile(e.target.files[0]);
            }
        };
    }
    
    // Render the clinical documents table
    const tbody = document.getElementById('medical-documents-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const docs = AppState.db.documents || [];
    const clinDocs = docs.filter(d => d.document_type === 'Medical Record');
    
    if (clinDocs.length === 0) {
        tbody.innerHTML = `<tr id="medical-empty-row"><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No documents uploaded yet.</td></tr>`;
        return;
    }
    
    clinDocs.forEach(doc => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        let badgeColorClass = 'status-badge-pending';
        if (doc.status === 'Completed' || doc.status === 'Analyzed') {
            badgeColorClass = 'status-badge-success';
        } else if (doc.status === 'Processing') {
            badgeColorClass = 'status-badge-progress';
        }
        
        tr.innerHTML = `
            <td style="padding: 10px 5px; color: white; font-weight: 500;">${doc.filename}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.document_type}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.upload_date}</td>
            <td style="padding: 10px 5px;">
                <span class="status-badge ${badgeColorClass}">${doc.status}</span>
            </td>
            <td style="padding: 10px 5px; text-align: right;">
                <button class="btn btn-secondary" onclick="viewDocumentPreview('${doc.id}')" style="padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); color: #cbd5e1; cursor: pointer;">
                    View Extraction
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleUploadedClinicalFile(file) {
    const fileDrag = document.getElementById('clinical-file-drag');
    const ocrOverlay = document.getElementById('clinical-ocr-progress');
    const step1 = document.getElementById('clin-step-ocr');
    const step2 = document.getElementById('clin-step-nlp');
    const step3 = document.getElementById('clin-step-timeline');
    
    if (fileDrag) fileDrag.style.display = 'none';
    if (ocrOverlay) ocrOverlay.style.display = 'flex';
    
    if (step1) step1.className = 'pipeline-step active';
    if (step2) step2.className = 'pipeline-step';
    if (step3) step3.className = 'pipeline-step';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'Medical Record');
    
    const headers = {};
    if (AppState.sessionToken) {
        headers['Authorization'] = 'Bearer ' + AppState.sessionToken;
    }
    
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: headers,
            body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const uploadResult = await res.json();
        const docId = uploadResult.id;
        console.log("Clinical file uploaded. Doc ID:", docId);
        
        const pollInterval = setInterval(async () => {
            try {
                const checkRes = await fetch(`/api/documents/${docId}/extraction`, { headers });
                if (!checkRes.ok) return;
                
                const docDetails = await checkRes.json();
                
                const docListRes = await fetch("/api/documents", { headers });
                if (!docListRes.ok) return;
                
                const docs = await docListRes.json();
                const currentDoc = docs.find(d => d.id === docId);
                if (!currentDoc) return;
                
                const status = currentDoc.status;
                console.log(`Polling clinical doc status: ${status}`);
                
                if (status === "Processing" && step2) {
                    step1.className = 'pipeline-step';
                    step2.className = 'pipeline-step active';
                }
                
                if (status === "Completed" || status === "Analyzed") {
                    clearInterval(pollInterval);
                    if (step2) step2.className = 'pipeline-step';
                    if (step3) step3.className = 'pipeline-step active';
                    
                    setTimeout(async () => {
                        if (ocrOverlay) ocrOverlay.style.display = 'none';
                        if (fileDrag) fileDrag.style.display = 'flex';
                        
                        const ext = docDetails.extracted_data || {};
                        
                        const diagnoses = ext.diagnoses ? ext.diagnoses.join(', ') : "Chronic lumbar radiculopathy";
                        const symptoms = ext.symptoms ? ext.symptoms.join(', ') : "Persistent low back pain";
                        const failed_treatments = ext.failed_treatments ? ext.failed_treatments.join(', ') : "Physical Therapy (8 weeks), Ibuprofen";
                        const neuro = ext.neurological_findings ? ext.neurological_findings.join(', ') : "Numbness, Tingling in foot";
                        const recommendation = ext.physician_recommendation || "Recommend MRI Lumbar Spine";
                        
                        document.getElementById('clin-extracted-diagnoses').value = diagnoses;
                        document.getElementById('clin-extracted-symptoms').value = symptoms;
                        document.getElementById('clin-failed-treatments').value = failed_treatments;
                        document.getElementById('clin-risk-factors').value = neuro;
                        document.getElementById('clin-recommendations').value = recommendation;
                        
                        const timelineList = document.getElementById('timeline-events-list');
                        const vLine = document.getElementById('timeline-v-line');
                        if (timelineList) {
                            if (vLine) vLine.style.display = 'block';
                            timelineList.innerHTML = '';
                            
                            const events = [
                                { date: '12 Weeks Ago', title: 'Onset of Symptoms', desc: symptoms },
                                { date: '8 Weeks Ago', title: 'Failed Conservative Treatment', desc: failed_treatments },
                                { date: '2 Weeks Ago', title: 'Neurological Assessment', desc: neuro },
                                { date: '1 Week Ago', title: 'Clinical Recommendation', desc: recommendation }
                            ];
                            
                            events.forEach(ev => {
                                const evDiv = document.createElement('div');
                                evDiv.style.position = 'relative';
                                evDiv.style.paddingLeft = '20px';
                                evDiv.innerHTML = `
                                    <div style="position: absolute; left: -16px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--bg-surface);"></div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">${ev.date}</div>
                                    <div style="font-size: 0.875rem; font-weight: 600; color: white; margin-bottom: 2px;">${ev.title}</div>
                                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${ev.desc}</div>
                                `;
                                timelineList.appendChild(evDiv);
                            });
                        }
                        
                        AppState.logAudit("INTAKE_OCR_COMPLETED", "medical_records", docId, null, { file_name: file.name, size: file.size });
                        await loadDbFromBackend();
                        renderMedicalRecords();
                    }, 1000);
                }
            } catch (err) {
                console.error("Error polling clinical extraction:", err);
                clearInterval(pollInterval);
                if (ocrOverlay) ocrOverlay.style.display = 'none';
                if (fileDrag) fileDrag.style.display = 'flex';
            }
        }, 1000);
    } catch (err) {
        console.error("Clinical upload failed:", err);
        alert("Upload failed: " + err.message);
        if (ocrOverlay) ocrOverlay.style.display = 'none';
        if (fileDrag) fileDrag.style.display = 'flex';
    }
}

function resetClinicalIntake() {
    document.getElementById('clin-extracted-diagnoses').value = '';
    document.getElementById('clin-extracted-symptoms').value = '';
    document.getElementById('clin-failed-treatments').value = '';
    document.getElementById('clin-risk-factors').value = '';
    document.getElementById('clin-recommendations').value = '';
    
    const timelineList = document.getElementById('timeline-events-list');
    const vLine = document.getElementById('timeline-v-line');
    if (timelineList) {
        timelineList.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding-top: 50px; font-size: 0.875rem;">Timeline will display here once a clinical document is analyzed.</div>`;
    }
    if (vLine) vLine.style.display = 'none';
}

async function submitClinicalIntake() {
    const diagnoses = document.getElementById('clin-extracted-diagnoses').value;
    const symptoms = document.getElementById('clin-extracted-symptoms').value;
    const failedTreatments = document.getElementById('clin-failed-treatments').value;
    const riskFactors = document.getElementById('clin-risk-factors').value;
    const recommendations = document.getElementById('clin-recommendations').value;
    
    if (!diagnoses && !symptoms) {
        alert("No clinical insights to save!");
        return;
    }
    
    let patientId = null;
    if (AppState.db.patients && AppState.db.patients.length > 0) {
        patientId = AppState.db.patients[0].id;
    } else {
        try {
            const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            
            const pRes = await fetch("/api/patients", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    first_name: "Extracted",
                    last_name: "Patient",
                    date_of_birth: "01/01/1980",
                    insurance_provider: "Unknown",
                    insurance_policy_number: "POL-UNKNOWN"
                })
            });
            if (pRes.ok) {
                const pData = await pRes.json();
                patientId = pData.id;
            }
        } catch (err) {
            console.error("Failed to create default patient:", err);
        }
    }
    
    if (!patientId) patientId = "pat-default";
    
    const payload = {
        patient_id: patientId,
        encounter_date: new Date().toISOString().split('T')[0],
        document_type: "Clinical Notes",
        clinical_notes: `Diagnoses: ${diagnoses}. Symptoms: ${symptoms}. Treatments: ${failedTreatments}.`,
        extracted_diagnoses: diagnoses.split(',').map(s => s.trim()),
        extracted_symptoms: symptoms.split(',').map(s => s.trim()),
        failed_treatments: failedTreatments.split(',').map(s => s.trim()),
        risk_factors: riskFactors.split(',').map(s => s.trim()),
        recommendations: recommendations,
        status: "Finalized"
    };
    
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const res = await fetch("/api/medical_records", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert("✓ Clinical Insights & Timeline saved successfully to DB!");
            AppState.logAudit("SAVE_CLINICAL_INSIGHTS", "medical_records", null, null, payload);
            await loadDbFromBackend();
            renderMedicalRecords();
        } else {
            throw new Error(await res.text());
        }
    } catch (err) {
        console.error("Failed to save clinical insights:", err);
        alert("Error saving insights: " + err.message);
    }
}

// ============================================================================
// 9. INSURANCE POLICY INTELLIGENCE PORTAL HANDLERS
// ============================================================================
function renderPayerPolicies() {
    const fileDrag = document.getElementById('policy-file-drag');
    const fileInput = document.getElementById('policy-file-input');
    
    if (fileDrag && fileInput) {
        fileInput.onclick = (e) => { e.stopPropagation(); };
        fileDrag.onclick = () => { fileInput.click(); };
        
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
                handleUploadedPolicyFile(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                handleUploadedPolicyFile(e.target.files[0]);
            }
        };
    }
    
    const tbody = document.getElementById('policy-documents-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const docs = AppState.db.documents || [];
    const policyDocs = docs.filter(d => d.document_type === 'Policy');
    
    if (policyDocs.length === 0) {
        tbody.innerHTML = `<tr id="policy-empty-row"><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No policy bulletins uploaded yet.</td></tr>`;
        return;
    }
    
    policyDocs.forEach(doc => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        let badgeColorClass = 'status-badge-pending';
        if (doc.status === 'Completed' || doc.status === 'Analyzed') {
            badgeColorClass = 'status-badge-success';
        } else if (doc.status === 'Processing') {
            badgeColorClass = 'status-badge-progress';
        }
        
        tr.innerHTML = `
            <td style="padding: 10px 5px; color: white; font-weight: 500;">${doc.filename}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.document_type}</td>
            <td style="padding: 10px 5px; color: var(--text-secondary);">${doc.upload_date}</td>
            <td style="padding: 10px 5px;">
                <span class="status-badge ${badgeColorClass}">${doc.status}</span>
            </td>
            <td style="padding: 10px 5px; text-align: right;">
                <button class="btn btn-secondary" onclick="viewDocumentPreview('${doc.id}')" style="padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); color: #cbd5e1; cursor: pointer;">
                    View Extraction
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    searchPolicyKB();
}

async function handleUploadedPolicyFile(file) {
    const fileDrag = document.getElementById('policy-file-drag');
    const ocrOverlay = document.getElementById('policy-ocr-progress');
    const step1 = document.getElementById('pol-step-ocr');
    const step2 = document.getElementById('pol-step-nlp');
    const step3 = document.getElementById('pol-step-kb');
    
    if (fileDrag) fileDrag.style.display = 'none';
    if (ocrOverlay) ocrOverlay.style.display = 'flex';
    
    if (step1) step1.className = 'pipeline-step active';
    if (step2) step2.className = 'pipeline-step';
    if (step3) step3.className = 'pipeline-step';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'Policy');
    
    const headers = {};
    if (AppState.sessionToken) {
        headers['Authorization'] = 'Bearer ' + AppState.sessionToken;
    }
    
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: headers,
            body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const uploadResult = await res.json();
        const docId = uploadResult.id;
        console.log("Policy file uploaded. Doc ID:", docId);
        
        const pollInterval = setInterval(async () => {
            try {
                const checkRes = await fetch(`/api/documents/${docId}/extraction`, { headers });
                if (!checkRes.ok) return;
                
                const docDetails = await checkRes.json();
                
                const docListRes = await fetch("/api/documents", { headers });
                if (!docListRes.ok) return;
                
                const docs = await docListRes.json();
                const currentDoc = docs.find(d => d.id === docId);
                if (!currentDoc) return;
                
                const status = currentDoc.status;
                console.log(`Polling policy status: ${status}`);
                
                if (status === "Processing" && step2) {
                    step1.className = 'pipeline-step';
                    step2.className = 'pipeline-step active';
                }
                
                if (status === "Completed" || status === "Analyzed") {
                    clearInterval(pollInterval);
                    if (step2) step2.className = 'pipeline-step';
                    if (step3) step3.className = 'pipeline-step active';
                    
                    setTimeout(async () => {
                        if (ocrOverlay) ocrOverlay.style.display = 'none';
                        if (fileDrag) fileDrag.style.display = 'flex';
                        
                        const ext = docDetails.extracted_data || {};
                        const policyPayload = {
                            payer_name: ext.payer || "HealthFirst Insurance",
                            policy_name: file.name.replace(/\.[^/.]+$/, ""),
                            policy_code: "POL-" + Math.floor(1000 + Math.random() * 9000),
                            description: "Extracted payer guidelines and medical necessity criteria.",
                            coverage_criteria: ext.coverage_criteria ? ext.coverage_criteria.join('\n') : "Symptoms persist for six weeks or longer\nConservative treatment has failed\nPatient demonstrates neurological findings",
                            exclusions: ext.exclusions ? ext.exclusions.join('\n') : "Elective diagnostics without clinical indicators",
                            medical_necessity_requirements: ext.medical_necessity_requirements ? ext.medical_necessity_requirements.join('\n') : "Progress notes\nTreatment history\nPhysician recommendation"
                        };
                        
                        const postRes = await fetch("/api/payer_policies", {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json', ...headers },
                            body: JSON.stringify(policyPayload)
                        });
                        
                        if (postRes.ok) {
                            console.log("Payer policy registered.");
                        }
                        
                        AppState.logAudit("POLICY_INDEXED", "payer_policies", docId, null, policyPayload);
                        await loadDbFromBackend();
                        renderPayerPolicies();
                    }, 1000);
                }
            } catch (err) {
                console.error("Error polling policy extraction:", err);
                clearInterval(pollInterval);
                if (ocrOverlay) ocrOverlay.style.display = 'none';
                if (fileDrag) fileDrag.style.display = 'flex';
            }
        }, 1000);
    } catch (err) {
        console.error("Policy upload failed:", err);
        alert("Upload failed: " + err.message);
        if (ocrOverlay) ocrOverlay.style.display = 'none';
        if (fileDrag) fileDrag.style.display = 'flex';
    }
}

function searchPolicyKB() {
    const queryEl = document.getElementById('policy-search-input');
    const query = queryEl ? queryEl.value.toLowerCase() : '';
    const resultsContainer = document.getElementById('policy-kb-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    const policies = AppState.db.payer_policies || [];
    
    const filtered = policies.filter(p => {
        if (!query) return true;
        return (p.payer_name && p.payer_name.toLowerCase().includes(query)) ||
               (p.policy_name && p.policy_name.toLowerCase().includes(query)) ||
               (p.policy_code && p.policy_code.toLowerCase().includes(query)) ||
               (p.coverage_criteria && p.coverage_criteria.toLowerCase().includes(query));
    });
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: var(--text-muted);">No matching policies found in the knowledge base.</div>`;
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '20px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '12px';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                <div>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600; text-transform: uppercase;">${p.payer_name}</span>
                    <h4 style="font-size: 1rem; color: white; margin-top: 2px;">${p.policy_name} (${p.policy_code})</h4>
                </div>
                <span class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: rgb(16, 185, 129); font-size: 0.75rem;">Active</span>
            </div>
            <div>
                <strong style="font-size: 0.8125rem; color: white;">Coverage Criteria:</strong>
                <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px; white-space: pre-line;">${p.coverage_criteria || 'None'}</p>
            </div>
            <div>
                <strong style="font-size: 0.8125rem; color: white;">Exclusions:</strong>
                <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px; white-space: pre-line;">${p.exclusions || 'None'}</p>
            </div>
            <div>
                <strong style="font-size: 0.8125rem; color: white;">Medical Necessity:</strong>
                <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px; white-space: pre-line;">${p.medical_necessity_requirements || 'None'}</p>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

// ============================================================================
// 10. MULTI-AGENT STATEFUL WORKFLOW (LANGGRAPH SIMULATOR) HANDLERS
// ============================================================================
function renderAgentWorkflow() {
    const select = document.getElementById('workflow-denial-select');
    if (!select) return;
    
    select.innerHTML = '';
    const denials = AppState.db.denials || [];
    denials.forEach(d => {
        const claim = AppState.db.claims.find(c => c.id === d.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        const pName = patient ? `${patient.last_name}, ${patient.first_name}` : "Unknown";
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${claim ? claim.claim_number : 'Claim'} - ${pName} ($${d.denied_amount})`;
        select.appendChild(option);
    });
    
    resetWorkflowView();
    updateWorkflowFacts();
}

function updateWorkflowFacts() {
    const select = document.getElementById('workflow-denial-select');
    if (!select) return;
    
    const logs = document.getElementById('workflow-terminal-logs');
    if (!logs) return;
    
    logs.innerHTML = '';
    
    const denialId = select.value;
    if (!denialId) {
        logs.innerHTML = `<div style="color: var(--text-muted)">Please create/select a denial first.</div>`;
        return;
    }
    
    const d = AppState.db.denials.find(x => x.id === denialId);
    const claim = AppState.db.claims.find(c => c.id === d.claim_id);
    logs.innerHTML = `<div style="color: #6366f1">[System] Selected Case: ${claim ? claim.claim_number : 'Unknown'}. Graph compiled. Ready for orchestration...</div>`;
}

function resetWorkflowView() {
    const nodes = ['intake', 'clinical', 'policy', 'evidence', 'appeal', 'compliance', 'follow_up'];
    nodes.forEach(n => {
        const el = document.getElementById(`node-${n}`);
        if (el) {
            el.className = 'workflow-node';
            el.querySelector('.node-status').textContent = 'Idle';
        }
    });
    
    for (let i = 1; i <= 5; i++) {
        const conn = document.getElementById(`conn-${i}`);
        if (conn) conn.style.background = 'var(--border-color)';
    }
    
    const loop = document.getElementById('conn-loop');
    if (loop) loop.style.display = 'none';
    
    const results = document.getElementById('workflow-results-card');
    if (results) results.style.display = 'none';
    
    const ind = document.getElementById('graph-execution-indicator');
    if (ind) ind.textContent = 'State: Ready';
}

function runAgentWorkflow() {
    const select = document.getElementById('workflow-denial-select');
    if (!select || !select.value) {
        alert("Please select an active denial case!");
        return;
    }
    
    resetWorkflowView();
    
    const mode = document.getElementById('workflow-execution-mode').value;
    const ind = document.getElementById('graph-execution-indicator');
    if (ind) ind.textContent = 'State: Running...';
    
    const logs = document.getElementById('workflow-terminal-logs');
    if (!logs) return;
    
    logs.innerHTML = `<div style="color: var(--text-muted)">Initializing stateful multi-agent LangGraph workflow...</div>`;
    
    const steps = [
        {
            node: 'intake',
            log: '[Intake Agent] Parsing denial letter. Extracted claim info and denial reason.',
            status: 'Processing...',
            conn: 'conn-1'
        },
        {
            node: 'clinical',
            log: '[Clinical Agent] Scanning medical charts for symptoms, diagnoses, and treatments.',
            status: 'Extracting...',
            conn: null
        },
        {
            node: 'policy',
            log: '[Policy Agent] Scanning knowledge base for coverage criteria and CPT rules.',
            status: 'Querying...',
            conn: 'conn-2'
        },
        {
            node: 'evidence',
            log: '[Evidence Agent] Matching extracted clinical findings directly to policy clauses.',
            status: 'Mapping...',
            conn: 'conn-3'
        },
        {
            node: 'appeal',
            log: '[Appeal Agent] Drafting customized clinical appeal letter referencing evidence matrix.',
            status: 'Drafting...',
            conn: 'conn-4'
        },
        {
            node: 'compliance',
            log: '[Compliance Agent] Checking draft against HIPAA safeguards and submission rules.',
            status: 'Verifying...',
            conn: 'conn-5'
        },
        {
            node: 'follow_up',
            log: '[Follow Up Agent] Compilation completed. Queueing tracking alert loop.',
            status: 'Scheduling...',
            conn: null
        }
    ];
    
    let currentIdx = 0;
    
    function executeStep() {
        if (currentIdx >= steps.length) {
            if (ind) ind.textContent = 'State: Completed';
            
            const results = document.getElementById('workflow-results-card');
            if (results) results.style.display = 'flex';
            
            const textarea = document.getElementById('workflow-letter-output');
            if (textarea) {
                textarea.value = `To Payer Appeals Committee,\n\nWe are writing to appeal the denial for claim ${select.options[select.selectedIndex].textContent.split(' - ')[0]}.\n\nExtracted Clinical Evidence demonstrates that the patient fully satisfies CPT coverage guidelines.\n\nSincerely,\nClinical Department`;
            }
            
            const checklist = document.getElementById('workflow-checklist-output');
            if (checklist) {
                checklist.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:center; font-size:0.8125rem;">
                        <input type="checkbox" checked disabled>
                        <span style="color:var(--text-secondary);">Submit appeal package to payer portal</span>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center; font-size:0.8125rem;">
                        <input type="checkbox" checked disabled>
                        <span style="color:var(--text-secondary);">Attach extracted medical charts</span>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center; font-size:0.8125rem;">
                        <input type="checkbox" disabled>
                        <span style="color:white; font-weight:600;">Check status in 14 days (Auto-queued in n8n)</span>
                    </div>
                `;
            }
            
            AppState.logAudit("AGENT_WORKFLOW_COMPLETE", "denials", select.value, null, { mode });
            return;
        }
        
        const step = steps[currentIdx];
        
        const el = document.getElementById(`node-${step.node}`);
        if (el) {
            el.classList.add('active');
            el.querySelector('.node-status').textContent = step.status;
        }
        
        const div = document.createElement('div');
        div.textContent = step.log;
        div.style.color = 'white';
        logs.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
        
        setTimeout(() => {
            if (el) {
                el.classList.remove('active');
                el.classList.add('completed');
                el.querySelector('.node-status').textContent = 'Completed';
            }
            
            if (step.conn) {
                const connLine = document.getElementById(step.conn);
                if (connLine) connLine.style.background = 'var(--color-primary)';
            }
            
            if (step.node === 'compliance') {
                const loop = document.getElementById('conn-loop');
                if (loop) loop.style.display = 'block';
                
                const loopDiv = document.createElement('div');
                loopDiv.textContent = '↺ [Compliance] Revision requested. Clarifying symptom onset details...';
                loopDiv.style.color = 'var(--color-warning)';
                logs.appendChild(loopDiv);
                logs.scrollTop = logs.scrollHeight;
                
                setTimeout(() => {
                    if (loop) loop.style.display = 'none';
                    const revisedDiv = document.createElement('div');
                    revisedDiv.textContent = '✓ [Appeal Agent] Draft appeal revised and approved by compliance review.';
                    revisedDiv.style.color = 'var(--color-success)';
                    logs.appendChild(revisedDiv);
                    logs.scrollTop = logs.scrollHeight;
                    
                    currentIdx++;
                    executeStep();
                }, 1200);
            } else {
                currentIdx++;
                executeStep();
            }
        }, 1200);
    }
    
    executeStep();
}

async function commitWorkflowToDB() {
    const select = document.getElementById('workflow-denial-select');
    const letter = document.getElementById('workflow-letter-output').value;
    
    if (!select || !select.value || !letter) return;
    
    const denialId = select.value;
    
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const appRes = await fetch("/api/appeals", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                denial_id: denialId,
                appeal_number: "APP-" + Math.floor(10000 + Math.random() * 90000),
                generated_by: AppState.currentUser ? AppState.currentUser.id : null,
                appeal_letter_text: letter,
                submission_method: "Payer Portal",
                status: "Draft"
            })
        });
        
        if (!appRes.ok) throw new Error(await appRes.text());
        
        await fetch(`/api/denials/${denialId}`, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify({ status: "Appeal Drafted" })
        });
        
        alert("✓ Workflow results saved! Appeal draft created in appeals ledger.");
        await loadDbFromBackend();
        navigateTo('dashboard');
    } catch (err) {
        console.error("Failed to commit workflow to DB:", err);
        alert("Save failed: " + err.message);
    }
}

// ============================================================================
// 11. AI COPILOT RAG ASSISTANT HANDLERS
// ============================================================================
function renderCopilot() {
    const select = document.getElementById('copilot-context-select');
    if (!select) return;
    
    select.innerHTML = '';
    
    const denials = AppState.db.denials || [];
    denials.forEach(d => {
        const claim = AppState.db.claims.find(c => c.id === d.claim_id);
        const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
        const pName = patient ? `${patient.last_name}, ${patient.first_name}` : "Unknown";
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${claim ? claim.claim_number : 'Claim'} - ${pName}`;
        select.appendChild(option);
    });
    
    updateCopilotContext();
    
    const chat = document.getElementById('copilot-chat-history');
    if (chat && chat.children.length === 0) {
        chat.innerHTML = `
            <div style="align-self: flex-start; background: rgba(255,255,255,0.03); color: white; padding: 12px 18px; border-radius: 15px 15px 15px 0; max-width: 80%; font-size: 0.875rem; border: 1px solid var(--border-color);">
                <strong>Welcome to ClaimShield AI Copilot!</strong><br><br>
                I have full contextual RAG access to patient health charts, payer policies, and historical billing statements.<br><br>
                How can I assist you in analyzing this case?
            </div>
        `;
    }
}

function updateCopilotContext() {
    const select = document.getElementById('copilot-context-select');
    const details = document.getElementById('copilot-context-details');
    if (!select || !details) return;
    
    const denialId = select.value;
    if (!denialId) {
        details.innerHTML = '<div>No active claim selected.</div>';
        return;
    }
    
    const d = AppState.db.denials.find(x => x.id === denialId);
    const claim = AppState.db.claims.find(c => c.id === d.claim_id);
    const patient = claim ? AppState.db.patients.find(p => p.id === claim.patient_id) : null;
    
    details.innerHTML = `
        <div><strong>Patient MRN:</strong> ${patient ? patient.mrn || 'N/A' : 'N/A'}</div>
        <div><strong>Payer Name:</strong> ${claim ? claim.payer_name : 'N/A'}</div>
        <div><strong>Denied Amount:</strong> $${(parseFloat(d.denied_amount) || 0.00).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div><strong>Denial Reason:</strong> ${d.carc_description}</div>
    `;
}

async function submitCopilotMessage() {
    const input = document.getElementById('copilot-chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    input.value = '';
    
    const chat = document.getElementById('copilot-chat-history');
    if (!chat) return;
    
    const userDiv = document.createElement('div');
    userDiv.style.alignSelf = 'flex-end';
    userDiv.style.background = 'rgba(99, 102, 241, 0.2)';
    userDiv.style.border = '1px solid var(--color-primary-glow)';
    userDiv.style.color = 'white';
    userDiv.style.padding = '10px 15px';
    userDiv.style.borderRadius = '15px 15px 0 15px';
    userDiv.style.maxWidth = '75%';
    userDiv.style.fontSize = '0.875rem';
    userDiv.textContent = msg;
    chat.appendChild(userDiv);
    
    const botDiv = document.createElement('div');
    botDiv.style.alignSelf = 'flex-start';
    botDiv.style.background = 'rgba(255,255,255,0.03)';
    botDiv.style.color = 'var(--text-secondary)';
    botDiv.style.padding = '10px 15px';
    botDiv.style.borderRadius = '15px 15px 15px 0';
    botDiv.style.maxWidth = '75%';
    botDiv.style.fontSize = '0.875rem';
    botDiv.innerHTML = '<em>Thinking...</em>';
    chat.appendChild(botDiv);
    
    chat.scrollTop = chat.scrollHeight;
    
    const model = document.getElementById('copilot-model-select').value;
    const contextText = document.getElementById('copilot-context-details').textContent.replace(/\s+/g, ' ');
    
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const res = await fetch("/api/ai/qa", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                question: msg,
                query: msg,
                context: contextText,
                model: model
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            botDiv.innerHTML = data.answer || data.response || "No reply received from AI backend.";
        } else {
            botDiv.innerHTML = `<span style="color:var(--color-danger)">Error: ${await res.text()}</span>`;
        }
    } catch (err) {
        console.error("Copilot query failed:", err);
        botDiv.innerHTML = `<span style="color:var(--color-danger)">Error connecting to Copilot RAG API.</span>`;
    }
    
    chat.scrollTop = chat.scrollHeight;
}

function handleCopilotKeyPress(event) {
    if (event.key === 'Enter') {
        submitCopilotMessage();
    }
}

function sendQuickCopilotQuery(msg) {
    const input = document.getElementById('copilot-chat-input');
    if (input) {
        input.value = msg;
        submitCopilotMessage();
    }
}

// ============================================================================
// 12. n8n INTEGRATION WORKFLOW EXPLORER HANDLERS
// ============================================================================
function switchN8NWorkflow(wfId) {
    const selector = document.getElementById('n8n-workflow-selector');
    if (!selector) return;
    
    selector.querySelectorAll('.template-option').forEach(opt => {
        if (opt.getAttribute('data-wf') == wfId) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    const title = document.getElementById('n8n-wf-title');
    const desc = document.getElementById('n8n-wf-desc');
    const canvas = document.getElementById('n8n-wf-visual-canvas');
    if (!canvas) return;
    
    let wfData = {};
    if (wfId == 1) {
        wfData = {
            title: "Workflow 1: Email Ingestion",
            desc: "Monitors an IMAP inbox, extracts attachments, sends them to ClaimShield's OCR API, updates Postgres, and triggers Slack alerts.",
            nodes: ["IMAP Inbox Trigger", "Extract PDF Attachments", "ClaimShield OCR API", "Postgres DB Update", "Slack Notification Alert"]
        };
    } else if (wfId == 2) {
        wfData = {
            title: "Workflow 2: Filing Deadline Alerts",
            desc: "Runs daily at 9:00 AM, checks for upcoming claim appeal deadlines, groups them by agent, and logs notifications/alerts.",
            nodes: ["Cron Schedule (Daily)", "Query Approaching Deadlines", "Group by Specialist", "SMTP Email Digest"]
        };
    } else if (wfId == 3) {
        wfData = {
            title: "Workflow 3: 14-Day Follow Up Loop",
            desc: "Listens for appeal submissions, schedules a 14-day delay, then queries the payer portal for decision status.",
            nodes: ["Webhook (Appeal Submitted)", "Wait 14 Days Delay", "HTTP Request (Payer Portal)", "Update Appeal Status"]
        };
    } else if (wfId == 4) {
        wfData = {
            title: "Workflow 4: Payer Portal Submit",
            desc: "Triggers on appeal physician sign-off, formats documents, executes RPA/API upload to payer clearinghouse, and saves tracking ID.",
            nodes: ["Webhook (Physician Sign-Off)", "Format Appeal Packet", "HTTP Request (Clearinghouse API)", "Log Payer Tracking ID"]
        };
    } else {
        wfData = {
            title: "Workflow 5: Executive Metrics Digest",
            desc: "Compiles weekly financial metrics, draws recovery graphs, compiles a PDF document, and emails it to directors.",
            nodes: ["Cron Schedule (Weekly)", "Aggregate Recovery SQL", "HTML to PDF Compiler", "SMTP Email Report"]
        };
    }
    
    title.textContent = wfData.title;
    desc.textContent = wfData.desc;
    
    canvas.innerHTML = '';
    wfData.nodes.forEach((nName, idx) => {
        const node = document.createElement('div');
        node.className = 'workflow-node';
        node.style.width = 'auto';
        node.style.minWidth = '120px';
        node.style.padding = '8px 12px';
        node.style.borderRadius = 'var(--radius-sm)';
        node.style.border = '1px solid var(--color-primary-glow)';
        node.style.background = 'rgba(99, 102, 241, 0.05)';
        node.style.color = 'white';
        node.style.fontSize = '0.75rem';
        node.style.textAlign = 'center';
        node.style.fontWeight = '500';
        node.textContent = nName;
        canvas.appendChild(node);
        
        if (idx < wfData.nodes.length - 1) {
            const arrow = document.createElement('div');
            arrow.style.color = 'var(--text-muted)';
            arrow.style.fontSize = '1.125rem';
            arrow.textContent = '→';
            canvas.appendChild(arrow);
        }
    });
}

function copyN8NJSON() {
    const title = document.getElementById('n8n-wf-title').textContent;
    const mockJson = {
        name: title,
        nodes: [
            { type: "n8n-nodes-base.trigger", parameters: { path: "webhook" } },
            { type: "n8n-nodes-base.httpRequest", parameters: { url: "/api/ai" } }
        ],
        connections: {}
    };
    navigator.clipboard.writeText(JSON.stringify(mockJson, null, 2)).then(() => {
        alert("✓ Workflow JSON copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        alert("JSON payload:\n" + JSON.stringify(mockJson));
    });
}

function downloadN8NJSON() {
    const title = document.getElementById('n8n-wf-title').textContent;
    const mockJson = {
        name: title,
        nodes: [
            { type: "n8n-nodes-base.trigger", parameters: { path: "webhook" } },
            { type: "n8n-nodes-base.httpRequest", parameters: { url: "/api/ai" } }
        ],
        connections: {}
    };
    const blob = new Blob([JSON.stringify(mockJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\s+/g, "_").toLowerCase() + "_n8n.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// 13. HIPAA COMPLIANCE AUDITING & SECURITY UTILITY HANDLERS
// ============================================================================
function switchComplianceTab(tabName) {
    const logs = document.getElementById('compliance-logs-container');
    const controls = document.getElementById('compliance-controls-container');
    const dr = document.getElementById('compliance-dr-container');
    const users = document.getElementById('compliance-users-container');
    
    if (logs) logs.style.display = tabName === 'logs' ? 'block' : 'none';
    if (controls) controls.style.display = tabName === 'controls' ? 'flex' : 'none';
    if (dr) dr.style.display = tabName === 'dr' ? 'flex' : 'none';
    if (users) users.style.display = tabName === 'users' ? 'flex' : 'none';
    
    document.querySelectorAll('.dev-tab').forEach(btn => {
        if (btn.id === `compliance-tab-${tabName}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (tabName === 'users') {
        loadPendingRoleRequests();
    }
}

function filterAuditLogs() {
    const filter = document.getElementById('audit-filter-select').value;
    const list = document.getElementById('admin-audit-logs-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    const logs = AppState.db.audit_logs || [];
    const filtered = logs.filter(log => {
        if (filter === 'ALL') return true;
        if (filter === 'LOGIN') return log.action_type === 'LOGIN' || log.action_type === 'GOOGLE_AUTH';
        if (filter === 'ROLE_SWITCH') return log.action_type === 'SWITCH_ROLE' || log.action_type === 'ROLE_SWITCH';
        if (filter === 'DOCUMENT_ACCESS') return log.action_type === 'PHI_READ' || log.action_type === 'DOCUMENT_ACCESS' || log.action_type === 'VIEW_EXTRACTION';
        if (filter === 'APPEAL_SUBMIT') return log.action_type === 'APPEAL_SUBMIT' || log.action_type === 'SUBMIT_APPEAL';
        if (filter === 'DB_ENCRYPTED') return log.action_type === 'DB_ENCRYPTED' || log.action_type === 'ENCRYPT_REST';
        return log.action_type === filter;
    });
    
    if (filtered.length === 0) {
        list.innerHTML = `<div style="color: var(--text-muted); padding: 15px; text-align: center;">No audit logs match this filter.</div>`;
        return;
    }
    
    filtered.forEach(log => {
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

function toggleEncryptionAtRest() {
    const isChecked = document.getElementById('security-encrypt-rest-checkbox').checked;
    AppState.logAudit("DB_ENCRYPTED", "system", null, { encrypted: !isChecked }, { encrypted: isChecked });
    alert(isChecked ? "✓ AES-256 local database encryption is now ACTIVE." : "⚠️ Local database encryption deactivated.");
}

function simulateSessionLockTrigger() {
    const modal = document.getElementById('session-lock-modal');
    if (modal) modal.style.display = 'flex';
    AppState.logAudit("SESSION_LOCK", "users", AppState.currentUser ? AppState.currentUser.id : null, null, { triggered_by: "Admin manual" });
}

function unlockSession() {
    const modal = document.getElementById('session-lock-modal');
    if (modal) modal.style.display = 'none';
    AppState.logAudit("SESSION_UNLOCK", "users", AppState.currentUser ? AppState.currentUser.id : null, null, { triggered_by: "User password" });
}

async function triggerManualBackup() {
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const res = await fetch("/api/recovery/backup", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ backup_type: "manual" })
        });
        
        if (res.ok) {
            alert("✓ Backup successfully completed! State synchronized to simulated cloud.");
            AppState.logAudit("BACKUP_COMPLETE", "backup_logs", null, null, { type: "manual", status: "Success" });
            await loadDbFromBackend();
            const lastBackup = document.getElementById('dr-last-backup-text');
            if (lastBackup) lastBackup.textContent = new Date().toLocaleString();
        } else {
            throw new Error(await res.text());
        }
    } catch (err) {
        console.error("Backup failed:", err);
        alert("Backup failed: " + err.message);
    }
}

async function triggerCloudRestore() {
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const res = await fetch("/api/recovery/restore", {
            method: "POST",
            headers: headers
        });
        
        if (res.ok) {
            alert("✓ Database restore from cloud completed successfully! Workspace states reloaded.");
            AppState.logAudit("RESTORE_COMPLETE", "backup_logs", null, null, { status: "Success" });
            await loadDbFromBackend();
            window.location.reload();
        } else {
            throw new Error(await res.text());
        }
    } catch (err) {
        console.error("Restore failed:", err);
        alert("Restore failed: " + err.message);
    }
}

function exportAppeal(format) {
    const text = document.getElementById('appeal-letter-text').value;
    if (!text || text.includes("Generating appeal")) {
        alert("No appeal text to export!");
        return;
    }
    
    AppState.logAudit("EXPORT_APPEAL", "appeals", AppState.selectedDenialForAppeal, null, { format });
    
    if (format === 'email') {
        const mailto = `mailto:?subject=Appeal%20Submission&body=${encodeURIComponent(text)}`;
        window.location.href = mailto;
    } else {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appeal_letter.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`✓ Appeal successfully exported as ${format.toUpperCase()}!`);
    }
}

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
    window.submitIntake = submitIntake;
    window.generateAppealDraft = generateAppealDraft;
    window.submitAppealLetter = submitAppealLetter;
    window.toggleAuditJSON = toggleAuditJSON;
    window.completeTask = completeTask;
    window.handleDirectAppeal = handleDirectAppeal;
    window.viewClaimAppeal = viewClaimAppeal;
    window.viewDenialAppeal = viewDenialAppeal;
    window.generateAppealFromDenial = generateAppealFromDenial;
    
    // Document Intelligence & Appeals Workflow exposures
    window.runDocumentIntelligenceWorkflow = runDocumentIntelligenceWorkflow;
    window.generateDocIntelAppeal = generateDocIntelAppeal;
    window.copyIntelAppealText = copyIntelAppealText;
    window.saveIntelAppealToRegistry = saveIntelAppealToRegistry;
    window.approveAppeal = approveAppeal;
    window.submitAppealToPayer = submitAppealToPayer;
    window.simulatePayerDecision = simulatePayerDecision;
    window.submitDraftForReview = submitDraftForReview;
    window.viewDocumentPreview = viewDocumentPreview;
    window.closeDocumentPreview = closeDocumentPreview;
    
    // Medical Records exposures
    window.renderMedicalRecords = renderMedicalRecords;
    window.resetClinicalIntake = resetClinicalIntake;
    window.submitClinicalIntake = submitClinicalIntake;
    
    // Payer Policies exposures
    window.renderPayerPolicies = renderPayerPolicies;
    window.searchPolicyKB = searchPolicyKB;
    
    // Agent Workflow exposures
    window.renderAgentWorkflow = renderAgentWorkflow;
    window.updateWorkflowFacts = updateWorkflowFacts;
    window.runAgentWorkflow = runAgentWorkflow;
    window.resetWorkflowView = resetWorkflowView;
    window.commitWorkflowToDB = commitWorkflowToDB;
    
    // Copilot exposures
    window.renderCopilot = renderCopilot;
    window.updateCopilotContext = updateCopilotContext;
    window.submitCopilotMessage = submitCopilotMessage;
    window.handleCopilotKeyPress = handleCopilotKeyPress;
    window.sendQuickCopilotQuery = sendQuickCopilotQuery;
    
    // n8n Workflows exposures
    window.switchN8NWorkflow = switchN8NWorkflow;
    window.copyN8NJSON = copyN8NJSON;
    window.downloadN8NJSON = downloadN8NJSON;
    
    // Compliance & Admin exposures
    window.switchComplianceTab = switchComplianceTab;
    window.filterAuditLogs = filterAuditLogs;
    window.toggleEncryptionAtRest = toggleEncryptionAtRest;
    window.simulateSessionLockTrigger = simulateSessionLockTrigger;
    window.unlockSession = unlockSession;
    window.triggerManualBackup = triggerManualBackup;
    window.triggerCloudRestore = triggerCloudRestore;
    window.exportAppeal = exportAppeal;
});


// ============================================================================
// Google SSO & Authentication
// ============================================================================
function initGoogleButton() {
    // Show hosted auth notice if not on localhost
    const isHosted = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const hostedNotice = document.getElementById('hosted-auth-notice');
    if (isHosted && hostedNotice) {
        hostedNotice.style.display = 'block';
    }

    try {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: "944633398276-h8alveoahdmqnq6784orl4coqr0lamb6.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("google-signin-btn"),
                { theme: "filled_blue", size: "large", width: 240 }
            );
            console.log("Google Sign-In button rendered successfully.");
        } else {
            console.warn("Google GIS SDK not loaded yet.");
        }
    } catch (e) {
        console.error("Error initializing Google Identity Services:", e);
    }
}

function onGoogleLibraryLoad() {
    console.log("Google GIS SDK loaded dynamically.");
    window.googleLibraryLoaded = true;
    if (!AppState.sessionToken) {
        initGoogleButton();
    }
}

function handleCredentialResponse(response) {
    if (response.credential) {
        authenticateToken(response.credential);
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

function simulateGoogleLogin(roleKeyword) {
    const mockTokens = {
        'admin': 'mock-google-token-admin',
        'physician': 'mock-google-token-physician',
        'billing': 'mock-google-token-billing',
        'appeals': 'mock-google-token-appeals'
    };
    authenticateToken(mockTokens[roleKeyword] || mockTokens['admin']);
}

async function authenticateToken(token) {
    try {
        const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });
        
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('CLAIMSHIELD_TOKEN', data.session_token);
            window.location.reload();
        } else {
            console.error("Login failed:", await res.text());
        }
    } catch (e) {
        console.error("Login fetch error:", e);
    }
}

function logoutUser() {
    sessionStorage.removeItem('CLAIMSHIELD_TOKEN');
    window.location.reload();
}

// Exposures
window.onGoogleLibraryLoad = onGoogleLibraryLoad;
window.simulateGoogleLogin = simulateGoogleLogin;
window.logoutUser = logoutUser;
window.initGoogleButton = initGoogleButton;
window.submitRoleRequest = submitRoleRequest;
window.checkRoleRequestStatus = checkRoleRequestStatus;
window.approveUserRole = approveUserRole;
window.rejectUserRole = rejectUserRole;

async function loadDbFromBackend() {
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        
        // Load documents list
        const docRes = await fetch("/api/documents", { headers: headers });
        if (docRes.ok) {
            AppState.db.documents = await docRes.json();
        }
        
        const endpoints = ['claims', 'patients', 'denials', 'appeals', 'medical_records', 'payer_policies'];
        for (const ep of endpoints) {
            const res = await fetch(`/api/${ep}`, { headers: headers });
            if (res.ok) {
                AppState.db[ep] = await res.json();
            } else if (res.status === 401) {
                console.warn("Unauthorized access to " + ep);
            }
        }
    } catch (e) {
        console.warn("Could not load from backend:", e);
    }
}

async function submitRoleRequest() {
    const requestedRole = document.getElementById('requested-role-select').value;
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    try {
        const res = await fetch("/api/users/request-role", {
            method: "POST",
            headers,
            body: JSON.stringify({ role: requestedRole })
        });
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('CLAIMSHIELD_TOKEN', data.session_token);
            alert("Your role request has been submitted successfully!");
            window.location.reload();
        } else {
            alert("Failed to submit request: " + await res.text());
        }
    } catch (err) {
        console.error("Error submitting role request:", err);
    }
}

async function checkRoleRequestStatus() {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    try {
        const res = await fetch("/api/users/me", { headers });
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('CLAIMSHIELD_TOKEN', data.session_token);
            if (data.role_status === 'Approved') {
                alert("Your access request has been approved! Logging you in...");
                window.location.reload();
            } else if (data.role_status === 'Rejected') {
                const statusText = document.getElementById('role-request-status-text');
                const formArea = document.getElementById('role-request-form-area');
                const pendingArea = document.getElementById('role-request-pending-area');
                if (statusText) statusText.innerHTML = `<span style="color: var(--color-danger); font-weight: 600;">Access request rejected.</span> Please select a role to submit a new request.`;
                if (formArea) formArea.style.display = 'flex';
                if (pendingArea) pendingArea.style.display = 'none';
            } else {
                alert("Status is still pending approval.");
            }
        }
    } catch (err) {
        console.error("Error checking role status:", err);
    }
}

async function loadPendingRoleRequests() {
    const tbody = document.getElementById('pending-role-requests-tbody');
    if (!tbody) return;
    
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    try {
        const res = await fetch("/api/users/pending", { headers });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No pending role requests.</td></tr>`;
                return;
            }
            tbody.innerHTML = data.map(u => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 10px 5px;">${u.name || 'N/A'}</td>
                    <td style="padding: 10px 5px;">${u.email}</td>
                    <td style="padding: 10px 5px;"><strong>${u.requested_role}</strong></td>
                    <td style="padding: 10px 5px;"><span class="status-badge" style="background-color: rgba(245,158,11,0.1); color: #f59e0b;">${u.role_status}</span></td>
                    <td style="padding: 10px 5px;">
                        <button class="btn btn-success" onclick="approveUserRole('${u.id}', '${u.requested_role}')" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 5px; cursor: pointer; border-radius: 4px;">Approve</button>
                        <button class="btn btn-danger" onclick="rejectUserRole('${u.id}')" style="padding: 4px 8px; font-size: 0.75rem; cursor: pointer; border-radius: 4px;">Reject</button>
                    </td>
                </tr>
            `).join('');
        } else if (res.status === 403) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 20px; font-weight: 600;">Access Denied: Only Admins can view pending requests. Please use the Role Profile Sim switcher to switch to Admin first.</td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 20px;">Failed to load requests (Status ${res.status}).</td></tr>`;
        }
    } catch (err) {
        console.error("Error loading pending role requests:", err);
    }
}

async function approveUserRole(userId, role) {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    try {
        const res = await fetch(`/api/users/${userId}/approve`, {
            method: "POST",
            headers,
            body: JSON.stringify({ role })
        });
        if (res.ok) {
            alert("Role request approved successfully!");
            loadPendingRoleRequests();
        } else {
            alert("Failed to approve role: " + await res.text());
        }
    } catch (err) {
        console.error("Error approving role request:", err);
    }
}

async function rejectUserRole(userId) {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    try {
        const res = await fetch(`/api/users/${userId}/reject`, {
            method: "POST",
            headers
        });
        if (res.ok) {
            alert("Role request rejected.");
            loadPendingRoleRequests();
        } else {
            alert("Failed to reject role: " + await res.text());
        }
    } catch (err) {
        console.error("Error rejecting role request:", err);
    }
}
