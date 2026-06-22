with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

chunk = content[:1000]
print("Occurrences of first 1k chars:", content.count(chunk))
