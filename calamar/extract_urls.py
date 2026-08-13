import re
text = open(r'C:\Users\Trabalho\.gemini\antigravity\brain\74c3618f-b833-494d-8563-9644889cc9ba\.system_generated\steps\20\content.md', encoding='utf-8').read()
urls = set(re.findall(r'https://[^\s\"\'\(\)]+\.(?:png|jpg|svg)', text))
for u in urls: print(u)
