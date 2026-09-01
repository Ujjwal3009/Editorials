// UPSC Mains Editorial Master App Coordinator with Browser History Stack Support
const AppState = {
    allArticles: [],
    availableDates: [],
    selectedDate: '2026-09-01',
    filteredArticles: [],
    activeArticle: null,
    activeGsFilter: 'ALL',
    activeTheme: 'newsprint',
    currentView: 'catalog' // 'catalog' | 'reader'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Set initial history state
    if (!history.state) {
        history.replaceState({ view: 'catalog' }, '', window.location.pathname);
    }

    // 1. Initialize sub-engines
    await HoverEngine.init();
    ReaderEngine.init();
    MainsDrawer.init();
    if (typeof AiTokenTracker !== "undefined") AiTokenTracker.init();
    if (typeof AiDossierEngine !== "undefined") AiDossierEngine.init();

    // 2. Bind Theme, Header & Navigation Controls
    initControls();

    // 3. Bind Browser Back / Forward Buttons (Popstate)
    window.addEventListener('popstate', (event) => {
        const state = event.state;
        if (state && state.view === 'reader' && state.articleId) {
            const article = AppState.allArticles.find(a => a.id === state.articleId);
            if (article) {
                openArticleReader(article, false);
            } else {
                showCatalogView(false);
            }
        } else {
            showCatalogView(false);
        }
    });

    // 4. Load All Articles & Populate Date Groups
    await loadEditorialDesk();
});

function initControls() {
    // Current date masthead display
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) {
        dateElem.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    }

    // Theme Switcher
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.dataset.theme;
            document.body.className = `theme-${theme} font-normal`;
            AppState.activeTheme = theme;
        });
    });

    // Font Controls
    document.getElementById('font-increase')?.addEventListener('click', () => {
        document.body.style.fontSize = '18px';
    });
    document.getElementById('font-decrease')?.addEventListener('click', () => {
        document.body.style.fontSize = '15px';
    });

    // Brand Header Click -> Return to Home Catalog
    document.getElementById('brand-header')?.addEventListener('click', () => {
        showCatalogView(true);
    });

    // Back to Catalog Buttons
    document.getElementById('back-to-catalog-btn')?.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            showCatalogView(true);
        }
    });
    document.getElementById('reader-back-btn-bottom')?.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            showCatalogView(true);
        }
    });

    // GS Paper Filter Chips
    document.querySelectorAll('.gs-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.gs-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            AppState.activeGsFilter = chip.dataset.gs;
            applyFiltersAndRenderCatalog();
        });
    });

    // Prev / Next Navigation in Reader Mode
    document.getElementById('prev-article-btn')?.addEventListener('click', () => {
        if (!AppState.activeArticle) return;
        const idx = AppState.filteredArticles.findIndex(a => a.id === AppState.activeArticle.id);
        if (idx > 0) {
            openArticleReader(AppState.filteredArticles[idx - 1], true);
        }
    });

    document.getElementById('next-article-btn')?.addEventListener('click', () => {
        if (!AppState.activeArticle) return;
        const idx = AppState.filteredArticles.findIndex(a => a.id === AppState.activeArticle.id);
        if (idx !== -1 && idx < AppState.filteredArticles.length - 1) {
            openArticleReader(AppState.filteredArticles[idx + 1], true);
        }
    });
}

async function loadEditorialDesk(retryCount = 0) {
    const grid = document.getElementById('catalog-cards-grid');

    if (grid && (!AppState.allArticles || AppState.allArticles.length === 0)) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-main);">
                <div class="gemini-sparkle-spinner" style="margin: 0 auto 16px auto;"></div>
                <h3 style="font-family: var(--font-headline); font-size: 18px; margin-bottom: 4px; color: var(--text-main);">Loading Editorials...</h3>
                <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Please wait a moment while the edition is loaded.</p>
            </div>
        `;
    }

    try {
        AppState.allArticles = await Api.getArticles();

        if ((!AppState.allArticles || AppState.allArticles.length === 0) && retryCount < 3) {
            setTimeout(() => loadEditorialDesk(retryCount + 1), 3000);
            return;
        }

        const dateSet = new Set(AppState.allArticles.map(a => a.publishedDate).filter(Boolean));
        AppState.availableDates = Array.from(dateSet).sort().reverse();
        if (AppState.availableDates.length > 0) {
            AppState.selectedDate = AppState.availableDates[0];
        }

        renderDateTabs();
        applyFiltersAndRenderCatalog();
    } catch (e) {
        console.error('Failed to load editorial desk:', e);
        if (retryCount < 3) {
            setTimeout(() => loadEditorialDesk(retryCount + 1), 3000);
        }
    }
}

function renderDateTabs() {
    const tabsContainer = document.getElementById('date-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    AppState.availableDates.forEach((dateStr, index) => {
        const count = getArticlesForDate(dateStr).length;
        const dateObj = new Date(dateStr + 'T00:00:00');
        const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const dayLabel = index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        const btn = document.createElement('button');
        btn.className = `date-tab ${AppState.selectedDate === dateStr ? 'active' : ''}`;
        btn.dataset.date = dateStr;
        btn.innerHTML = `
            <span class="tab-day">${dayLabel}</span>
            <span class="tab-date">${formatted}</span>
            <span class="tab-count">${count}</span>
        `;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            AppState.selectedDate = dateStr;
            showCatalogView(true);
            applyFiltersAndRenderCatalog();
        });

        tabsContainer.appendChild(btn);
    });

    // "Archive: All Dates" Tab
    const allTab = document.createElement('button');
    allTab.className = `date-tab ${AppState.selectedDate === 'ALL' ? 'active' : ''}`;
    allTab.dataset.date = 'ALL';
    allTab.innerHTML = `
        <span class="tab-day">Archive</span>
        <span class="tab-date">All Dates</span>
        <span class="tab-count">${AppState.allArticles.length}</span>
    `;
    allTab.addEventListener('click', () => {
        document.querySelectorAll('.date-tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
        AppState.selectedDate = 'ALL';
        showCatalogView(true);
        applyFiltersAndRenderCatalog();
    });
    tabsContainer.appendChild(allTab);
}

function getArticlesForDate(targetDate) {
    if (targetDate === 'ALL') {
        return [...AppState.allArticles];
    }

    const res = [];
    const seen = new Set();

    // 1. Newspapers (Strictly on selected date)
    AppState.allArticles
        .filter(a => (a.source.includes('Hindu') || a.source.includes('Express')))
        .filter(a => a.publishedDate === targetDate)
        .forEach(a => {
            if (!seen.has(a.id)) { seen.add(a.id); res.push(a); }
        });

    // 2. Think Tanks & Research (Rolling <= targetDate, top 5 per source)
    const thinkTanks = ['MP-IDSA', 'Observer', 'Down To Earth', 'InsightsIAS', 'PIB'];
    thinkTanks.forEach(sourceName => {
        AppState.allArticles
            .filter(a => a.source.includes(sourceName) || (sourceName === 'PIB' && a.source.includes('Digest')))
            .filter(a => a.publishedDate <= targetDate)
            .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
            .slice(0, 5)
            .forEach(a => {
                if (!seen.has(a.id)) { seen.add(a.id); res.push(a); }
            });
    });

    if (res.length === 0) {
        // Resilient fallback: return articles for targetDate or most recent available date
        const direct = AppState.allArticles.filter(a => a.publishedDate === targetDate);
        if (direct.length > 0) return direct;
        if (AppState.availableDates.length > 0) {
            return AppState.allArticles.filter(a => a.publishedDate === AppState.availableDates[0]);
        }
        return AppState.allArticles;
    }

    return res;
}

function applyFiltersAndRenderCatalog() {
    let filtered = getArticlesForDate(AppState.selectedDate);

    if (AppState.activeGsFilter !== 'ALL') {
        filtered = filtered.filter(a => a.gsPaper === AppState.activeGsFilter);
    }

    AppState.filteredArticles = filtered;

    const totalCountElem = document.getElementById('total-articles-count');
    if (totalCountElem) totalCountElem.textContent = filtered.length;

    const statsBadge = document.getElementById('catalog-stats-badge');
    if (statsBadge) statsBadge.textContent = `${filtered.length} Items in this Edition`;

    const headingDate = document.getElementById('catalog-heading-date');
    if (headingDate) {
        if (AppState.selectedDate === 'ALL') {
            headingDate.textContent = 'All Dates Archive Catalog';
        } else {
            const d = new Date(AppState.selectedDate + 'T00:00:00');
            headingDate.textContent = `Edition Catalog — ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
    }

    if (filtered.length === 0) {
        document.getElementById('hero-featured-card').innerHTML = '';
        document.getElementById('catalog-cards-grid').innerHTML = '<p style="padding: 24px; color: var(--text-muted);">No editorials or summaries found for selected filters.</p>';
        return;
    }

    const leadArticle = filtered.find(a => a.layoutSlot === 'LEAD') || filtered[0];
    const otherArticles = filtered.filter(a => a.id !== leadArticle.id);

    renderHeroCard(leadArticle);
    renderCatalogCardsGrid(otherArticles);
}

function renderHeroCard(article) {
    const container = document.getElementById('hero-featured-card');
    if (!container) return;

    const gsPaper = article.gsPaper || 'GS-2';
    const gsClass = gsPaper.toLowerCase().replace('-', '');
    const sourceClass = getSourceClass(article.source);
    const readMinutes = Math.max(2, Math.round((article.elements?.length || 5) * 0.6));
    const snippet = article.subtitle || (article.elements?.[0]?.content || article.fullText || '').substring(0, 220) + '...';

    container.innerHTML = `
        <div class="hero-card" data-id="${article.id}">
            <div class="hero-top-badges">
                <span class="source-badge ${sourceClass}">★ ${article.source}</span>
                <span class="gs-badge-pill ${gsClass}">${gsPaper}</span>
                <span class="read-time-pill">⏱ ${readMinutes} min read</span>
                <span class="date-pill-tag">📅 ${article.publishedDate}</span>
            </div>
            
            <h2 class="hero-headline">${article.title}</h2>
            <p class="hero-snippet">${snippet}</p>

            <div class="hero-footer">
                <div class="hero-meta">
                    <span class="hero-author">By ${article.author || 'Editorial Desk'}</span>
                    ${article.syllabusTopicTitle ? `<span class="hero-topic">• ${article.syllabusTopicTitle}</span>` : ''}
                </div>
                <div class="hero-actions">
                    ${article.sourceUrl ? `
                        <a href="${article.sourceUrl}" target="_blank" rel="noopener" class="hero-ext-link-btn" title="Open original publication on live website">
                            🔗 View Original ↗
                        </a>
                    ` : ''}
                    <button class="hero-read-btn" data-id="${article.id}">
                        Read Deep Analysis ➔
                    </button>
                </div>
            </div>
        </div>
    `;

    container.querySelector('.hero-card').addEventListener('click', (e) => {
        if (!e.target.closest('.hero-ext-link-btn')) {
            openArticleReader(article, true);
        }
    });
}

function renderCatalogCardsGrid(articles) {
    const grid = document.getElementById('catalog-cards-grid');
    if (!grid) return;

    grid.innerHTML = '';

    articles.forEach(article => {
        const gsPaper = article.gsPaper || 'GS-3';
        const gsClass = gsPaper.toLowerCase().replace('-', '');
        const sourceClass = getSourceClass(article.source);
        const readMinutes = Math.max(2, Math.round((article.elements?.length || 4) * 0.5));
        const snippet = article.subtitle || (article.elements?.[0]?.content || article.fullText || '').substring(0, 140) + '...';

        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.dataset.id = article.id;
        card.innerHTML = `
            <div class="catalog-card-header">
                <span class="source-badge ${sourceClass}">${article.source}</span>
                <span class="read-time-pill">⏱ ${readMinutes}m</span>
            </div>
            
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span class="gs-badge-pill ${gsClass}" style="font-size: 10px;">${gsPaper}</span>
                <span style="font-size:10px;color:var(--text-muted);font-weight:700;background:rgba(0,0,0,0.04);padding:2px 6px;border-radius:4px;">📅 ${article.publishedDate}</span>
            </div>

            <h3 class="catalog-card-title">${article.title}</h3>
            <p class="catalog-card-snippet">${snippet}</p>

            <div class="catalog-card-footer">
                <span class="catalog-card-author">${article.author || 'Desk'}</span>
                <div class="card-btn-group">
                    ${article.sourceUrl ? `
                        <a href="${article.sourceUrl}" target="_blank" rel="noopener" class="card-ext-btn" title="Open source page">
                            🔗 ↗
                        </a>
                    ` : ''}
                    <span class="catalog-card-read-link">Read ➔</span>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-ext-btn')) {
                openArticleReader(article, true);
            }
        });

        grid.appendChild(card);
    });
}

function getSourceClass(source) {
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

function openArticleReader(article, pushHistory = true) {
    AppState.activeArticle = article;
    AppState.currentView = 'reader';

    if (pushHistory) {
        history.pushState({ view: 'reader', articleId: article.id }, '', `#article-${article.id}`);
    }

    document.getElementById('catalog-view').style.display = 'none';
    document.getElementById('reader-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    ReaderEngine.renderArticle(article);
    MainsDrawer.updateDock(article);
}

function showCatalogView(pushHistory = true) {
    AppState.currentView = 'catalog';

    if (pushHistory && history.state && history.state.view === 'reader') {
        history.pushState({ view: 'catalog' }, '', window.location.pathname);
    }

    document.getElementById('reader-view').style.display = 'none';
    document.getElementById('catalog-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
