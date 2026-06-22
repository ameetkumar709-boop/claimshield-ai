with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

def get_unclosed_blocks(content):
    # We will build a list of tuples (char, line_number)
    lines = content.split('\n')
    stack = []
    
    in_comment = False
    for line_idx, line in enumerate(lines):
        i = 0
        while i < len(line):
            if in_comment:
                if '*/' in line[i:]:
                    i = line.find('*/', i) + 2
                    in_comment = False
                else:
                    break
            
            elif line[i:i+2] == '/*':
                in_comment = True
                i += 2
            elif line[i:i+2] == '//':
                break
            elif line[i] in '"\'`':
                # skip string
                quote = line[i]
                i += 1
                while i < len(line) and line[i] != quote:
                    if line[i] == '\\':
                        i += 2
                    else:
                        i += 1
                i += 1
            elif line[i] == '{':
                stack.append(('{', line_idx + 1))
                i += 1
            elif line[i] == '}':
                if stack and stack[-1][0] == '{':
                    stack.pop()
                else:
                    print(f"Excess closing brace at line {line_idx + 1}")
                i += 1
            else:
                i += 1

    for item in stack:
        print(f"Unclosed opening brace from line {item[1]}")

get_unclosed_blocks(content)
