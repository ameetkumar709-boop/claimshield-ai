import json
import re

with open(r'C:\Users\AmeetKumarPanda\.gemini\antigravity\brain\8f033ebc-3477-4db1-b47c-926e05ecc941\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    longest = ""
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        
        # We just recursively search the entire JSON object for long strings
        def search_dict(d):
            global longest
            if isinstance(d, dict):
                for v in d.values():
                    search_dict(v)
            elif isinstance(d, list):
                for v in d:
                    search_dict(v)
            elif isinstance(d, str):
                if len(d) > len(longest) and 'function updateUserUI()' in d:
                    longest = d

        search_dict(data)

    if longest:
        with open('app.original.js', 'w', encoding='utf-8') as out:
            out.write(longest)
        print("Saved original app.js! Length:", len(longest))
    else:
        print("Not found!")
