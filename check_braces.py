with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# very naive brace counter, excluding strings and comments
import re

# remove comments
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*[\s\S]*?\*/', '', content)

# remove strings (simplified)
content = re.sub(r'"(?:[^"\\]|\\.)*"', '""', content)
content = re.sub(r"'(?:[^'\\]|\\.)*'", "''", content)
content = re.sub(r"`(?:[^`\\]|\\.)*`", "``", content)

open_braces = content.count('{')
close_braces = content.count('}')

print(f'Open: {open_braces}, Close: {close_braces}')
if open_braces != close_braces:
    print('WARNING: Brace mismatch!')
else:
    print('Brace counts match (roughly)')
