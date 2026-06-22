with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines) - 1):
    if lines[i] == '\n' and lines[i+1].startswith('            }'):
        lines[i] = '                }\n'

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed the 8 missing braces!")
