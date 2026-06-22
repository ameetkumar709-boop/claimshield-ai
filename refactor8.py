import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const currentView = document.querySelector('.view-section.active');\\n                if (currentView) {\\n                    navigateTo(currentView.id);\\n                }",
    "navigateTo(AppState.currentView || 'dashboard');"
)

# And if we want to be safe in case the regex replace fails:
content = content.replace("const currentView = document.querySelector('.view-section.active');", "")
content = content.replace("if (currentView) {", "")
content = content.replace("navigateTo(currentView.id);", "navigateTo(AppState.currentView || 'dashboard');")
content = content.replace("                }", "")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js fixed.')
