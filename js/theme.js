// Theme Manager - Handles theme switching and persistence
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = ['light', 'dark', 'retro-green'];
        console.log('ThemeManager initialized');
    }

    // Initialize theme from localStorage
    init() {
        const savedTheme = localStorage.getItem('markapp_theme');
        if (savedTheme && this.themes.includes(savedTheme)) {
            this.setTheme(savedTheme, false);
        } else {
            this.setTheme('light', false);
        }

        // Update button active state
        this.updateButtonState();
    }

    // Update active button state
    updateButtonState() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Set theme
    setTheme(themeName, save = true) {
        if (!this.themes.includes(themeName)) {
            console.error('Invalid theme:', themeName);
            return;
        }

        // Remove all theme classes
        this.themes.forEach(theme => {
            document.body.classList.remove(`theme-${theme}`);
        });

        // Add new theme class
        document.body.classList.add(`theme-${themeName}`);

        this.currentTheme = themeName;

        // Save to localStorage
        if (save) {
            localStorage.setItem('markapp_theme', themeName);
        }

        // Update button state
        this.updateButtonState();

        console.log('Theme set to:', themeName);
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Cycle to next theme
    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];
        this.setTheme(nextTheme);
        return nextTheme;
    }
}

// Export singleton instance (as global variable)
window.themeManager = new ThemeManager();
