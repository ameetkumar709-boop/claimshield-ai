with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find if the first 10,000 characters exist again somewhere else
first_chunk = content[:10000]
print("Occurrences of first 10k chars:", content.count(first_chunk))

# If so, where is the second occurrence?
if content.count(first_chunk) > 1:
    idx = content.find(first_chunk, 10000)
    print("Starts again at index:", idx)
