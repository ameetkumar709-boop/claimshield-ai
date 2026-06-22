import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the previously injected loadDbFromBackend
content = re.sub(r'async function loadDbFromBackend\(\) \{[\s\S]*?console\.warn\("Could not load from backend:", e\);\n    \}\n\}', '', content)

load_db_fixed = """
async function loadDbFromBackend() {
    try {
        const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const endpoints = ['claims', 'patients', 'denials', 'appeals', 'medical_records', 'payer_policies'];
        for (const ep of endpoints) {
            const res = await fetch(`http://localhost:8000/api/${ep}`, { headers: headers });
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
"""

content = content + "\n" + load_db_fixed

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed loadDbFromBackend injected!")
