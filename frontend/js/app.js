// UPSC Mains Editorial Master App Coordinator with Original Source Links
const AppState = {
    allArticles: [],
    availableDates: [],
    selectedDate: '2026-08-31',
    filteredArticles: [],
    activeArticle: null,
    activeGsFilter: 'ALL',
    activeTheme: 'newsprint',
    currentView: 'catalog' // 'catalog' | 'reader'
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize sub-engines
    await HoverEngine.init();
    ReaderEngine.init();
    MainsDrawer.init();
    if (typeof AiTokenTracker !== "undefined") AiTokenTracker.init();
    if (typeof AiDossierEngine !== "undefined") AiDossierEngine.init();

    // 2. Bind Theme, Header & Navigation Controls
    initControls();

    // 3. Load All Articles & Populate Date Groups
    await loadEditorialDesk();
});

function initControls() {
    // Current date masthead display
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

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
        showCatalogView();
    });

    // Back to Catalog Buttons
    document.getElementById('back-to-catalog-btn')?.addEventListener('click', () => {
        showCatalogView();
    });
    document.getElementById('reader-back-btn-bottom')?.addEventListener('click', () => {
        showCatalogView();
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
            openArticleReader(AppState.filteredArticles[idx - 1]);
        }
    });

    document.getElementById('next-article-btn')?.addEventListener('click', () => {
        if (!AppState.activeArticle) return;
        const idx = AppState.filteredArticles.findIndex(a => a.id === AppState.activeArticle.id);
        if (idx !== -1 && idx < AppState.filteredArticles.length - 1) {
            openArticleReader(AppState.filteredArticles[idx + 1]);
        }
    });
}

async function loadEditorialDesk() {
    // 1. Fetch all articles from persistent database
    AppState.allArticles = await Api.getArticles();

    // 2. Extract unique dates sorted descending
    const dateSet = new Set(AppState.allArticles.map(a => a.publishedDate).filter(Boolean));
    AppState.availableDates = Array.from(dateSet).sort().reverse();
    if (AppState.availableDates.length > 0) {
        AppState.selectedDate = AppState.availableDates[0];
    }

    // 3. Render Date Archive Tabs Bar
    renderDateTabs();

    // 4. Render Home Content Catalog List
    applyFiltersAndRenderCatalog();
}

function renderDateTabs() {
    const tabsContainer = document.getElementById('date-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    AppState.availableDates.forEach((dateStr, index) => {
        const count = AppState.allArticles.filter(a => a.publishedDate === dateStr).length;
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
            showCatalogView();
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
        showCatalogView();
        applyFiltersAndRenderCatalog();
    });
    tabsContainer.appendChild(allTab);
}

// 🏠 RENDER THE CONTENT CATALOG LIST ON HOME PAGE
function applyFiltersAndRenderCatalog() {
    let filtered = AppState.selectedDate === 'ALL'
        ? [...AppState.allArticles]
        : AppState.allArticles.filter(a => a.publishedDate === AppState.selectedDate);

    if (AppState.activeGsFilter !== 'ALL') {
        filtered = filtered.filter(a => a.gsPaper === AppState.activeGsFilter);
    }

    AppState.filteredArticles = filtered;

    // Update Counts & Heading
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

    // Identify Hero Lead Article (or first article)
    const leadArticle = filtered.find(a => a.layoutSlot === 'LEAD') || filtered[0];
    const otherArticles = filtered.filter(a => a.id !== leadArticle.id);

    // 1. Render Hero Lead Card
    renderHeroCard(leadArticle);

    // 2. Render Multi-Source Cards Grid
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
                <span class="hero-tag-lead">⭐ TODAY'S LEAD OPINION</span>
                <span class="source-tag ${sourceClass}">${article.source}</span>
                <span class="gs-badge-pill ${gsClass}">${gsPaper}: ${article.syllabusTopicTitle || 'Core Focus'}</span>
                ${article.sourceUrl ? `
                    <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="source-external-pill" onclick="event.stopPropagation()" title="Open original article on ${article.source}">
                        🔗 Original Link ↗
                    </a>` : ''}
            </div>
            <h2 class="hero-headline">${article.title}</h2>
            ${article.subtitle ? `<h3 class="hero-subdeck">${article.subtitle}</h3>` : ''}
            <p class="hero-snippet">${snippet}</p>
            <div class="hero-byline-bar">
                <span>By <strong>${article.author || 'Editorial Desk'}</strong> • ${article.publishedDate}</span>
                <span>⏱️ ${readMinutes} Min Read (${article.elements?.length || 1} Paragraphs)</span>
                <span class="read-action-link">Read Full Editorial & Annotations ➔</span>
            </div>
        </div>
    `;

    container.querySelector('.hero-card')?.addEventListener('click', () => {
        openArticleReader(article);
    });
}

function renderCatalogCardsGrid(articles) {
    const grid = document.getElementById('catalog-cards-grid');
    if (!grid) return;

    grid.innerHTML = '';

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.dataset.id = article.id;

        const gsPaper = article.gsPaper || 'GS-2';
        const gsClass = gsPaper.toLowerCase().replace('-', '');
        const sourceClass = getSourceClass(article.source);
        const slotLabel = getSlotLabel(article.layoutSlot);
        const readMinutes = Math.max(2, Math.round((article.elements?.length || 4) * 0.5));
        
        const snippet = article.subtitle 
            ? article.subtitle 
            : (article.elements?.[0]?.content || article.fullText || '').substring(0, 140) + '...';

        card.innerHTML = `
            <div>
                <div class="catalog-card-top">
                    <span class="source-tag ${sourceClass}">${article.source}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="catalog-slot-pill">${slotLabel}</span>
                        ${article.sourceUrl ? `
                            <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="card-source-link" onclick="event.stopPropagation()" title="Open original link">
                                🔗 ↗
                            </a>` : ''}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span class="gs-badge-pill ${gsClass}" style="font-size: 10px;">${gsPaper}</span><span style="font-size:10px;color:var(--text-muted);font-weight:700;background:rgba(0,0,0,0.04);padding:2px 6px;border-radius:4px;">📅 ${article.publishedDate}</span></div>
                <h3 class="catalog-card-headline">${article.title}</h3>
                <p class="catalog-card-snippet">${snippet}</p>
            </div>
            <div class="catalog-card-footer">
                <span>By <strong>${article.author || 'Desk'}</strong></span>
                <span>⏱️ ${readMinutes} Min Read</span>
                <span style="font-weight: 700; color: var(--primary-color);">Read ➔</span>
            </div>
        `;

        // 🎯 FULL CARD CLICK -> OPEN READER VIEW
        card.addEventListener('click', () => {
            openArticleReader(article);
        });

        grid.appendChild(card);
    });
}

// 📖 OPEN ARTICLE DEEP READER VIEW
function openArticleReader(article) {
    AppState.activeArticle = article;
    AppState.currentView = 'reader';

    // Toggle Views
    document.getElementById('catalog-view').style.display = 'none';
    document.getElementById('reader-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Breadcrumbs
    document.getElementById('reader-breadcrumb-source').textContent = article.source;
    document.getElementById('reader-breadcrumb-gs').textContent = article.gsPaper || 'GS-2';

    // Source Tag & Original Link Pill
    const srcTag = document.getElementById('reader-source-tag');
    srcTag.textContent = article.source;
    srcTag.className = `source-tag ${getSourceClass(article.source)}`;

    // Top Meta with Clickable Original Link
    const metaContainer = document.querySelector('.reader-top-meta');
    if (metaContainer) {
        metaContainer.innerHTML = `
            <span id="reader-source-tag" class="source-tag ${getSourceClass(article.source)}">${article.source}</span>
            <div class="gs-badge-pill ${article.gsPaper ? article.gsPaper.toLowerCase().replace('-', '') : 'gs2'}" id="lead-gs-badge">
                ${article.gsPaper || 'GS-2'}: ${article.syllabusTopicTitle || 'National & Global Affairs'}
            </div>
            ${article.sourceUrl ? `
                <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="source-external-pill" title="Open original article on ${article.source}">
                    🔗 View Original on ${article.source} ↗
                </a>` : ''}
        `;
    }

    // Title & Byline
    document.getElementById('lead-title').textContent = article.title;
    document.getElementById('lead-subtitle').textContent = article.subtitle || '';
    document.getElementById('lead-author').innerHTML = `By <strong>${article.author || 'Editorial Desk'}</strong>`;
    
    // Byline Source with Link
    const sourceByline = document.getElementById('lead-source');
    if (article.sourceUrl) {
        sourceByline.innerHTML = `Source: <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-color);text-decoration:underline;"><em>${article.source}</em> ↗</a>`;
    } else {
        sourceByline.innerHTML = `Source: <em>${article.source}</em>`;
    }

    document.getElementById('lead-date').textContent = article.publishedDate || '';

    // Render Body Paragraphs
    const bodyContainer = document.getElementById('lead-content');
    bodyContainer.innerHTML = '';

    if (article.elements && article.elements.length > 0) {
        article.elements.forEach((elem, index) => {
            if (elem.type === 'heading') {
                const h3 = document.createElement('h3');
                h3.style.fontFamily = 'var(--font-headline)';
                h3.style.fontSize = '20px';
                h3.style.margin = '22px 0 8px';
                h3.textContent = elem.content;
                bodyContainer.appendChild(h3);
            } else {
                const p = document.createElement('p');
                if (index === 0) p.className = 'dropcap';
                p.innerHTML = HoverEngine.annotateParagraphHtml(elem.content);
                bodyContainer.appendChild(p);
            }
        });
    } else {
        bodyContainer.innerHTML = `<p class="dropcap">${HoverEngine.annotateParagraphHtml(article.fullText || 'Article content loading...')}</p>`;
    }

    // Attach Hover Popovers
    HoverEngine.bindHoverEvents(bodyContainer);

    // Sync Right Mains Enrichment Dock
    MainsDrawer.updateDock(article);
}

// 🏠 SHOW HOME CONTENT CATALOG LIST VIEW
function showCatalogView() {
    AppState.currentView = 'catalog';
    document.getElementById('reader-view').style.display = 'none';
    document.getElementById('catalog-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSourceClass(source) {
    if (!source) return 'hindu';
    if (source.includes('Express')) return 'ie';
    if (source.includes('Observer') || source.includes('ORF')) return 'orf';
    if (source.includes('IDSA') || source.includes('Defence')) return 'idsa';
    if (source.includes('Down To Earth')) return 'dte';
    if (source.includes('Insights') || source.includes('PIB')) return 'pib';
    return 'hindu';
}

function getSlotLabel(slot) {
    switch (slot) {
        case 'LEAD': return '⭐ LEAD OPINION';
        case 'SIDE_1': return 'FIRST EDITORIAL';
        case 'SIDE_2': return 'SECOND EDITORIAL';
        case 'OPED_1': return 'STRATEGIC COLUMN';
        case 'OPED_2': return 'ORF COMMENTARY';
        case 'OPED_3': return 'ORF GLOBAL SOUTH';
        case 'OPED_4': return 'MP-IDSA SECURITY';
        case 'OPED_5': return 'MP-IDSA DEFENCE TECH';
        case 'OPED_6': return 'CLIMATE & POLICY / DTE';
        case 'OPED_7': return 'ECOLOGY & AGRI / DTE';
        case 'PIB_DIGEST': return '🏛️ DAILY PIB & SCHEMES';
        default: return 'ANALYSIS';
    }
}
