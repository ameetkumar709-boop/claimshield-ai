import json

with open(r'C:\Users\AmeetKumarPanda\.gemini\antigravity\brain\8f033ebc-3477-4db1-b47c-926e05ecc941\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        if data.get('type') == 'PLANNER_RESPONSE':
            for tc in data.get('tool_calls', []):
                args = tc.get('arguments', {})
                if 'app.js' in str(args):
                    if 'CodeContent' in args:
                        content = args['CodeContent']
                        if len(content) > 10000: # It's the full file!
                            with open('app.original.js', 'w', encoding='utf-8') as out:
                                out.write(content)
                            print("Saved original app.js! Length:", len(content))
                            exit(0)
