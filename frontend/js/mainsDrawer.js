// Mains Enrichment Drawer Coordinator with Feature Flags
const FEATURE_FLAGS = {
    SHOW_PYQS: false // Set to true to re-enable Mains 939 PYQs and Prelims 3,897 MCQs
};

const MainsDrawer = {
    notes: [],

    init() {
        // Apply feature flag visibility to PYQ tabs
        if (!FEATURE_FLAGS.SHOW_PYQS) {
            document.querySelectorAll('.dock-tab[data-tab="pyqs"], .dock-tab[data-tab="prelims"]').forEach(t => {
                t.style.display = 'none';
            });
            const pyqBadge = document.getElementById('pyq-count-badge');
            if (pyqBadge) pyqBadge.parentElement.style.display = 'none';

            // Activate Model Answers tab as default
            document.querySelectorAll('.dock-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.dock-pane').forEach(p => p.classList.remove('active'));
            
            const defaultTab = document.querySelector('.dock-tab[data-tab="answers"]') || document.querySelector('.dock-tab[data-tab="stats"]');
            if (defaultTab) {
                defaultTab.classList.add('active');
                document.getElementById(`pane-${defaultTab.dataset.tab}`)?.classList.add('active');
            }
        }

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
        if (!article) return;

        // If PYQ feature flag is enabled, fetch & render PYQs
        if (FEATURE_FLAGS.SHOW_PYQS) {
            const prelimsContainer = document.getElementById('dock-prelims-list');
            if (prelimsContainer) {
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

            // Update Mains PYQ List
            const pyqContainer = document.getElementById('dock-pyq-list');
            if (pyqContainer) {
                pyqContainer.innerHTML = '';
                if (article.relatedPyqs && article.relatedPyqs.length > 0) {
                    article.relatedPyqs.forEach(pyq => {
                        const card = document.createElement('div');
                        card.className = 'pyq-item-card';
                        card.innerHTML = `
                            <div class="pyq-meta-tag">${pyq.gsPaper} • YEAR ${pyq.year || 2024} (Q${pyq.questionNumber || 1}, ${pyq.marks || 15} Marks)</div>
                            <p class="pyq-question-text">"${pyq.questionText}"</p>
                            ${pyq.modelApproachHints ? `
                                <div class="pyq-hint-box">
                                    <strong>💡 Model Approach Hint:</strong> ${pyq.modelApproachHints}
                                </div>
                            ` : ''}
                        `;
                        pyqContainer.appendChild(card);
                    });
                } else {
                    pyqContainer.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">No directly linked Mains PYQ for this specific topic.</p>';
                }
            }
        }

        // Update Key Data / Statistics tab
        const statsContainer = document.getElementById('dock-stats-list');
        if (statsContainer) {
            statsContainer.innerHTML = '';
            if (article.statistics && article.statistics.length > 0) {
                article.statistics.forEach(stat => {
                    const box = document.createElement('div');
                    box.className = 'stat-fact-box';
                    box.innerHTML = `<span class="stat-bullet">📌</span><p class="stat-text">${stat}</p>`;
                    statsContainer.appendChild(box);
                });
            } else {
                statsContainer.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">High-yield analytical arguments highlighted inline.</p>';
            }
        }
    },

    addNote(text) {
        this.notes.push({ text, timestamp: new Date().toLocaleTimeString() });
        const list = document.getElementById('saved-notes-list');
        if (list) {
            const item = document.createElement('div');
            item.className = 'note-saved-item';
            item.innerHTML = `<p>${text}</p><small>${new Date().toLocaleTimeString()}</small>`;
            list.prepend(item);
        }
    }
};
