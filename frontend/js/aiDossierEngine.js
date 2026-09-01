// AI Dossier Engine - Feature Coming Soon
const AiDossierEngine = {
    init() {
        // 1. Bind FAB Button Click
        const fab = document.getElementById('gemini-dossier-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                this.showComingSoonModal();
            });
        }

        // 2. Bind Close Modal
        document.getElementById('close-dossier-modal-btn')?.addEventListener('click', () => {
            this.closeModal();
        });
    },

    showComingSoonModal() {
        const modal = document.getElementById('ai-dossier-modal');
        const contentBox = document.getElementById('dossier-result-content');
        if (!modal || !contentBox) return;

        modal.style.display = 'flex';
        contentBox.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px; animation: sparkle-pulse 2s infinite ease-in-out;">✨</div>
                <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">
                    Chief Examiner AI — Feature Coming Soon
                </h2>
                <p style="color: var(--text-muted); font-size: 14px; max-width: 480px; margin: 0 auto 24px auto; line-height: 1.6;">
                    The AIR-1 UPSC Mains Answer Evaluation & Synthesis Model is currently being fine-tuned with 2026 official examination benchmarks.
                </p>
                <div style="display: inline-block; background: rgba(59, 130, 246, 0.08); color: #2563eb; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.25);">
                    🚀 Stay tuned — Available in the next major update!
                </div>
            </div>
        `;
    },

    closeModal() {
        const modal = document.getElementById('ai-dossier-modal');
        if (modal) modal.style.display = 'none';
    }
};
