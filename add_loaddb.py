import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

load_db = """
async function loadDbFromBackend() {
    try {
        const endpoints = ['claims', 'patients', 'denials', 'appeals', 'medical_records', 'payer_policies'];
        for (const ep of endpoints) {
            const res = await fetch(`http://localhost:8000/api/${ep}`);
            if (res.ok) {
                AppState.db[ep] = await res.json();
            }
        }
    } catch (e) {
        console.warn("Could not load from backend:", e);
    }
}
"""

content = content + "\n" + load_db

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("loadDbFromBackend injected!")
