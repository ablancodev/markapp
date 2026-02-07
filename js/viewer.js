// Viewer Manager - Handles markdown to HTML rendering
class ViewerManager {
    constructor() {
        this.container = document.getElementById('markdownViewer');
        this.content = '';
        this.currentFileType = 'md'; // Track current file type
    }

    // Render content based on file type
    render(content, fileExtension = 'md') {
        if (!content || content.trim() === '') {
            this.renderEmpty();
            return;
        }

        this.currentFileType = fileExtension;

        try {
            this.content = content;

            // Render based on file type
            if (fileExtension === 'md' || fileExtension === 'markdown') {
                this.renderMarkdown(content);
            } else if (fileExtension === 'txt') {
                this.renderPlainText(content);
            } else {
                // Default to plain text for unknown types
                this.renderPlainText(content);
            }
        } catch (err) {
            console.error('Error rendering content:', err);
            this.container.innerHTML = `
                <div style="color: #dc2626; padding: 20px;">
                    <h3>Error al renderizar contenido</h3>
                    <p>${err.message}</p>
                </div>
            `;
        }
    }

    // Render markdown to HTML
    renderMarkdown(markdown) {
        this.container.innerHTML = marked.parse(markdown);
        this.processLinks();
    }

    // Render plain text with preserved formatting
    renderPlainText(text) {
        const escapedText = this.escapeHtml(text);
        this.container.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0; padding: 20px;">${escapedText}</pre>`;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render empty state
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-file-lines" style="font-size: 64px; opacity: 0.2;"></i>
                <h2>Sin contenido</h2>
                <p>El archivo está vacío</p>
            </div>
        `;
    }

    // Process links to open in new tab
    processLinks() {
        const links = this.container.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            // External links open in new tab
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // Clear viewer
    clear() {
        this.container.innerHTML = '';
        this.content = '';
    }

    // Show viewer
    show() {
        this.container.style.display = 'block';
    }

    // Hide viewer
    hide() {
        this.container.style.display = 'none';
    }

    // Get current content
    getContent() {
        return this.content;
    }

    // Scroll to top
    scrollToTop() {
        this.container.scrollTop = 0;
    }
}

// Export singleton instance (as global variable)
window.viewerManager = new ViewerManager();
