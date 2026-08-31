// Reader Engine for text selection, highlights, and annotations
const ReaderEngine = {
    init() {
        const toolbar = document.getElementById('selection-toolbar');
        if (!toolbar) return;

        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 5 && AppState.currentView === 'reader') {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                toolbar.style.left = `${window.scrollX + rect.left + rect.width / 2 - 100}px`;
                toolbar.style.top = `${window.scrollY + rect.top - 42}px`;
                toolbar.style.display = 'flex';
                this.selectedText = text;
            } else {
                toolbar.style.display = 'none';
            }
        });

        // Toolbar actions
        document.getElementById('tool-highlight')?.addEventListener('click', () => {
            document.execCommand('hiliteColor', false, '#ffeaa7');
            toolbar.style.display = 'none';
        });

        document.getElementById('tool-note')?.addEventListener('click', () => {
            if (this.selectedText) {
                MainsDrawer.addNote(`"${this.selectedText.substring(0, 80)}..."`);
                toolbar.style.display = 'none';
            }
        });
    }
};
