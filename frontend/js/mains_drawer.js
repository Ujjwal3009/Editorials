// Mains Enrichment Drawer Controller
const MainsDrawer = {
    init() {
        const dock = document.getElementById('mains-dock');
        const toggleBtn = document.getElementById('toggle-drawer-btn');
        const closeBtn = document.getElementById('close-dock-btn');
        const saveNoteBtn = document.getElementById('save-note-btn');

        toggleBtn?.addEventListener('click', () => dock.classList.toggle('open'));
        closeBtn?.addEventListener('click', () => dock.classList.remove('open'));

        saveNoteBtn?.addEventListener('click', async () => {
            const input = document.getElementById('note-input');
            const content = input.value.trim();
            if (!content) return;

            const article = AppState.activeArticle;
            await Api.saveNote(article.id, "", content, article.gsPaper);
            input.value = "";
            await this.refreshNotes();
        });
    },

    updateDock(article) {
        document.getElementById('dock-gs-paper').textContent = `${article.gsPaper}: ${article.syllabusTopicTitle || 'General Studies'}`;
        document.getElementById('dock-topic-title').textContent = article.title;

        // Render PYQs
        const pyqList = document.getElementById('dock-pyq-list');
        if (article.relatedPyqs && article.relatedPyqs.length > 0) {
            pyqList.innerHTML = article.relatedPyqs.map(p => `
                <div class="pyq-item">
                    <div class="pyq-tag">${p.gsPaper} (${p.year}) - Q${p.questionNumber} [${p.marks || 15} Marks]</div>
                    <div class="pyq-text">${p.questionText}</div>
                </div>
            `).join('');
            document.getElementById('pyq-count-badge').textContent = article.relatedPyqs.length;
        } else {
            pyqList.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">No direct PYQs mapped.</p>`;
            document.getElementById('pyq-count-badge').textContent = '0';
        }

        // Render Stats
        const statsList = document.getElementById('dock-stats-list');
        if (article.statistics && article.statistics.length > 0) {
            statsList.innerHTML = article.statistics.map(s => `<li>${s}</li>`).join('');
        }

        this.refreshNotes();
    },

    async refreshNotes() {
        const article = AppState.activeArticle;
        const notes = await Api.getNotes(article ? article.id : null);
        const container = document.getElementById('saved-notes-list');
        if (!container) return;

        if (notes.length === 0) {
            container.innerHTML = `<p style="font-size:11px; color:var(--text-muted); margin-top:8px;">No notes saved yet.</p>`;
            return;
        }

        container.innerHTML = notes.map(n => `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:4px; padding:8px; margin-top:8px; font-size:11px;">
                <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--accent-red);">
                    <span>${n.gsTag || 'GS Note'}</span>
                    <span style="font-weight:400; color:var(--text-muted);">${new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                ${n.selectedText ? `<div style="font-style:italic; margin:4px 0; color:var(--text-secondary);">"${n.selectedText.substring(0, 60)}..."</div>` : ''}
                <div style="margin-top:4px;">${n.noteContent}</div>
            </div>
        `).join('');
    }
};
