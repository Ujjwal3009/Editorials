// Mains Enrichment Drawer Coordinator
const MainsDrawer = {
    notes: [],

    init() {
        // Tab switching
        document.querySelectorAll('.dock-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.dock-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.dock-pane').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
                if (targetPane) targetPane.classList.add('active');
            });
        });

        // Toggle Drawer on Mobile
        document.getElementById('toggle-reader-dock-btn')?.addEventListener('click', () => {
            const dock = document.getElementById('mains-dock');
            dock?.classList.toggle('mobile-open');
        });

        // Note saving
        document.getElementById('save-note-btn')?.addEventListener('click', () => {
            const input = document.getElementById('note-input');
            const text = input?.value.trim();
            if (text) {
                this.addNote(text);
                input.value = '';
            }
        });
    },

    async updateDock(article) {
        // Fetch & Render matching Prelims PYQs
        const prelimsContainer = document.getElementById('dock-prelims-list');
        if (prelimsContainer && article) {
            prelimsContainer.innerHTML = '<p style="font-size:11px;color:var(--text-muted);">Searching 3,897 Prelims PYQs...</p>';
            try {
                const prelimsList = await Api.searchPrelimsHybrid(article.title + ' ' + (article.subtitle || ''), 3);
                prelimsContainer.innerHTML = '';
                if (prelimsList && prelimsList.length > 0) {
                    prelimsList.forEach(mcq => {
                        const card = document.createElement('div');
                        card.className = 'pyq-item-card';
                        card.style.borderLeftColor = '#059669';
                        card.innerHTML = `
                            <div class="pyq-meta-tag" style="color:#059669;">PRELIMS ${mcq.year} • ${mcq.subject} ${mcq.subtopic ? '› ' + mcq.subtopic : ''}</div>
                            <p class="pyq-question-text" style="white-space: pre-line;">${mcq.questionText}</p>
                            <details style="margin-top:6px;font-size:11px;background:rgba(5,150,105,0.08);padding:6px;border-radius:4px;">
                                <summary style="cursor:pointer;font-weight:700;color:#059669;">👁️ View Correct Answer</summary>
                                <div style="margin-top:4px;font-weight:800;font-size:12px;">Correct Answer: (${mcq.correctAnswer ? mcq.correctAnswer.toUpperCase() : 'N/A'})</div>
                            </details>
                        `;
                        prelimsContainer.appendChild(card);
                    });
                } else {
                    prelimsContainer.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">No direct Prelims MCQ overlap found for this topic.</p>';
                }
            } catch (e) {
                prelimsContainer.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Prelims questions available.</p>';
            }
        }
        if (!article) return;

        // 1. Render PYQs
        const pyqContainer = document.getElementById('dock-pyq-list');
        if (pyqContainer) {
            pyqContainer.innerHTML = '';
            const pyqs = article.relatedPyqs || [];
            
            const badge = document.getElementById('pyq-count-badge');
            if (badge) badge.textContent = pyqs.length;

            if (pyqs.length > 0) {
                pyqs.forEach(q => {
                    const card = document.createElement('div');
                    card.className = 'pyq-item-card';
                    card.innerHTML = `
                        <div class="pyq-meta-tag">${q.gsPaper || article.gsPaper} • ${q.year || '2023'} (Q${q.questionNumber || '1'}, ${q.marks || 15} Marks)</div>
                        <p class="pyq-question-text">${q.questionText}</p>
                        ${q.modelApproachHints ? `<div class="pyq-hints">💡 <strong>Approach:</strong> ${q.modelApproachHints}</div>` : ''}
                    `;
                    pyqContainer.appendChild(card);
                });
            } else {
                pyqContainer.innerHTML = `<p style="font-size:12px;color:var(--text-muted);">No past questions directly tagged. Check broader ${article.gsPaper || 'GS'} syllabus.</p>`;
            }
        }

        // 2. Render Statistics
        const statsContainer = document.getElementById('dock-stats-list');
        if (statsContainer) {
            statsContainer.innerHTML = '';
            const stats = article.statistics || [];
            if (stats.length > 0) {
                stats.forEach(st => {
                    const item = document.createElement('div');
                    item.className = 'pyq-item-card';
                    item.innerHTML = `<p style="font-size:12px;font-weight:500;">📊 ${st}</p>`;
                    statsContainer.appendChild(item);
                });
            } else {
                statsContainer.innerHTML = `<p style="font-size:12px;color:var(--text-muted);">High-yield analytical arguments present in article text.</p>`;
            }
        }

        // 3. Update Answer Framework Titles
        document.getElementById('fw-intro').textContent = `Define ${article.title.substring(0, 45)}... and establish its contemporary significance in ${article.gsPaper || 'GS'}.`;
    },

    addNote(content) {
        this.notes.unshift({
            content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.renderNotes();
    },

    renderNotes() {
        const container = document.getElementById('saved-notes-list');
        if (!container) return;
        container.innerHTML = '';
        this.notes.forEach(n => {
            const div = document.createElement('div');
            div.className = 'pyq-item-card';
            div.style.borderLeftColor = 'var(--accent-gold)';
            div.innerHTML = `<p style="font-size:12px;">${n.content}</p><span style="font-size:10px;color:var(--text-muted);">${n.time}</span>`;
            container.appendChild(div);
        });
    }
};
