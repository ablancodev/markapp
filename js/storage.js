// Storage Manager - Handles persistence of directory handle and session state
class StorageManager {
    constructor() {
        this.dbName = 'MarkApp';
        this.dbVersion = 1;
        this.storeName = 'session';
        this.db = null;
        console.log('StorageManager initialized');
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    // Save directory handle to IndexedDB
    async saveDirectoryHandle(directoryHandle) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const request = store.put(directoryHandle, 'rootDirectory');

                request.onsuccess = () => {
                    // Also save folder name to localStorage for quick display
                    localStorage.setItem('markapp_folder_name', directoryHandle.name);
                    console.log('Directory handle saved');
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error saving directory handle:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in saveDirectoryHandle:', err);
            throw err;
        }
    }

    // Load directory handle from IndexedDB
    async loadDirectoryHandle() {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);

                const request = store.get('rootDirectory');

                request.onsuccess = async () => {
                    const handle = request.result;

                    if (handle) {
                        // Verify we still have permission to access this directory
                        const permissionStatus = await handle.queryPermission({ mode: 'readwrite' });

                        if (permissionStatus === 'granted') {
                            console.log('Directory handle loaded from storage');
                            resolve(handle);
                        } else if (permissionStatus === 'prompt') {
                            // Request permission
                            const newPermission = await handle.requestPermission({ mode: 'readwrite' });
                            if (newPermission === 'granted') {
                                console.log('Permission granted for saved directory');
                                resolve(handle);
                            } else {
                                console.log('Permission denied for saved directory');
                                resolve(null);
                            }
                        } else {
                            console.log('No permission for saved directory');
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.error('Error loading directory handle:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in loadDirectoryHandle:', err);
            return null;
        }
    }

    // Get saved folder name from localStorage (for quick display)
    getSavedFolderName() {
        return localStorage.getItem('markapp_folder_name') || null;
    }

    // Clear saved session
    async clearSession() {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const request = store.delete('rootDirectory');

                request.onsuccess = () => {
                    localStorage.removeItem('markapp_folder_name');
                    console.log('Session cleared');
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error clearing session:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in clearSession:', err);
            throw err;
        }
    }

    // === TABS METHODS ===

    // Save tab directory handle to IndexedDB
    async saveTabHandle(tabId, directoryHandle) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const key = `tab_${tabId}`;
                const request = store.put(directoryHandle, key);

                request.onsuccess = () => {
                    console.log('Tab handle saved:', tabId);
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error saving tab handle:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in saveTabHandle:', err);
            throw err;
        }
    }

    // Load tab directory handle from IndexedDB
    async loadTabHandle(tabId) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);

                const key = `tab_${tabId}`;
                const request = store.get(key);

                request.onsuccess = async () => {
                    const handle = request.result;

                    if (handle) {
                        // Verify we still have permission
                        const permissionStatus = await handle.queryPermission({ mode: 'readwrite' });

                        if (permissionStatus === 'granted') {
                            resolve(handle);
                        } else if (permissionStatus === 'prompt') {
                            const newPermission = await handle.requestPermission({ mode: 'readwrite' });
                            if (newPermission === 'granted') {
                                resolve(handle);
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.error('Error loading tab handle:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in loadTabHandle:', err);
            return null;
        }
    }

    // Delete tab handle from IndexedDB
    async deleteTabHandle(tabId) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const key = `tab_${tabId}`;
                const request = store.delete(key);

                request.onsuccess = () => {
                    console.log('Tab handle deleted:', tabId);
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting tab handle:', request.error);
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error in deleteTabHandle:', err);
            throw err;
        }
    }

    // Save tabs metadata to localStorage
    saveTabsMetadata(tabsData) {
        localStorage.setItem('markapp_tabs', JSON.stringify(tabsData));
    }

    // Load tabs metadata from localStorage
    loadTabsMetadata() {
        const data = localStorage.getItem('markapp_tabs');
        return data ? JSON.parse(data) : null;
    }

    // Save active tab ID
    saveActiveTabId(tabId) {
        localStorage.setItem('markapp_active_tab', tabId);
    }

    // Load active tab ID
    loadActiveTabId() {
        return localStorage.getItem('markapp_active_tab') || null;
    }
}

// Export singleton instance (as global variable)
window.storageManager = new StorageManager();
