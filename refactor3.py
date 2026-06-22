import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Refactor submitIntake
new_submit_intake = '''async function submitIntake() {
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
    
    // In a real app we would POST to /api/patients and /api/claims here.
    // For simplicity, we just reload from backend since the backend already created the records during parsing.
    await loadDbFromBackend();
    
    const claim = AppState.db.claims.find(c => c.claim_number === claimNumber);
    if (!claim) {
        alert("Claim not found in database. Make sure extraction completed successfully.");
        return;
    }
    
    const denial = AppState.db.denials.find(d => d.claim_id === claim.id);
    
    document.getElementById('intake-form-panel').style.display = 'none';
    document.getElementById('intake-success-panel').style.display = 'block';
    
    setTimeout(() => {
        navigateTo('denial-dashboard');
    }, 2000);
}'''

content = re.sub(r'function submitIntake\(\) \{[\s\S]*?(?=\nfunction resetIntake)', new_submit_intake + '\n', content)

# 2. Refactor submitClinicalIntake
new_submit_clinical = '''async function submitClinicalIntake() {
    await loadDbFromBackend();
    
    document.getElementById('clinical-form-panel').style.display = 'none';
    document.getElementById('clinical-success-panel').style.display = 'block';
    
    setTimeout(() => {
        navigateTo('denial-dashboard');
    }, 2000);
}'''

content = re.sub(r'function submitClinicalIntake\(\) \{[\s\S]*?(?=\nfunction resetClinicalIntake)', new_submit_clinical + '\n', content)

# 3. Refactor submitPolicyIntake
new_submit_policy = '''async function submitPolicyIntake() {
    await loadDbFromBackend();
    
    document.getElementById('policy-form-panel').style.display = 'none';
    document.getElementById('policy-success-panel').style.display = 'block';
    
    setTimeout(() => {
        navigateTo('policy-management');
    }, 2000);
}'''

content = re.sub(r'function submitPolicyIntake\(\) \{[\s\S]*?(?=\nfunction resetPolicyIntake)', new_submit_policy + '\n', content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored submitIntake, submitClinicalIntake, submitPolicyIntake")
