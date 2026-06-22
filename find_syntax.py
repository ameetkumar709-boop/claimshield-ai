import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

def find_syntax_error(code):
    stack = []
    i = 0
    line_num = 1
    
    while i < len(code):
        char = code[i]
        
        if char == '\n':
            line_num += 1
            i += 1
            continue
            
        # skip line comments
        if char == '/' and i + 1 < len(code) and code[i+1] == '/':
            i += 2
            while i < len(code) and code[i] != '\n':
                i += 1
            continue
            
        # skip block comments
        if char == '/' and i + 1 < len(code) and code[i+1] == '*':
            i += 2
            while i + 1 < len(code) and not (code[i] == '*' and code[i+1] == '/'):
                if code[i] == '\n':
                    line_num += 1
                i += 1
            i += 2
            continue
            
        # skip strings
        if char in ('"', "'", '`'):
            quote = char
            i += 1
            while i < len(code) and code[i] != quote:
                if code[i] == '\\':
                    i += 2 # skip escaped character
                else:
                    if code[i] == '\n':
                        line_num += 1
                    # check for template literal interpolation ${...}
                    if quote == '`' and code[i:i+2] == '${':
                        stack.append(('${', line_num))
                        i += 2
                        continue
                    i += 1
            i += 1
            continue
            
        # braces
        if char == '{':
            stack.append(('{', line_num))
            i += 1
            continue
            
        if char == '}':
            if not stack:
                print(f"Extra closing brace at line {line_num}")
            else:
                top, _ = stack.pop()
                if top not in ('{', '${'):
                    print(f"Mismatched brace at line {line_num}: expected to close {top}")
            i += 1
            continue
            
        i += 1

    print(f"Remaining open braces: {len(stack)}")
    for top, lnum in stack:
        print(f"Unclosed {top} from line {lnum}")

find_syntax_error(content)
