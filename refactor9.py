import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '"Authorization": `Bearer ${AppState.sessionToken}`\\n,\\n                body: JSON.stringify({ role: newRole })',
    '"Authorization": `Bearer ${AppState.sessionToken}`\\n                },\\n                body: JSON.stringify({ role: newRole })'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js syntax fixed.')
