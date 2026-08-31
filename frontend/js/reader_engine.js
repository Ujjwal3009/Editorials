// Reader Engine: Text Selection & Floating Action Bar
const ReaderEngine = {
    selectedText: '',

    init() {
        const toolbar = document.getElementById('selection-toolbar');
        const modal = document.getElementById('ai-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const backdrop = document.querySelector('.ai-modal-backdrop');

        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 3) {
                this.selectedText = text;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                toolbar.style.top = `${rect.top + window.scrollY - 42}px`;
                toolbar.style.left = `${Math.max(10, rect.left + window.scrollX + (rect.width / 2) - 140)}px`;
                toolbar.classList.remove('hidden');
            } else {
                if (!toolbar.matches(':hover')) {
                    toolbar.classList.add('hidden');
                }
            }
        });

        // Toolbar Buttons
        toolbar.querySelectorAll('.sel-tool-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                toolbar.classList.add('hidden');
                await this.handleAction(action);
            });
        });

        // Modal close
        closeModalBtn?.addEventListener('click', () => modal.classList.add('hidden'));
        backdrop?.addEventListener('click', () => modal.classList.add('hidden'));
    },

    async handleAction(action) {
        const activeArticle = AppState.activeArticle;
        const modal = document.getElementById('ai-modal');
        const modalBody = document.getElementById('modal-body-content');
        const modalHeading = document.getElementById('modal-heading');

        if (action === 'NOTE') {
            const noteContent = prompt('Add personal note for this selection:', this.selectedText);
            if (noteContent) {
                await Api.saveNote(activeArticle.id, this.selectedText, noteContent, activeArticle.gsPaper);
                MainsDrawer.refreshNotes();
                alert('✅ Saved to your Mains Notes!');
            }
            return;
        }

        modalHeading.textContent = `${action === 'EXPLAIN' ? 'Concept Explanation' : action === 'PROS_CONS' ? 'Pros vs Cons Analysis' : 'Syllabus & PYQ Linkage'}`;
        modalBody.innerHTML = `<div style="text-align:center; padding: 20px; font-weight:600;">⚡ Synthesizing Mains Value Addition...</div>`;
        modal.classList.remove('hidden');

        const result = await Api.explainSnippet(this.selectedText, activeArticle.title, activeArticle.gsPaper, action);

        modalBody.innerHTML = `
            <div style="margin-bottom: 14px; padding: 10px; background: rgba(0,0,0,0.04); border-left: 3px solid var(--accent-red); font-style: italic;">
                "${this.selectedText}"
            </div>
            <p style="margin-bottom: 12px; font-size: 14px;"><strong>Summary:</strong> ${result.explanation}</p>
            <p style="margin-bottom: 12px; color: var(--accent-blue); font-weight: 600;">🎯 ${result.upscSignificance}</p>
            <div style="margin-bottom: 12px;">
                <strong>Key Mains Arguments:</strong>
                <ul style="padding-left: 20px; margin-top: 6px;">
                    ${result.keyArguments ? result.keyArguments.map(a => `<li style="margin-bottom: 4px;">${a}</li>`).join('') : ''}
                </ul>
            </div>
            ${result.wayForward ? `<p style="margin-top: 10px; background: #e8f5e9; padding: 8px; border-radius: 4px; color: #1b5e20;"><strong>💡 Way Forward:</strong> ${result.wayForward}</p>` : ''}
            <div style="margin-top: 16px; font-size: 11px; color: var(--text-muted); border-top: 1px dotted var(--border-color); padding-top: 8px;">
                ${result.notice || ''}
            </div>
        `;
    }
};
