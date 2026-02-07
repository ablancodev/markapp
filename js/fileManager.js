// File System Manager - Handles File System Access API operations
class FileManager {
    constructor() {
        this.rootDirHandle = null;
        this.currentFileHandle = null;
        this.currentFilePath = [];
        this.files = [];
        this.supportedExtensions = ['.md', '.txt', '.markdown']; // Formatos soportados
    }

    // Check if File System Access API is supported
    isSupported() {
        return 'showDirectoryPicker' in window;
    }

    // Check if file has supported extension
    isSupportedFile(fileName) {
        return this.supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }

    // Get file extension
    getFileExtension(fileName) {
        const match = fileName.match(/\.([^.]+)$/);
        return match ? match[1].toLowerCase() : null;
    }

    // Open a directory picker and get root directory handle
    async openDirectory() {
        if (!this.isSupported()) {
            throw new Error('File System Access API no soportada en este navegador. Usa Chrome, Edge o Opera.');
        }

        try {
            this.rootDirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            // Save to IndexedDB for persistence
            if (window.storageManager) {
                try {
                    await window.storageManager.saveDirectoryHandle(this.rootDirHandle);
                } catch (storageErr) {
                    console.warn('No se pudo guardar en storage:', storageErr);
                }
            } else {
                console.warn('StorageManager no disponible');
            }

            // Read the directory structure
            await this.readDirectory();

            // Check if we got any files
            if (this.files.length === 0) {
                console.warn('No se encontraron archivos compatibles en la carpeta');
            }

            return this.files;
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('Operación cancelada por el usuario');
            }
            if (err.name === 'NotAllowedError') {
                throw new Error('Permiso denegado para acceder a esta carpeta. Puede contener archivos del sistema protegidos.');
            }
            if (err.name === 'SecurityError') {
                throw new Error('No se puede acceder a esta carpeta por razones de seguridad. Intenta con otra carpeta.');
            }
            throw err;
        }
    }

    // Restore directory from storage
    async restoreDirectory() {
        try {
            if (!window.storageManager) {
                console.warn('StorageManager no disponible para restaurar');
                return null;
            }

            const handle = await window.storageManager.loadDirectoryHandle();

            if (handle) {
                // Verify we still have permission to access this directory
                try {
                    const permission = await handle.queryPermission({ mode: 'readwrite' });
                    if (permission !== 'granted') {
                        const newPermission = await handle.requestPermission({ mode: 'readwrite' });
                        if (newPermission !== 'granted') {
                            console.warn('Permiso denegado para acceder a la carpeta guardada');
                            return null;
                        }
                    }
                } catch (permErr) {
                    console.warn('No se pudo verificar permisos:', permErr);
                    return null;
                }

                this.rootDirHandle = handle;
                await this.readDirectory();
                return this.files;
            }

            return null;
        } catch (err) {
            console.error('Error restoring directory:', err);
            return null;
        }
    }

    // Get folder name
    getFolderName() {
        return this.rootDirHandle ? this.rootDirHandle.name : null;
    }

    // Recursively read directory structure
    async readDirectory(dirHandle = this.rootDirHandle, path = []) {
        if (!dirHandle) return [];

        const entries = [];

        try {
            // Try to iterate through directory entries
            let hasAnyEntries = false;

            for await (const entry of dirHandle.values()) {
                hasAnyEntries = true;

                // Skip system and hidden files/folders
                if (entry.name.startsWith('.') || entry.name.startsWith('$')) {
                    console.log('Skipping system file/folder:', entry.name);
                    continue;
                }

                const currentPath = [...path, entry.name];

                try {
                    if (entry.kind === 'directory') {
                        // Try to access the directory
                        const children = await this.readDirectory(entry, currentPath);
                        entries.push({
                            name: entry.name,
                            type: 'directory',
                            path: currentPath,
                            handle: entry,
                            children: children
                        });
                    } else if (entry.kind === 'file' && this.isSupportedFile(entry.name)) {
                        // Try to get file info to verify it's accessible
                        try {
                            await entry.getFile();
                            entries.push({
                                name: entry.name,
                                type: 'file',
                                path: currentPath,
                                handle: entry,
                                extension: this.getFileExtension(entry.name)
                            });
                        } catch (fileErr) {
                            // Skip files that can't be accessed
                            console.warn('Cannot access file:', entry.name, fileErr.name, fileErr.message);
                        }
                    }
                } catch (entryErr) {
                    // Skip entries that cause errors (system files, permission issues, etc.)
                    console.warn('Cannot access entry:', entry.name, entryErr.name, entryErr.message);
                }
            }

            if (!hasAnyEntries && path.length === 0) {
                console.warn('La carpeta parece estar vacía o inaccesible');
            }
        } catch (err) {
            // Log detailed error information
            console.error('Error iterating directory:', {
                path: path.join('/'),
                errorName: err.name,
                errorMessage: err.message,
                error: err
            });

            // Throw the error to be handled by the caller
            throw err;
        }

        // Sort: directories first, then files, alphabetically
        entries.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        if (path.length === 0) {
            this.files = entries;
        }

        return entries;
    }

    // Read file content
    async readFile(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            this.currentFileHandle = fileHandle;
            return content;
        } catch (err) {
            console.error('Error reading file:', err);
            throw new Error('No se pudo leer el archivo');
        }
    }

    // Write content to file
    async writeFile(fileHandle, content) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (err) {
            console.error('Error writing file:', err);
            throw new Error('No se pudo guardar el archivo');
        }
    }

    // Save current file
    async saveCurrentFile(content) {
        if (!this.currentFileHandle) {
            throw new Error('No hay archivo abierto');
        }
        return await this.writeFile(this.currentFileHandle, content);
    }

    // Create a new file (supports multiple extensions)
    async createFile(fileName, parentDirHandle = this.rootDirHandle, fileExtension = 'md') {
        if (!parentDirHandle) {
            throw new Error('No hay carpeta abierta');
        }

        try {
            // Ensure proper extension
            const ext = `.${fileExtension}`;
            if (!fileName.endsWith(ext)) {
                fileName = fileName + ext;
            }

            // Create the file
            const fileHandle = await parentDirHandle.getFileHandle(fileName, { create: true });

            // Write initial content based on file type
            let initialContent = '';
            if (fileExtension === 'md' || fileExtension === 'markdown') {
                const baseName = fileName.replace(new RegExp(`\\${ext}$`), '');
                initialContent = '# ' + baseName + '\n\n';
            } else {
                // For other file types, start empty or with a simple comment
                initialContent = '';
            }

            await this.writeFile(fileHandle, initialContent);

            // Refresh directory structure
            await this.readDirectory();

            return fileHandle;
        } catch (err) {
            if (err.name === 'InvalidModificationError') {
                throw new Error('Ya existe un archivo con ese nombre');
            }
            console.error('Error creating file:', err);
            throw new Error('No se pudo crear el archivo');
        }
    }

    // Create a new directory
    async createDirectory(folderName, parentDirHandle = this.rootDirHandle) {
        if (!parentDirHandle) {
            throw new Error('No hay carpeta abierta');
        }

        try {
            // Validate folder name
            if (!folderName || folderName.trim() === '') {
                throw new Error('El nombre de la carpeta no puede estar vacío');
            }

            // Create the directory
            const dirHandle = await parentDirHandle.getDirectoryHandle(folderName, { create: true });

            // Refresh directory structure
            await this.readDirectory();

            return dirHandle;
        } catch (err) {
            if (err.name === 'InvalidModificationError') {
                throw new Error('Ya existe una carpeta con ese nombre');
            }
            console.error('Error creating directory:', err);
            throw new Error('No se pudo crear la carpeta');
        }
    }

    // Get all folders in the tree (for populating folder selector)
    getAllFolders(entries = this.files, path = []) {
        const folders = [];

        entries.forEach(entry => {
            if (entry.type === 'directory') {
                const currentPath = [...path, entry.name];
                folders.push({
                    name: entry.name,
                    path: currentPath,
                    displayPath: currentPath.join(' / '),
                    handle: entry.handle
                });

                // Recursively get subfolders
                if (entry.children && entry.children.length > 0) {
                    const subfolders = this.getAllFolders(entry.children, currentPath);
                    folders.push(...subfolders);
                }
            }
        });

        return folders;
    }

    // Move a file to a different directory
    async moveFile(sourceFileHandle, sourceParentPath, targetDirHandle, fileName) {
        try {
            // Read the content of the source file
            const file = await sourceFileHandle.getFile();
            const content = await file.text();

            // Create the file in the target directory
            const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
            await this.writeFile(newFileHandle, content);

            // Delete the source file
            const sourceParentHandle = await this.getDirectoryHandle(sourceParentPath);
            if (sourceParentHandle) {
                await sourceParentHandle.removeEntry(fileName);
            }

            // Refresh directory structure
            await this.readDirectory();

            return newFileHandle;
        } catch (err) {
            console.error('Error moving file:', err);
            throw new Error('No se pudo mover el archivo');
        }
    }

    // Find file entry by path
    findFileByPath(path, entries = this.files) {
        for (const entry of entries) {
            if (entry.path.join('/') === path.join('/')) {
                return entry;
            }
            if (entry.type === 'directory' && entry.children) {
                const found = this.findFileByPath(path, entry.children);
                if (found) return found;
            }
        }
        return null;
    }

    // Get directory handle by path
    async getDirectoryHandle(path) {
        let dirHandle = this.rootDirHandle;

        for (const segment of path) {
            try {
                dirHandle = await dirHandle.getDirectoryHandle(segment);
            } catch (err) {
                console.error('Error getting directory handle:', err);
                return null;
            }
        }

        return dirHandle;
    }

    // Get file name without extension
    getFileNameWithoutExtension(fileName) {
        // Remove any supported extension
        for (const ext of this.supportedExtensions) {
            if (fileName.toLowerCase().endsWith(ext)) {
                return fileName.substring(0, fileName.length - ext.length);
            }
        }
        // If no supported extension found, return as is
        return fileName;
    }

    // Get current file path as string
    getCurrentFilePath() {
        return this.currentFilePath.join(' / ');
    }

    // Check if file is currently open
    isFileOpen(fileHandle) {
        return this.currentFileHandle === fileHandle;
    }
}

// Export singleton instance (as global variable)
window.fileManager = new FileManager();
