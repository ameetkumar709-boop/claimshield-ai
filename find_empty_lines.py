with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines) - 1):
    if lines[i] == '\n' and lines[i+1].startswith('            }'):
        print(f"Empty line {i+1} followed by {lines[i+1].strip()}")
