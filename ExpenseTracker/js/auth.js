/**
 * ============================================
 * Smart Expense Tracker - Authentication Module
 * ============================================
 * Handles user registration, login, logout, and session management
 * using LocalStorage for persistent data storage.
 */

const auth = {
    // Storage keys
    USERS_KEY: 'expense_tracker_users',
    SESSION_KEY: 'expense_tracker_session',

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Initialize the auth module
     */
    init() {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available. Running in memory-only mode.');
            this._memoryStore = { users: [], session: null, data: {} };
            return;
        }

        // Ensure users array exists in localStorage
        if (!this._getItem(this.USERS_KEY)) {
            this._setItem(this.USERS_KEY, JSON.stringify([]));
        }

        // Handle ?logout URL parameter to clear session
        if (window.location.search.includes('logout')) {
            this._removeItem(this.SESSION_KEY);
            console.log('Session cleared via logout parameter');
            // Clean URL
            if (window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    },

    /**
     * Safe wrapper for localStorage.getItem
     */
    _getItem(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },

    /**
     * Safe wrapper for localStorage.setItem
     */
    _setItem(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    },

    /**
     * Safe wrapper for localStorage.removeItem
     */
    _removeItem(key) {
        try { localStorage.removeItem(key); } catch (e) {}
    },

    /**
     * Get all registered users
     * @returns {Array} Array of user objects
     */
    getUsers() {
        const users = this._getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    /**
     * Save users array to localStorage
     * @param {Array} users - Array of user objects
     */
    saveUsers(users) {
        this._setItem(this.USERS_KEY, JSON.stringify(users));
    },

    /**
     * Hash password (simple hash for demo purposes)
     * In production, use bcrypt or similar
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },

    /**
     * Register a new user
     * @param {string} name - User's full name
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Object} Result object with success status and message
     */
    signup(name, email, password) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'Email already registered!' };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        // Initialize user's transaction data
        this.initUserData(newUser.id);

        return { success: true, message: 'Account created successfully!' };
    },

    /**
     * Login user with credentials
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Object} Result object with success status and message
     */
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return { success: false, message: 'Email not found!' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Incorrect password!' };
        }

        // Create session
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString()
        };

        this._setItem(this.SESSION_KEY, JSON.stringify(session));

        return { success: true, message: 'Login successful!' };
    },

    /**
     * Logout current user
     */
    logout() {
        this._removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    /**
     * Get current session
     * @returns {Object|null} Session object or null
     */
    getSession() {
        const session = this._getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getSession() !== null;
    },

    /**
     * Check session and redirect if needed
     * Used on dashboard page to protect route
     */
    checkSession() {
        const session = this.getSession();
        const pathname = window.location.pathname;
        const isDashboard = pathname.includes('dashboard.html');
        const isLoginPage = pathname.includes('index.html') || pathname.endsWith('/');

        console.log('[Auth] checkSession called. Path:', pathname, 'Session:', session ? 'exists' : 'none');

        // If on dashboard and not logged in, redirect to login
        if (isDashboard) {
            if (!session) {
                console.log('[Auth] No session on dashboard, redirecting to login');
                window.location.href = 'index.html';
                return;
            }
            // Update UI with user name
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = session.name;
            }
        }

        // If on login page and logged in, redirect to dashboard
        if (isLoginPage) {
            if (session) {
                console.log('[Auth] Session found on login page, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            } else {
                console.log('[Auth] No session, staying on login page');
            }
        }
    },

    /**
     * Initialize user-specific data storage
     * @param {string} userId - User's unique ID
     */
    initUserData(userId) {
        const key = `expense_tracker_data_${userId}`;
        if (!this._getItem(key)) {
            this._setItem(key, JSON.stringify({
                transactions: [],
                budget: 0,
                createdAt: new Date().toISOString()
            }));
        }
    },

    /**
     * Get current user's data
     * @returns {Object|null} User data object
     */
    getUserData() {
        const session = this.getSession();
        if (!session) return null;

        const key = `expense_tracker_data_${session.userId}`;
        const data = this._getItem(key);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Save current user's data
     * @param {Object} data - User data object
     */
    saveUserData(data) {
        const session = this.getSession();
        if (!session) return;

        const key = `expense_tracker_data_${session.userId}`;
        this._setItem(key, JSON.stringify(data));
    }
};

// Initialize auth module
auth.init();

// ============================================
// Event Listeners for Auth Forms
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check session on page load
    auth.checkSession();

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            const result = auth.login(email, password);
            
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                showToast(result.message, 'error');
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirm').value;

            // Validation
            if (!name || !email || !password || !confirm) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            if (password !== confirm) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            const result = auth.signup(name, email, password);
            
            if (result.success) {
                showToast(result.message, 'success');
                // Auto login after signup
                setTimeout(() => {
                    const loginResult = auth.login(email, password);
                    if (loginResult.success) {
                        window.location.href = 'dashboard.html';
                    }
                }, 500);
            } else {
                showToast(result.message, 'error');
            }
        });
    }
});

// ============================================
// Toast Notification System
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
        <p>${message}</p>
    `;
    
    container.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, duration);
}

