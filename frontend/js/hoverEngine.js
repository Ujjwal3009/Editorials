// Hover Engine for in-line concept popovers
const HoverEngine = {
    termsMap: new Map(),

    async init() {
        try {
            const glossaryList = await Api.getGlossary();
            glossaryList.forEach(item => {
                const termLower = item.term.toLowerCase();
                this.termsMap.set(termLower, item);
                if (item.synonyms) {
                    item.synonyms.forEach(syn => this.termsMap.set(syn.toLowerCase(), item));
                }
            });
        } catch (e) {
            console.warn('Glossary loading error:', e);
        }
    },

    annotateParagraphHtml(text) {
        if (!text) return '';
        let html = text;

        this.termsMap.forEach((glossaryItem, termKey) => {
            const regex = new RegExp(`\\b(${escapeRegExp(termKey)})\\b`, 'gi');
            html = html.replace(regex, (match) => {
                return `<span class="annotated-token" data-term="${encodeURIComponent(termKey)}">${match}</span>`;
            });
        });

        return html;
    },

    bindHoverEvents(container) {
        if (!container) return;
        const popover = document.getElementById('concept-popover');
        if (!popover) return;

        container.querySelectorAll('.annotated-token').forEach(token => {
            token.addEventListener('mouseenter', (e) => {
                const termKey = decodeURIComponent(token.dataset.term).toLowerCase();
                const data = this.termsMap.get(termKey);
                if (data) {
                    document.getElementById('popover-category').textContent = (data.relatedGsPaper || 'GS') + ' • ' + (data.category || 'CONCEPT');
                    document.getElementById('popover-term').textContent = data.term;
                    document.getElementById('popover-def').textContent = data.definition;
                    document.getElementById('popover-context').textContent = data.upscContext || 'Directly relevant for UPSC Mains analytical questions.';
                    
                    const rect = token.getBoundingClientRect();
                    popover.style.left = `${window.scrollX + rect.left}px`;
                    popover.style.top = `${window.scrollY + rect.bottom + 8}px`;
                    popover.style.display = 'block';
                }
            });

            token.addEventListener('mouseleave', () => {
                popover.style.display = 'none';
            });
        });
    }
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
