with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

import re

def remove_strings_comments(line):
    line = re.sub(r'//.*', '', line)
    line = re.sub(r'/\*[\s\S]*?\*/', '', line)
    line = re.sub(r'"(?:[^"\\]|\\.)*"', '""', line)
    line = re.sub(r"'(?:[^'\\]|\\.)*'", "''", line)
    line = re.sub(r"`(?:[^`\\]|\\.)*`", "``", line)
    return line

stack = 0
for i, line in enumerate(lines):
    clean = remove_strings_comments(line)
    opens = clean.count('{')
    closes = clean.count('}')
    stack += opens - closes
    if stack < 0:
        print(f"Negative stack at line {i+1}: stack={stack}")
        stack = 0 # reset to find next
        
print("Final stack:", stack)
