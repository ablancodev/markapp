// Main Application - Initializes and coordinates all managers
class App {
    constructor() {
        this.currentMode = 'view'; // 'view' or 'edit'
        this.currentFile = null;
        this.init();
    }

    // Initialize application
    async init() {
        this.checkBrowserSupport();

        // Initialize theme
        if (window.themeManager) {
            window.themeManager.init();
        }

        this.setupEventListeners();
        this.setupCallbacks();
        this.hideEmptyState();

        // Try to restore previous session
        await this.tryRestoreSession();
    }

    // Try to restore previous session (tabs)
    async tryRestoreSession() {
        if (!window.storageManager) {
            console.log('StorageManager no disponible');
            return;
        }

        try {
            // Load tabs metadata
            const tabsMetadata = window.storageManager.loadTabsMetadata();
            const activeTabId = window.storageManager.loadActiveTabId();

            if (!tabsMetadata || tabsMetadata.length === 0) {
                console.log('No hay pestañas guardadas');
                return;
            }

            console.log('Restaurando pestañas:', tabsMetadata);

            // Load tabs metadata into tabs manager
            window.tabsManager.loadMetadata(tabsMetadata);

            // Restore directory handles for each tab
            for (const tab of window.tabsManager.getAllTabs()) {
                try {
                    const handle = await window.storageManager.loadTabHandle(tab.id);
                    if (handle) {
                        tab.dirHandle = handle;
                        console.log('Handle restaurado para tab:', tab.name);
                    } else {
                        console.warn('No se pudo restaurar handle para tab:', tab.name);
                        // Remove tabs without handles
                        window.tabsManager.removeTab(tab.id);
                    }
                } catch (err) {
                    console.error('Error restaurando handle para tab:', tab.name, err);
                    window.tabsManager.removeTab(tab.id);
                }
            }

            // Set active tab
            if (activeTabId) {
                const tab = window.tabsManager.getTabById(activeTabId);
                if (tab && tab.dirHandle) {
                    window.tabsManager.activeTabId = activeTabId;
                    await this.loadTab(tab);
                } else {
                    // If saved active tab doesn't exist, load first available
                    const firstTab = window.tabsManager.getAllTabs()[0];
                    if (firstTab && firstTab.dirHandle) {
                        window.tabsManager.activeTabId = firstTab.id;
                        await this.loadTab(firstTab);
                    }
                }
            } else {
                // Load first tab
                const firstTab = window.tabsManager.getAllTabs()[0];
                if (firstTab && firstTab.dirHandle) {
                    window.tabsManager.activeTabId = firstTab.id;
                    await this.loadTab(firstTab);
                }
            }

            // Render tabs UI
            this.renderTabs();

            console.log('Sesión restaurada con', window.tabsManager.getAllTabs().length, 'pestañas');
        } catch (err) {
            console.error('Error restaurando sesión:', err);
        }
    }

    // Check browser support
    checkBrowserSupport() {
        if (!fileManager.isSupported()) {
            alert('Tu navegador no soporta File System Access API.\n\nPor favor usa:\n- Google Chrome\n- Microsoft Edge\n- Opera');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Open folder button
        document.getElementById('openFolderBtn').addEventListener('click', () => {
            this.openFolder();
        });

        // New page button
        document.getElementById('newPageBtn').addEventListener('click', () => {
            this.showNewPageModal();
        });

        // New folder button
        document.getElementById('newFolderBtn').addEventListener('click', () => {
            this.showNewFolderModal();
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (window.themeManager) {
                    window.themeManager.setTheme(theme);
                    // Update active state
                    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Mode toggle buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveFile();
        });

        // New page modal
        document.getElementById('cancelNewPage').addEventListener('click', () => {
            this.hideNewPageModal();
        });

        document.getElementById('confirmNewPage').addEventListener('click', () => {
            this.createNewPage();
        });

        document.getElementById('newPageName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createNewPage();
            }
        });

        // New folder modal
        document.getElementById('cancelNewFolder').addEventListener('click', () => {
            this.hideNewFolderModal();
        });

        document.getElementById('confirmNewFolder').addEventListener('click', () => {
            this.createNewFolder();
        });

        document.getElementById('newFolderNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createNewFolder();
            }
        });

        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (editorManager.hasChanges()) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de salir?';
            }
        });
    }

    // Setup callbacks
    setupCallbacks() {
        // Sidebar file selection callback
        sidebarManager.onFileSelect = (entry) => {
            this.loadFile(entry);
        };

        // Sidebar file drop callback
        sidebarManager.onFileDrop = (sourceFile, targetFolder) => {
            this.moveFile(sourceFile, targetFolder);
        };

        // Editor change callback
        editorManager.onChange = (content) => {
            // Update viewer in real-time if in edit mode
            if (this.currentMode === 'edit' && this.currentFile) {
                const fileExtension = this.currentFile.extension || fileManager.getFileExtension(this.currentFile.name);
                viewerManager.render(content, fileExtension);
            }
            this.updateSaveButton();
        };

        // Editor save callback
        editorManager.onSave = () => {
            this.saveFile();
        };
    }

    // Open folder
    async openFolder() {
        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            const folderName = dirHandle.name;

            // Check if folder is already open in a tab
            if (window.tabsManager.hasTabWithName(folderName)) {
                alert(`La carpeta "${folderName}" ya está abierta en una pestaña`);
                return;
            }

            // Try to read the directory first
            try {
                window.fileManager.rootDirHandle = dirHandle;
                await window.fileManager.readDirectory();
            } catch (readErr) {
                console.error('Error leyendo carpeta:', readErr);

                // Provide more specific error messages
                if (readErr.name === 'NotAllowedError' || readErr.message.includes('permission')) {
                    alert(`⚠️ Ubicación bloqueada por el navegador\n\nLa carpeta "${folderName}" está en una ubicación del sistema que el navegador no permite acceder por seguridad:\n\n❌ /Applications/ (macOS)\n❌ C:\\Program Files\\ (Windows)\n❌ Carpetas de aplicaciones\n\n✅ Soluciones:\n• Usa carpetas en tu directorio personal (Documentos, Escritorio)\n• Crea un enlace simbólico desde tu carpeta de usuario\n• Trabaja desde ~/Documents/ o ~/Desktop/`);
                } else if (readErr.name === 'SecurityError') {
                    alert(`⚠️ Error de seguridad del navegador\n\nEsta ubicación está protegida y no se puede acceder.\n\n✅ Usa carpetas de usuario:\n• ~/Documents/\n• ~/Desktop/\n• Cualquier carpeta en tu directorio personal`);
                } else {
                    alert(`Error al leer la carpeta: ${readErr.message}\n\nIntenta con otra carpeta fuera de ubicaciones del sistema.`);
                }
                return;
            }

            // Add new tab
            const tab = window.tabsManager.addTab(folderName, dirHandle);

            // Save tab handle to storage
            if (window.storageManager) {
                await window.storageManager.saveTabHandle(tab.id, dirHandle);
                window.storageManager.saveTabsMetadata(window.tabsManager.serializeForStorage());
                window.storageManager.saveActiveTabId(tab.id);
            }

            // Load this tab
            await this.loadTab(tab);

            // Render tabs UI
            this.renderTabs();

            console.log('Carpeta abierta en nueva pestaña:', folderName);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Usuario canceló la selección de carpeta');
                return;
            }

            // Handle picker-level errors
            if (err.name === 'NotAllowedError') {
                alert('⚠️ Ubicación bloqueada por seguridad\n\nEl navegador no permite acceder a carpetas del sistema como:\n• /Applications/ (macOS)\n• C:\\Program Files\\ (Windows)\n• Carpetas de aplicaciones instaladas\n\n✅ Usa carpetas de usuario:\n• ~/Documents/mi-proyecto\n• ~/Desktop/notas\n• Cualquier carpeta en tu directorio personal');
                return;
            }

            if (err.name === 'SecurityError') {
                alert('⚠️ Error de seguridad del navegador\n\nEsta ubicación está protegida.\n\n✅ Solución:\nTrabaja desde carpetas de usuario (Documentos, Escritorio, etc.)');
                return;
            }

            console.error('Error opening folder:', err);
            alert('Error al abrir carpeta: ' + err.message);
        }
    }

    // Update folder indicator in header
    updateFolderIndicator(folderName) {
        const indicator = document.getElementById('currentFolder');
        const nameElement = document.getElementById('currentFolderName');

        if (folderName) {
            nameElement.textContent = folderName;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }

    // Load file
    async loadFile(entry) {
        try {
            // Save current file if dirty
            if (editorManager.hasChanges() && this.currentFile) {
                const shouldSave = confirm('¿Guardar cambios antes de cambiar de archivo?');
                if (shouldSave) {
                    await this.saveFile();
                }
            }

            // Read file content
            const content = await fileManager.readFile(entry.handle);

            // Get file extension
            const fileExtension = entry.extension || fileManager.getFileExtension(entry.name);

            // Load into editor
            editorManager.loadContent(content);

            // Render in viewer with file type
            viewerManager.render(content, fileExtension);

            // Update UI
            this.currentFile = entry;
            const displayName = fileManager.getFileNameWithoutExtension(entry.name);
            const fileTypeIndicator = fileExtension ? ` (.${fileExtension})` : '';
            document.getElementById('contentTitle').textContent = displayName + fileTypeIndicator;

            // Show mode toggle and editor/viewer
            this.showContent();

            // Switch to view mode by default
            this.switchMode('view');

            console.log('Archivo cargado:', entry.name, 'tipo:', fileExtension);
        } catch (err) {
            console.error('Error loading file:', err);
            alert('Error al cargar archivo: ' + err.message);
        }
    }

    // Switch between view and edit modes
    switchMode(mode) {
        this.currentMode = mode;

        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show/hide editor and viewer
        if (mode === 'view') {
            editorManager.hide();
            viewerManager.show();
            document.getElementById('saveBtn').style.display = 'none';
        } else {
            viewerManager.hide();
            editorManager.show();
            editorManager.focus();
            this.updateSaveButton();
        }
    }

    // Save current file
    async saveFile() {
        if (!this.currentFile) {
            alert('No hay archivo abierto');
            return;
        }

        try {
            const content = editorManager.getContent();
            await fileManager.saveCurrentFile(content);

            // Update viewer with file type
            const fileExtension = this.currentFile.extension || fileManager.getFileExtension(this.currentFile.name);
            viewerManager.render(content, fileExtension);

            // Mark as saved
            editorManager.markAsSaved();
            this.updateSaveButton();

            console.log('Archivo guardado:', this.currentFile.name);
        } catch (err) {
            console.error('Error saving file:', err);
            alert('Error al guardar archivo: ' + err.message);
        }
    }

    // Update save button visibility
    updateSaveButton() {
        const saveBtn = document.getElementById('saveBtn');
        if (this.currentMode === 'edit' && editorManager.hasChanges()) {
            saveBtn.style.display = 'block';
        } else {
            saveBtn.style.display = 'none';
        }
    }

    // Show content area
    showContent() {
        document.querySelector('.empty-state').style.display = 'none';
        document.getElementById('modeToggle').style.display = 'flex';
    }

    // Hide content area
    hideContent() {
        document.querySelector('.empty-state').style.display = 'flex';
        document.getElementById('modeToggle').style.display = 'none';
        document.getElementById('saveBtn').style.display = 'none';
        editorManager.hide();
        viewerManager.hide();
    }

    // Show new page modal
    showNewPageModal() {
        const modal = document.getElementById('newPageModal');
        modal.classList.add('active');
        document.getElementById('newPageName').value = '';

        // Populate folder selector
        this.populateFolderSelector();

        document.getElementById('newPageName').focus();
    }

    // Show new folder modal
    showNewFolderModal() {
        const modal = document.getElementById('newFolderModal');
        modal.classList.add('active');
        document.getElementById('newFolderNameInput').value = '';

        // Populate folder selector
        this.populateFolderSelectorForFolder();

        document.getElementById('newFolderNameInput').focus();
    }

    // Populate folder selector for folders (same as pages but different select element)
    populateFolderSelectorForFolder() {
        const select = document.getElementById('folderSelectForFolder');
        select.innerHTML = '<option value="">Raíz de la carpeta</option>';

        const folders = fileManager.getAllFolders();
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.path.join('/');
            option.textContent = folder.displayPath;
            select.appendChild(option);
        });
    }

    // Populate folder selector with available folders
    populateFolderSelector() {
        const select = document.getElementById('folderSelect');
        select.innerHTML = '<option value="">Raíz de la carpeta</option>';

        const folders = fileManager.getAllFolders();
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.path.join('/');
            option.textContent = folder.displayPath;
            select.appendChild(option);
        });
    }

    // Hide new page modal
    hideNewPageModal() {
        const modal = document.getElementById('newPageModal');
        modal.classList.remove('active');
    }

    // Hide new folder modal
    hideNewFolderModal() {
        const modal = document.getElementById('newFolderModal');
        modal.classList.remove('active');
    }

    // Create new page
    async createNewPage() {
        const pageNameInput = document.getElementById('newPageName');
        const fileTypeSelect = document.getElementById('fileTypeSelect');
        const folderSelect = document.getElementById('folderSelect');

        const fileName = pageNameInput.value.trim();
        const fileType = fileTypeSelect.value;
        const selectedFolder = folderSelect.value;

        if (!fileName) {
            alert('Por favor ingresa un nombre para la página');
            return;
        }

        // Validate filename
        if (!/^[a-zA-Z0-9-_\s]+$/.test(fileName)) {
            alert('El nombre solo puede contener letras, números, guiones y espacios');
            return;
        }

        try {
            let targetDirHandle = fileManager.rootDirHandle;
            let filePath = [fileName + '.' + fileType];

            // If creating in an existing folder
            if (selectedFolder) {
                const selectedPath = selectedFolder.split('/');
                targetDirHandle = await fileManager.getDirectoryHandle(selectedPath);
                filePath = [...selectedPath, fileName + '.' + fileType];
            }

            // Create file in target directory with specified type
            const fileHandle = await fileManager.createFile(fileName, targetDirHandle, fileType);

            // Refresh sidebar
            sidebarManager.render(fileManager.files);

            // Close modal
            this.hideNewPageModal();

            // Open the new file
            const newFile = fileManager.findFileByPath(filePath);
            if (newFile) {
                sidebarManager.selectFileByPath(newFile.path);
                await this.loadFile(newFile);
                this.switchMode('edit');
            }

            console.log('Página creada:', fileName, 'tipo:', fileType, 'en', filePath.join('/'));
        } catch (err) {
            console.error('Error creating page:', err);
            alert('Error al crear página: ' + err.message);
        }
    }

    // Create new folder
    async createNewFolder() {
        const folderNameInput = document.getElementById('newFolderNameInput');
        const folderSelect = document.getElementById('folderSelectForFolder');

        const folderName = folderNameInput.value.trim();
        const selectedFolder = folderSelect.value;

        if (!folderName) {
            alert('Por favor ingresa un nombre para la carpeta');
            return;
        }

        // Validate folder name
        if (!/^[a-zA-Z0-9-_\s]+$/.test(folderName)) {
            alert('El nombre solo puede contener letras, números, guiones y espacios');
            return;
        }

        try {
            let targetDirHandle = fileManager.rootDirHandle;

            // If creating in an existing folder
            if (selectedFolder) {
                const selectedPath = selectedFolder.split('/');
                targetDirHandle = await fileManager.getDirectoryHandle(selectedPath);
            }

            // Create folder in target directory
            await fileManager.createDirectory(folderName, targetDirHandle);

            // Refresh sidebar
            sidebarManager.render(fileManager.files);

            // Close modal
            this.hideNewFolderModal();

            console.log('Carpeta creada:', folderName);
        } catch (err) {
            console.error('Error creating folder:', err);
            alert('Error al crear carpeta: ' + err.message);
        }
    }

    // Move file to a different folder
    async moveFile(sourceFile, targetFolder) {
        try {
            // Confirm the move
            const sourcePath = sourceFile.path.join(' / ');
            const targetPath = targetFolder.path.join(' / ');
            const confirmed = confirm(`¿Mover "${sourceFile.name}" de "${sourcePath}" a "${targetPath}"?`);

            if (!confirmed) return;

            // Get source parent path (remove filename from path)
            const sourceParentPath = sourceFile.path.slice(0, -1);

            // Get the file handle
            const fileEntry = fileManager.findFileByPath(sourceFile.path);
            if (!fileEntry) {
                throw new Error('No se pudo encontrar el archivo');
            }

            // Move the file
            await fileManager.moveFile(
                fileEntry.handle,
                sourceParentPath,
                targetFolder.handle,
                sourceFile.name
            );

            // Refresh sidebar
            sidebarManager.render(fileManager.files);

            // If the moved file was the current file, clear it
            if (this.currentFile && this.currentFile.path.join('/') === sourceFile.path.join('/')) {
                this.currentFile = null;
                editorManager.clear();
                viewerManager.clear();
                this.hideContent();
                document.getElementById('contentTitle').textContent = 'Sin archivo seleccionado';
            }

            console.log('Archivo movido:', sourceFile.name, 'a', targetPath);
        } catch (err) {
            console.error('Error moving file:', err);
            alert('Error al mover archivo: ' + err.message);
        }
    }

    // === TABS METHODS ===

    // Render tabs in the UI
    renderTabs() {
        const tabsBar = document.getElementById('tabsBar');
        const tabsContainer = document.getElementById('tabsContainer');
        const tabs = window.tabsManager.getAllTabs();

        if (tabs.length === 0) {
            tabsBar.style.display = 'none';
            // Adjust container height
            document.querySelector('.container').style.height = 'calc(100vh - 50px)';
            return;
        }

        tabsBar.style.display = 'block';
        // Adjust container height to account for tabs bar
        document.querySelector('.container').style.height = 'calc(100vh - 91px)';

        // Clear existing tabs
        tabsContainer.innerHTML = '';

        // Render each tab
        tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'tab';
            tabEl.dataset.tabId = tab.id;

            if (tab.id === window.tabsManager.activeTabId) {
                tabEl.classList.add('active');
            }

            tabEl.innerHTML = `
                <div class="tab-icon">
                    <i class="fa-solid fa-folder"></i>
                </div>
                <div class="tab-name">${tab.name}</div>
                <div class="tab-close" data-tab-id="${tab.id}">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            `;

            // Click tab to switch
            tabEl.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close')) {
                    this.switchToTab(tab.id);
                }
            });

            // Click close button
            const closeBtn = tabEl.querySelector('.tab-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(tab.id);
            });

            tabsContainer.appendChild(tabEl);
        });
    }

    // Load a tab (set file manager to use this tab's directory)
    async loadTab(tab) {
        try {
            // Set the root directory handle in file manager
            window.fileManager.rootDirHandle = tab.dirHandle;

            // Read directory structure
            await window.fileManager.readDirectory();

            // Render sidebar
            window.sidebarManager.render(window.fileManager.files);

            // Enable buttons
            document.getElementById('newPageBtn').disabled = false;
            document.getElementById('newFolderBtn').disabled = false;

            // Clear current file since we switched projects
            this.currentFile = null;
            window.editorManager.clear();
            window.viewerManager.clear();
            this.hideContent();
            document.getElementById('contentTitle').textContent = 'Sin archivo seleccionado';

            console.log('Tab loaded:', tab.name);
        } catch (err) {
            console.error('Error loading tab:', err);
            throw err;
        }
    }

    // Switch to a different tab
    async switchToTab(tabId) {
        const tab = window.tabsManager.switchTab(tabId);
        if (!tab) return;

        // Save active tab ID
        if (window.storageManager) {
            window.storageManager.saveActiveTabId(tabId);
        }

        // Load tab content
        await this.loadTab(tab);

        // Re-render tabs to update active state
        this.renderTabs();
    }

    // Close a tab
    async closeTab(tabId) {
        const tab = window.tabsManager.getTabById(tabId);
        if (!tab) return;

        // Confirm if there are unsaved changes
        if (window.editorManager.hasChanges() && window.tabsManager.activeTabId === tabId) {
            const confirmed = confirm(`¿Cerrar la pestaña "${tab.name}"? Los cambios no guardados se perderán.`);
            if (!confirmed) return;
        }

        // Remove tab
        window.tabsManager.removeTab(tabId);

        // Delete from storage
        if (window.storageManager) {
            await window.storageManager.deleteTabHandle(tabId);
            window.storageManager.saveTabsMetadata(window.tabsManager.serializeForStorage());

            // Update active tab in storage
            const activeTab = window.tabsManager.getActiveTab();
            if (activeTab) {
                window.storageManager.saveActiveTabId(activeTab.id);
            }
        }

        // If there are remaining tabs, load the new active one
        const activeTab = window.tabsManager.getActiveTab();
        if (activeTab) {
            await this.loadTab(activeTab);
        } else {
            // No tabs left, clear everything
            window.sidebarManager.render([]);
            document.getElementById('newPageBtn').disabled = true;
            document.getElementById('newFolderBtn').disabled = true;
            this.hideContent();
        }

        // Re-render tabs
        this.renderTabs();

        console.log('Tab closed:', tab.name);
    }

    // Hide empty state
    hideEmptyState() {
        const emptyState = document.querySelector('.editor-container .empty-state');
        if (emptyState && this.currentFile) {
            emptyState.style.display = 'none';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
