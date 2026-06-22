with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove multiline comments
content = re.sub(r'/\*[\s\S]*?\*/', '', content)
# Remove single line comments
content = re.sub(r'//.*', '', content)

# Remove template literals (naively, ignoring nested templates for now)
content = re.sub(r'`[^`]*`', '``', content)

# Remove normal strings
content = re.sub(r'"(?:[^"\\]|\\.)*"', '""', content)
content = re.sub(r"'(?:[^'\\]|\\.)*'", "''", content)

open_braces = content.count('{')
close_braces = content.count('}')

print(f'Open: {open_braces}, Close: {close_braces}')
