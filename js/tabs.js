// Tabs Manager - Handles multiple folder tabs
class TabsManager {
    constructor() {
        this.tabs = []; // Array of { id, name, dirHandle }
        this.activeTabId = null;
        this.onTabSwitch = null;
        this.onTabClose = null;
        console.log('TabsManager initialized');
    }

    // Generate unique ID for tab
    generateId() {
        return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add a new tab
    addTab(name, dirHandle) {
        const id = this.generateId();
        const tab = {
            id: id,
            name: name,
            dirHandle: dirHandle
        };

        this.tabs.push(tab);
        this.activeTabId = id;

        console.log('Tab added:', name);
        return tab;
    }

    // Remove a tab
    removeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return false;

        this.tabs.splice(index, 1);

        // If we removed the active tab, switch to another
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                // Switch to previous tab, or first if it was the first tab
                const newIndex = Math.max(0, index - 1);
                this.activeTabId = this.tabs[newIndex].id;
            } else {
                this.activeTabId = null;
            }
        }

        console.log('Tab removed:', tabId);
        return true;
    }

    // Switch active tab
    switchTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return false;

        this.activeTabId = tabId;
        console.log('Switched to tab:', tab.name);
        return tab;
    }

    // Get active tab
    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId) || null;
    }

    // Get all tabs
    getAllTabs() {
        return this.tabs;
    }

    // Check if tab with name already exists
    hasTabWithName(name) {
        return this.tabs.some(t => t.name === name);
    }

    // Get tab by ID
    getTabById(tabId) {
        return this.tabs.find(t => t.id === tabId) || null;
    }

    // Clear all tabs
    clearAll() {
        this.tabs = [];
        this.activeTabId = null;
    }

    // Serialize tabs for storage (without dirHandle which can't be serialized)
    serializeForStorage() {
        return this.tabs.map(tab => ({
            id: tab.id,
            name: tab.name
        }));
    }

    // Load tabs metadata (will need to restore dirHandles separately)
    loadMetadata(tabsMetadata) {
        this.tabs = tabsMetadata.map(meta => ({
            id: meta.id,
            name: meta.name,
            dirHandle: null // Will be restored later
        }));

        if (this.tabs.length > 0 && !this.activeTabId) {
            this.activeTabId = this.tabs[0].id;
        }
    }
}

// Export singleton instance (as global variable)
window.tabsManager = new TabsManager();
