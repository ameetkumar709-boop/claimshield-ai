import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fetch("/api/claims")', 'fetch("http://localhost:8000/api/claims")')
content = content.replace('fetch("/api/patients")', 'fetch("http://localhost:8000/api/patients")')
content = content.replace('fetch("/api/denials")', 'fetch("http://localhost:8000/api/denials")')
content = content.replace('fetch("/api/appeals")', 'fetch("http://localhost:8000/api/appeals")')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js URLs fixed.')
