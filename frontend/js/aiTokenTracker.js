// Real-time AI Token Usage & Quota Analytics Tracker
const AiTokenTracker = {
    STORAGE_KEY: 'upsc_ai_token_history',

    init() {
        this.updateHeaderBadge();

        // Bind Token Dashboard Button in Masthead
        document.getElementById('open-token-dashboard-btn')?.addEventListener('click', () => {
            this.openDashboardModal();
        });

        // Bind Close Modal
        document.getElementById('close-token-modal-btn')?.addEventListener('click', () => {
            this.closeDashboardModal();
        });

        // Bind Reset Log
        document.getElementById('reset-token-log-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the token usage history?')) {
                localStorage.removeItem(this.STORAGE_KEY);
                this.renderDashboardStats();
                this.updateHeaderBadge();
            }
        });
    },

    getHistory() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    logUsage(articleTitle, source, inputTokens, outputTokens, isLiveApi = false) {
        const history = this.getHistory();
        const totalTokens = inputTokens + outputTokens;
        const entry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            articleTitle: articleTitle || "Editorial Analysis",
            source: source || "The Hindu",
            inputTokens,
            outputTokens,
            totalTokens,
            isLiveApi,
            savedByRag: Math.max(0, 15000 - inputTokens) // Estimated tokens saved by pgvector filtering vs full context dump
        };

        history.unshift(entry);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        this.updateHeaderBadge();
        return entry;
    },

    getStats() {
        const history = this.getHistory();
        const totalTokens = history.reduce((sum, h) => sum + h.totalTokens, 0);
        const totalPromptTokens = history.reduce((sum, h) => sum + h.inputTokens, 0);
        const totalOutputTokens = history.reduce((sum, h) => sum + h.outputTokens, 0);
        const totalSavedTokens = history.reduce((sum, h) => sum + (h.savedByRag || 0), 0);
        const liveCalls = history.filter(h => h.isLiveApi).length;
        const cachedCalls = history.length - liveCalls;

        // Estimated cost on Gemini 1.5 Flash ($0.075 / 1M prompt, $0.30 / 1M completion)
        const estimatedCost = (totalPromptTokens * 0.000000075) + (totalOutputTokens * 0.00000030);
        const dailyQuotaPercent = Math.min(100, (totalTokens / 1000000) * 100);

        return {
            totalRequests: history.length,
            totalTokens,
            totalPromptTokens,
            totalOutputTokens,
            totalSavedTokens,
            liveCalls,
            cachedCalls,
            estimatedCost: estimatedCost.toFixed(5),
            dailyQuotaPercent: dailyQuotaPercent.toFixed(2),
            history
        };
    },

    updateHeaderBadge() {
        const stats = this.getStats();
        const badge = document.getElementById('token-usage-header-badge');
        if (badge) {
            badge.textContent = `${(stats.totalTokens / 1000).toFixed(1)}k Tokens`;
        }
    },

    openDashboardModal() {
        const modal = document.getElementById('token-dashboard-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderDashboardStats();
        }
    },

    closeDashboardModal() {
        const modal = document.getElementById('token-dashboard-modal');
        if (modal) modal.style.display = 'none';
    },

    renderDashboardStats() {
        const stats = this.getStats();

        // Update Stat Cards
        document.getElementById('stat-total-tokens').textContent = stats.totalTokens.toLocaleString();
        document.getElementById('stat-prompt-tokens').textContent = stats.totalPromptTokens.toLocaleString();
        document.getElementById('stat-output-tokens').textContent = stats.totalOutputTokens.toLocaleString();
        document.getElementById('stat-saved-tokens').textContent = stats.totalSavedTokens.toLocaleString();
        document.getElementById('stat-est-cost').textContent = `$${stats.estimatedCost}`;
        document.getElementById('stat-quota-bar').style.width = `${Math.max(1, stats.dailyQuotaPercent)}%`;
        document.getElementById('stat-quota-text').textContent = `${stats.dailyQuotaPercent}% of 1,000,000 Daily Free Limit`;

        // Render Table Log
        const tbody = document.getElementById('token-history-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (stats.history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">No AI queries logged yet. Click the ✨ button on any editorial to generate an analysis.</td></tr>`;
            return;
        }

        stats.history.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600;">${item.date} ${item.timestamp}</td>
                <td><span class="source-tag-mini">${item.source}</span> ${item.articleTitle.substring(0, 35)}...</td>
                <td style="text-align:right;">${item.inputTokens.toLocaleString()}</td>
                <td style="text-align:right;">${item.outputTokens.toLocaleString()}</td>
                <td style="text-align:right;font-weight:700;color:var(--primary-color);">${item.totalTokens.toLocaleString()}</td>
                <td><span class="cache-pill ${item.isLiveApi ? 'live' : 'cached'}">${item.isLiveApi ? '🌐 Live API' : '⚡ Local RAG'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
};
