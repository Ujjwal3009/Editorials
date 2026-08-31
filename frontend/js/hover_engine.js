// Hover Engine: Instant <10ms Tooltip Popovers for UPSC Concepts
const HoverEngine = {
    glossaryMap: new Map(),

    async init() {
        const terms = await Api.getGlossary();
        terms.forEach(item => {
            this.glossaryMap.set(item.term.toLowerCase(), item);
            if (item.synonyms) {
                item.synonyms.forEach(syn => this.glossaryMap.set(syn.toLowerCase(), item));
            }
        });
    },

    annotateParagraphHtml(text) {
        if (!text) return '';
        let annotated = text;

        // Scan and wrap recognized terms
        this.glossaryMap.forEach((glossaryItem, termKey) => {
            const regex = new RegExp(`\\b(${termKey})\\b`, 'gi');
            annotated = annotated.replace(regex, `<span class="concept-token" data-term="${termKey}">$1</span>`);
        });

        return annotated;
    },

    bindHoverEvents(container) {
        const popover = document.getElementById('hover-popover');
        if (!popover) return;

        container.querySelectorAll('.concept-token').forEach(token => {
            token.addEventListener('mouseenter', (e) => {
                const termKey = token.dataset.term.toLowerCase();
                const data = this.glossaryMap.get(termKey);
                if (!data) return;

                document.getElementById('popover-category').textContent = data.category || 'UPSC Concept';
                document.getElementById('popover-term').textContent = data.term;
                document.getElementById('popover-def').textContent = data.definition;
                document.getElementById('popover-upsc').innerHTML = `<strong>UPSC Context:</strong> ${data.upscContext}`;

                // Position tooltip
                const rect = token.getBoundingClientRect();
                popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
                popover.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 300)}px`;
                popover.classList.remove('hidden');
            });

            token.addEventListener('mouseleave', () => {
                popover.classList.add('hidden');
            });
        });
    }
};
