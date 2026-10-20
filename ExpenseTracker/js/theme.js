/**
 * ============================================
 * Smart Expense Tracker - Theme Manager
 * ============================================
 * Handles dark/light mode toggle with persistent storage
 */

const themeManager = {
    STORAGE_KEY: 'expense_tracker_theme',

    /**
     * Initialize theme manager
     * Apply saved theme or detect system preference
     */
    init() {
        const savedTheme = this.getSavedTheme();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else if (prefersDark) {
            this.applyTheme('dark');
        } else {
            this.applyTheme('light');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
        
        showToast(`Switched to ${newTheme} mode`, 'success');
    },

    /**
     * Apply theme to document
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button text/icon if exists
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            const text = toggleBtn.childNodes[toggleBtn.childNodes.length - 1];
            
            if (theme === 'dark') {
                if (icon) icon.className = 'fas fa-sun';
                if (text) text.textContent = ' Light Mode';
            } else {
                if (icon) icon.className = 'fas fa-moon';
                if (text) text.textContent = ' Dark Mode';
            }
        }
    },

    /**
     * Get current active theme
     * @returns {string} 'light' or 'dark'
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    /**
     * Save theme preference to localStorage
     * @param {string} theme - 'light' or 'dark'
     */
    saveTheme(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
    },

    /**
     * Get saved theme preference
     * @returns {string|null}
     */
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    }
};
