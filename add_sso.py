import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

sso_code = """
// ============================================================================
// Google SSO & Authentication
// ============================================================================
function onGoogleLibraryLoad() {
    initGoogleButton();
}

function initGoogleButton() {
    const btn = document.getElementById('google-signin-btn');
    if (btn) {
        btn.onclick = () => {
            simulateGoogleLogin('admin');
        };
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

function simulateGoogleLogin(roleKeyword) {
    const mockTokens = {
        'admin': 'mock-google-token-admin',
        'physician': 'mock-google-token-physician',
        'billing': 'mock-google-token-billing',
        'appeals': 'mock-google-token-appeals'
    };
    authenticateToken(mockTokens[roleKeyword] || mockTokens['admin']);
}

async function authenticateToken(token) {
    try {
        const res = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });
        
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('CLAIMSHIELD_TOKEN', data.access_token);
            window.location.reload();
        } else {
            console.error("Login failed:", await res.text());
        }
    } catch (e) {
        console.error("Login fetch error:", e);
    }
}

function logoutUser() {
    sessionStorage.removeItem('CLAIMSHIELD_TOKEN');
    window.location.reload();
}

// Exposures
window.onGoogleLibraryLoad = onGoogleLibraryLoad;
window.simulateGoogleLogin = simulateGoogleLogin;
window.logoutUser = logoutUser;
"""

new_initAuth = """function initAuth() {
    const token = sessionStorage.getItem('CLAIMSHIELD_TOKEN');
    if (token) {
        const payload = parseJwt(token);
        if (payload && payload.exp * 1000 > Date.now()) {
            AppState.sessionToken = token;
            // Map payload role to our user DB if needed, but payload has all we need
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
                } else {
                    navigateTo('dashboard');
                }
            });
            return;
        } else {
            sessionStorage.removeItem('CLAIMSHIELD_TOKEN');
        }
    }
    
    // Not logged in
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    
    const roleSelect = document.getElementById('role-select');
    const defaultUser = AppState.db.users.find(u => u.role === "Billing Specialist");
    AppState.currentUser = defaultUser;
    if (roleSelect) roleSelect.value = defaultUser.id;
    updateUserUI();
    
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            const userId = e.target.value;
            const user = AppState.db.users.find(u => u.id === userId);
            const oldRole = AppState.currentUser.role;
            AppState.currentUser = user;
            AppState.logAudit("ROLE_SWITCH", "users", user.id, { role: oldRole }, { role: user.role });
            updateUserUI();
            if(AppState.currentView) renderView(AppState.currentView);
        });
    }
}"""

content = re.sub(r'function initAuth\(\) \{[\s\S]*?renderView\(AppState\.currentView\);\n    \}\);\n\}', new_initAuth, content)
content = content + "\n" + sso_code

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("SSO injected into app.js!")
