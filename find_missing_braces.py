import re

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i in range(len(lines)):
    line = lines[i]
    # Check if a line has 16 spaces, is not a comment, and the next non-empty line has LESS than 16 spaces indentation
    if len(line) - len(line.lstrip()) == 16 or len(line) - len(line.lstrip()) >= 16:
        # Check if it opened a block
        if '{' in line and '}' not in line:
            # It opened a block at >=16 spaces.
            # We need to find where it should close.
            pass

# Let's just find all lines with 12 spaces indentation that CLOSE a block, but the previous line was 16 spaces or more
for i in range(1, len(lines)):
    line = lines[i]
    prev_line = lines[i-1]
    if line.strip() == '}':
        # This is a block closer
        pass
        
def find_missing_16_space_braces():
    # A missing 16-space brace usually happens when there is a jump in indentation from 20 to 12
    # e.g.:
    #                 if (cond) {
    #                     do_something();
    #             }
    for i in range(len(lines) - 1):
        curr = lines[i]
        nxt = lines[i+1]
        
        if not curr.strip() or not nxt.strip(): continue
        
        curr_indent = len(curr) - len(curr.lstrip())
        nxt_indent = len(nxt) - len(nxt.lstrip())
        
        if curr_indent >= 20 and nxt_indent == 12 and nxt.strip().startswith('}'):
            print(f"Possible missing 16-space brace between line {i+1} and {i+2}")
            print(curr)
            print(nxt)
            print("---")
        elif curr_indent == 16 and not curr.strip().startswith('}') and nxt_indent == 12 and nxt.strip().startswith('}'):
            print(f"Possible missing 16-space brace between line {i+1} and {i+2}")
            print(curr)
            print(nxt)
            print("---")

find_missing_16_space_braces()
