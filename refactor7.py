import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_init_auth = '''function initAuth() {
    // 1. Check session persistence
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    if (token) {
        const payload = parseJwt(token);
        if (payload && payload.exp * 1000 > Date.now()) {
            AppState.sessionToken = token;
            AppState.currentUser = {
                id: payload.user_id,
                name: payload.name,
                email: payload.email,
                avatar_url: payload.avatar_url,
                role: payload.role
            };
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            
            // HYDRATE DB ON REFRESH
            loadDbFromBackend().then(() => {
                updateUserUI();
                setupRoleSwitcher();
                // Ensure current view is re-rendered with loaded data
                const currentView = document.querySelector('.view-section.active');
                if (currentView) {
                    navigateTo(currentView.id);
                }
            });
            return;
        } else {
            sessionStorage.removeItem('CLAIMSHIELD_TOKEN');
        }
    }'''

content = re.sub(r'function initAuth\(\) \{[\s\S]*?sessionStorage\.removeItem\(\'CLAIMSHIELD_TOKEN\'\);\n        \}\n    \}', new_init_auth, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('initAuth updated.')
