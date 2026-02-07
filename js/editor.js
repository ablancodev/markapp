// Editor Manager - Handles markdown editing
class EditorManager {
    constructor() {
        this.textarea = document.getElementById('markdownEditor');
        this.content = '';
        this.isDirty = false;
        this.onChange = null;
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        this.textarea.addEventListener('input', () => {
            this.content = this.textarea.value;
            this.isDirty = true;

            if (this.onChange) {
                this.onChange(this.content);
            }
        });

        // Handle tab key for indentation
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTab();
            }
        });

        // Auto-save on Ctrl+S / Cmd+S
        this.textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.onSave) {
                    this.onSave();
                }
            }
        });
    }

    // Insert tab at cursor position
    insertTab() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        this.textarea.value = value.substring(0, start) + '  ' + value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;

        // Trigger input event
        this.textarea.dispatchEvent(new Event('input'));
    }

    // Load content into editor
    loadContent(content) {
        this.content = content;
        this.textarea.value = content;
        this.isDirty = false;
    }

    // Get current content
    getContent() {
        return this.textarea.value;
    }

    // Check if content has changed
    hasChanges() {
        return this.isDirty;
    }

    // Mark as saved
    markAsSaved() {
        this.isDirty = false;
    }

    // Clear editor
    clear() {
        this.textarea.value = '';
        this.content = '';
        this.isDirty = false;
    }

    // Show editor
    show() {
        this.textarea.style.display = 'block';
    }

    // Hide editor
    hide() {
        this.textarea.style.display = 'none';
    }

    // Focus editor
    focus() {
        this.textarea.focus();
    }

    // Insert text at cursor
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        this.textarea.value = value.substring(0, start) + text + value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;

        // Trigger input event
        this.textarea.dispatchEvent(new Event('input'));
    }

    // Get selected text
    getSelectedText() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        return this.textarea.value.substring(start, end);
    }

    // Wrap selected text
    wrapSelection(before, after = before) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;
        const selection = value.substring(start, end);

        const newText = before + selection + after;
        this.textarea.value = value.substring(0, start) + newText + value.substring(end);

        this.textarea.selectionStart = start + before.length;
        this.textarea.selectionEnd = end + before.length;

        // Trigger input event
        this.textarea.dispatchEvent(new Event('input'));
        this.focus();
    }
}

// Export singleton instance (as global variable)
window.editorManager = new EditorManager();
