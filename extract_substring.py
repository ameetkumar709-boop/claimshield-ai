import json
import re

with open(r'C:\Users\AmeetKumarPanda\.gemini\antigravity\brain\8f033ebc-3477-4db1-b47c-926e05ecc941\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        if data.get('type') == 'PLANNER_RESPONSE':
            for tc in data.get('tool_calls', []):
                args = tc.get('arguments', {})
                for k, v in args.items():
                    if isinstance(v, str) and len(v) > 50000 and 'function updateUserUI()' in v:
                        with open('app.original.js', 'w', encoding='utf-8') as out:
                            out.write(v)
                        print("Saved original app.js! Length:", len(v))
                        exit(0)
