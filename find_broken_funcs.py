import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# very rough function boundary detection
functions = re.finditer(r'^async function \w+\(|^function \w+\(', content, re.MULTILINE)

prev_pos = -1
prev_name = ""
for match in functions:
    if prev_pos != -1:
        func_content = content[prev_pos:match.start()]
        opens = func_content.count('{')
        closes = func_content.count('}')
        if opens != closes:
            print(f"Function {prev_name} has mismatched braces! Open: {opens}, Close: {closes}, Diff: {opens - closes}")
    prev_pos = match.start()
    prev_name = match.group(0)

if prev_pos != -1:
    func_content = content[prev_pos:]
    opens = func_content.count('{')
    closes = func_content.count('}')
    if opens != closes:
        print(f"Function {prev_name} has mismatched braces! Open: {opens}, Close: {closes}, Diff: {opens - closes}")
