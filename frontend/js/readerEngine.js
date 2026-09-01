// Reader Engine for Article Body rendering, text selection, highlights, and annotations
const ReaderEngine = {
    init() {
        const toolbar = document.getElementById('selection-toolbar');
        if (!toolbar) return;

        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection ? selection.toString().trim() : '';

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
                if (typeof MainsDrawer !== 'undefined' && MainsDrawer.addNote) {
                    MainsDrawer.addNote(`"${this.selectedText.substring(0, 80)}..."`);
                }
                toolbar.style.display = 'none';
            }
        });
    },

    renderArticle(article) {
        if (!article) return;

        // 1. Breadcrumbs & Meta
        const bcSource = document.getElementById('reader-breadcrumb-source');
        if (bcSource) bcSource.textContent = article.source || 'Editorial Desk';

        const bcGs = document.getElementById('reader-breadcrumb-gs');
        if (bcGs) bcGs.textContent = article.gsPaper || 'GS-2';

        const sourceTag = document.getElementById('reader-source-tag');
        if (sourceTag) {
            sourceTag.textContent = article.source || 'The Hindu';
            sourceTag.className = `source-tag ${this.getSourceClass(article.source)}`;
        }

        const gsBadge = document.getElementById('lead-gs-badge');
        if (gsBadge) {
            const gsPaper = article.gsPaper || 'GS-2';
            gsBadge.textContent = `${gsPaper}: ${article.syllabusTopicTitle || 'National Affairs'}`;
            gsBadge.className = `gs-badge-pill ${gsPaper.toLowerCase().replace('-', '')}`;
        }

        // 2. Headlines & Byline
        const titleElem = document.getElementById('lead-title');
        if (titleElem) titleElem.textContent = article.title || '';

        const subtitleElem = document.getElementById('lead-subtitle');
        if (subtitleElem) {
            subtitleElem.textContent = article.subtitle || '';
            subtitleElem.style.display = article.subtitle ? 'block' : 'none';
        }

        const authorElem = document.getElementById('lead-author');
        if (authorElem) authorElem.textContent = `By ${article.author || 'Editorial Desk'}`;

        const sourceElem = document.getElementById('lead-source');
        if (sourceElem) sourceElem.textContent = ` • ${article.source}`;

        const dateElem = document.getElementById('lead-date');
        if (dateElem) dateElem.textContent = ` • 📅 ${article.publishedDate}`;

        // 3. Body Content Elements with Interactive Glossary Annotation
        const bodyContainer = document.getElementById('lead-content');
        if (bodyContainer) {
            bodyContainer.innerHTML = '';

            let elements = article.elements;
            if (!elements || elements.length === 0) {
                if (article.fullText) {
                    elements = article.fullText.split('\n\n').filter(p => p.trim().length > 0).map((text, i) => ({
                        sequenceOrder: i + 1,
                        elementType: 'paragraph',
                        content: text.trim()
                    }));
                } else {
                    elements = [{
                        sequenceOrder: 1,
                        elementType: 'paragraph',
                        content: article.subtitle || article.title
                    }];
                }
            }

            elements.forEach(elem => {
                const p = document.createElement('p');
                p.className = 'editorial-paragraph';
                p.dataset.order = elem.order || elem.sequenceOrder || 1;
                
                const content = elem.content || elem.text || '';
                
                // Annotate keywords via HoverEngine if available
                if (typeof HoverEngine !== 'undefined' && HoverEngine.annotateText) {
                    p.innerHTML = HoverEngine.annotateText(content);
                } else {
                    p.textContent = content;
                }
                bodyContainer.appendChild(p);
            });
        }
    },

    getSourceClass(source) {
        if (!source) return 'src-other';
        const s = source.toLowerCase();
        if (s.includes('hindu')) return 'src-hindu';
        if (s.includes('express')) return 'src-express';
        if (s.includes('orf') || s.includes('observer')) return 'src-orf';
        if (s.includes('idsa') || s.includes('defence')) return 'src-idsa';
        if (s.includes('earth') || s.includes('down')) return 'src-dte';
        if (s.includes('pib') || s.includes('insights')) return 'src-pib';
        return 'src-other';
    }
};
