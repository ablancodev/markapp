// Sidebar Manager - Handles tree view rendering and interactions
class SidebarManager {
    constructor() {
        this.container = document.getElementById('sidebarTree');
        this.activeItem = null;
        this.onFileSelect = null;
        this.onFileDrop = null;
        this.expandedPaths = new Set(); // Track expanded folder paths
    }

    // Save expanded state before re-rendering
    saveExpandedState() {
        this.expandedPaths.clear();

        const expandedToggles = this.container.querySelectorAll('.tree-item-toggle.expanded');
        expandedToggles.forEach(toggle => {
            const treeItem = toggle.closest('.tree-item');
            if (treeItem && treeItem.dataset.path) {
                this.expandedPaths.add(treeItem.dataset.path);
            }
        });

        // Also save active file path
        this.activeFilePath = null;
        if (this.activeItem && this.activeItem.dataset.path) {
            this.activeFilePath = this.activeItem.dataset.path;
        }
    }

    // Restore expanded state after re-rendering
    restoreExpandedState() {
        // Restore expanded folders
        if (this.expandedPaths.size > 0) {
            this.expandedPaths.forEach(path => {
                const treeItem = this.container.querySelector(`[data-path="${path}"][data-type="directory"]`);
                if (treeItem) {
                    const toggle = treeItem.querySelector('.tree-item-toggle');
                    const itemContainer = treeItem.parentElement;
                    const children = itemContainer.querySelector('.tree-children');

                    if (toggle && children) {
                        toggle.classList.add('expanded');
                        children.classList.remove('collapsed');
                    }
                }
            });
        }

        // Restore active file
        if (this.activeFilePath) {
            const treeItem = this.container.querySelector(`[data-path="${this.activeFilePath}"][data-type="file"]`);
            if (treeItem) {
                treeItem.classList.add('active');
                this.activeItem = treeItem;
            }
        }
    }

    // Render the file tree
    render(files, preserveState = true) {
        if (!files || files.length === 0) {
            this.renderEmpty();
            return;
        }

        // Save expanded state before clearing
        if (preserveState) {
            this.saveExpandedState();
        }

        this.container.innerHTML = '';
        const tree = this.createTreeElement(files);
        this.container.appendChild(tree);

        // Restore expanded state after rendering
        if (preserveState) {
            this.restoreExpandedState();
        }
    }

    // Render empty state
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-sidebar">
                <i class="fa-solid fa-folder-open" style="font-size: 48px; opacity: 0.3;"></i>
                <p>Abre una carpeta para comenzar</p>
            </div>
        `;
    }

    // Create tree element from entries
    createTreeElement(entries) {
        const container = document.createElement('div');

        entries.forEach(entry => {
            const item = this.createTreeItem(entry);
            container.appendChild(item);
        });

        return container;
    }

    // Create a single tree item
    createTreeItem(entry) {
        const itemContainer = document.createElement('div');

        const item = document.createElement('div');
        item.className = 'tree-item';
        item.dataset.path = entry.path.join('/');
        item.dataset.type = entry.type;

        // Add toggle for directories
        if (entry.type === 'directory') {
            const toggle = document.createElement('span');
            toggle.className = 'tree-item-toggle';
            toggle.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDirectory(itemContainer);
            });
            item.appendChild(toggle);
        }

        // Add icon only for directories
        if (entry.type === 'directory') {
            const icon = document.createElement('span');
            icon.className = 'tree-item-icon';
            icon.innerHTML = '<i class="fa-solid fa-folder"></i>';
            item.appendChild(icon);
        }

        // Add name
        const name = document.createElement('span');
        name.className = 'tree-item-name';
        name.textContent = entry.type === 'file' ?
            fileManager.getFileNameWithoutExtension(entry.name) :
            entry.name;
        item.appendChild(name);

        // Add file extension badge for non-markdown files
        if (entry.type === 'file' && entry.extension) {
            const badge = document.createElement('span');
            badge.className = 'tree-item-badge';
            badge.textContent = '.' + entry.extension;
            badge.title = 'Tipo de archivo: ' + entry.extension;
            item.appendChild(badge);
        }

        // Add click handler for files
        if (entry.type === 'file') {
            item.addEventListener('click', () => {
                this.selectFile(item, entry);
            });

            // Make files draggable
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', entry.path.join('/'));
                e.dataTransfer.setData('application/json', JSON.stringify({
                    path: entry.path,
                    name: entry.name,
                    type: entry.type
                }));
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        }

        // Allow dropping files into directories
        if (entry.type === 'directory') {
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', (e) => {
                e.stopPropagation();
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.classList.remove('drag-over');

                const data = e.dataTransfer.getData('application/json');
                if (data && this.onFileDrop) {
                    const sourceFile = JSON.parse(data);
                    const targetFolder = entry;
                    this.onFileDrop(sourceFile, targetFolder);
                }
            });
        }

        itemContainer.appendChild(item);

        // Add children for directories
        if (entry.type === 'directory' && entry.children && entry.children.length > 0) {
            const children = document.createElement('div');
            children.className = 'tree-children collapsed';

            entry.children.forEach(child => {
                const childItem = this.createTreeItem(child);
                children.appendChild(childItem);
            });

            itemContainer.appendChild(children);
        }

        return itemContainer;
    }

    // Toggle directory expanded/collapsed
    toggleDirectory(itemContainer) {
        const item = itemContainer.querySelector('.tree-item');
        const toggle = item.querySelector('.tree-item-toggle');
        const children = itemContainer.querySelector('.tree-children');

        if (children) {
            children.classList.toggle('collapsed');
            toggle.classList.toggle('expanded');
        }
    }

    // Select a file
    selectFile(item, entry) {
        // Remove active class from previous item
        if (this.activeItem) {
            this.activeItem.classList.remove('active');
        }

        // Add active class to new item
        item.classList.add('active');
        this.activeItem = item;

        // Trigger callback
        if (this.onFileSelect) {
            this.onFileSelect(entry);
        }
    }

    // Find and select a file by path
    selectFileByPath(path) {
        const pathStr = path.join('/');
        const item = this.container.querySelector(`[data-path="${pathStr}"][data-type="file"]`);

        if (item) {
            // Expand parent directories if needed
            let parent = item.parentElement;
            while (parent && parent !== this.container) {
                if (parent.classList.contains('tree-children') && parent.classList.contains('collapsed')) {
                    const parentItem = parent.previousElementSibling;
                    if (parentItem) {
                        const toggle = parentItem.querySelector('.tree-item-toggle');
                        if (toggle) {
                            toggle.classList.add('expanded');
                        }
                    }
                    parent.classList.remove('collapsed');
                }
                parent = parent.parentElement;
            }

            // Select the item
            const entry = fileManager.findFileByPath(path);
            if (entry) {
                this.selectFile(item, entry);
            }
        }
    }

    // Clear selection
    clearSelection() {
        if (this.activeItem) {
            this.activeItem.classList.remove('active');
            this.activeItem = null;
        }
    }
}

// Export singleton instance (as global variable)
window.sidebarManager = new SidebarManager();
