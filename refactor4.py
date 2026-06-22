import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_generate_appeal = '''async function generateAppealDraft(templateType) {
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
        const res = await fetch("http://localhost:8000/api/ai/appeal", {
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
}'''

content = re.sub(r'async function generateAppealDraft\(templateType\) \{[\s\S]*?(?=\nfunction submitAppealLetter|\nfunction handleDirectAppeal)', new_generate_appeal + '\n\n', content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully.')
