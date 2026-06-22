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
    txtBox.value = "Generating appeal dynamically via AI...";
    
    try {
        const res = await fetch("http://localhost:8000/api/ai/appeal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ denial_id: selectedDenial.id })
        });
        
        if (!res.ok) throw new Error("Appeal generation failed.");
        const data = await res.json();
        
        txtBox.value = data.appeal_letter;
        
    } catch (e) {
        console.error("Error generating appeal:", e);
        txtBox.value = "Failed to generate appeal. Backend might be unavailable.";
    }
}'''

content = re.sub(r'function generateAppealDraft\(templateType\) \{[\s\S]*?(?=\nfunction submitAppealLetter|\nfunction handleDirectAppeal)', new_generate_appeal + '\n\n', content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully.')
