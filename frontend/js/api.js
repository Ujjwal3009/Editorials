// API Client for Spring Boot Backend
// Dynamic Backend Base URL
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080/api/v1'
    : (window.BACKEND_API_URL || 'https://upsc-editorial-backend.onrender.com/api/v1');

const Api = {
    async getArticles(date, gsPaper) {
        let url = `${API_BASE}/articles`;
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (gsPaper && gsPaper !== 'ALL') params.append('gsPaper', gsPaper);
        if (params.toString()) url += `?${params.toString()}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('Backend unavailable, using rich fallback data:', e);
            return FallbackData.articles;
        }
    },

    async getArticleById(id) {
        try {
            const res = await fetch(`${API_BASE}/articles/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            return FallbackData.articles.find(a => a.id === id) || FallbackData.articles[0];
        }
    },

    async searchPrelimsHybrid(query, limit = 3) {
        try {
            const res = await fetch(`${API_BASE}/search/prelims/hybrid?query=${encodeURIComponent(query)}&limit=${limit}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('Prelims search error:', e);
            return [];
        }
    },

    async getGlossary() {
        try {
            const res = await fetch(`${API_BASE}/mains/glossary`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            return FallbackData.glossary;
        }
    },

    async explainSnippet(selectedText, articleTitle, gsPaper, queryType = 'EXPLAIN') {
        try {
            const res = await fetch(`${API_BASE}/ai/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedText,
                    articleContextTitle: articleTitle,
                    gsPaper,
                    queryType
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            // Instant offline heuristic synthesis
            return {
                isAiGenerated: false,
                explanation: `Analysis of selection: "${selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"`,
                upscSignificance: `Core relevance to ${gsPaper || 'UPSC Mains'} (Institutional & Policy dimensions).`,
                keyArguments: [
                    "Structural impact on governance & public order",
                    "Socio-economic fallout for affected stakeholders",
                    "Constitutional and policy safeguards under examination"
                ],
                wayForward: "Adopt a multi-pronged approach balancing state capacity with civil protections.",
                notice: "⚡ Offline Mode: Simulated response (Gemini AI flag is currently OFF)."
            };
        }
    },

    async saveNote(articleId, selectedText, noteContent, gsTag) {
        try {
            const res = await fetch(`${API_BASE}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId, selectedText, noteContent, gsTag })
            });
            return await res.json();
        } catch (e) {
            const localNotes = JSON.parse(localStorage.getItem('upsc_mains_notes') || '[]');
            const newNote = { id: Date.now(), articleId, selectedText, noteContent, gsTag, createdAt: new Date().toISOString() };
            localNotes.unshift(newNote);
            localStorage.setItem('upsc_mains_notes', JSON.stringify(localNotes));
            return newNote;
        }
    },

    async getNotes(articleId) {
        try {
            const res = await fetch(`${API_BASE}/notes${articleId ? '?articleId=' + articleId : ''}`);
            return await res.json();
        } catch (e) {
            return JSON.parse(localStorage.getItem('upsc_mains_notes') || '[]');
        }
    }
};

// Fallback seed data if backend is starting
const FallbackData = {
    glossary: [
        { term: "Strategic Autonomy", category: "Geopolitics", definition: "A state's capability to pursue national interest independently without coercive alliances.", upscContext: "GS-2 Foreign Policy & NAM 2.0 balancing strategy." },
        { term: "Low-Earth Orbit", category: "Space & Tech", definition: "An altitude between 160 km and 2,000 km, optimal for communication satellite constellations.", upscContext: "GS-3 Space commercialization & Starlink constellations." },
        { term: "Chilling Effect", category: "Polity & Law", definition: "A legal doctrine where laws discourage citizens from exercising constitutional rights out of fear of punishment.", upscContext: "Article 19(1)(a) jurisprudence (Shreya Singhal case)." },
        { term: "Glacial Lake Outburst Flood", category: "Environment", definition: "Catastrophic release of water from a glacial lake dammed by unstable moraines.", upscContext: "GS-3 Disaster Management & NDMA early warning guidelines." },
        { term: "SAMADHAN Doctrine", category: "Security", definition: "MHA 8-pillar operational framework for Left-Wing Extremism containment.", upscContext: "GS-3 Internal Security & Tribal Welfare integration." },
        { term: "Track II Dialogue", category: "Diplomacy", definition: "Unofficial diplomacy involving non-governmental experts and retired diplomats.", upscContext: "GS-2 Confidence building and cross-border disaster risk sharing." }
    ],
    articles: [
        {
            id: 1,
            source: "The Hindu",
            sourceUrl: "https://www.thehindu.com/opinion/op-ed/a-shared-disaster-beyond-borders-and-geopolitics/article71401817.ece",
            title: "A shared disaster, beyond borders and geopolitics",
            subtitle: "For Nepal, India and China, the devastating cross-border floods are a stark reminder of nature’s fury, and that cooperation must transcend the boundaries of geopolitics",
            author: "Bhaskar Koirala",
            publishedDate: "2026-08-29",
            layoutSlot: "LEAD",
            gsPaper: "GS-2",
            syllabusTopicTitle: "Bilateral, regional and global groupings involving India",
            statistics: [
                "475 MW generating capacity offline on Nepal's electricity grid",
                "$175.8 million Gyirong Port international gateway buried under debris",
                "47.5 tonnes of IAF emergency relief material dispatched"
            ],
            committeesCited: ["2nd ARC 5th Report", "Sendai Framework for Disaster Risk Reduction"],
            elements: [
                { id: 1, order: 1, type: "paragraph", content: "On Wednesday, August 26, 2026, at approximately 8.44 a.m. Nepal time, what initially appeared to be a 4.4-magnitude earthquake struck near the Nepal-China border. It triggered the collapse of an enormous glacial slab, resulting in devastating flash floods." },
                { id: 2, order: 2, type: "paragraph", content: "Entire villages and towns have been swept away. Vital infrastructure such as bridges and hydropower stations has been decimated. A staggering 475 megawatts of generating capacity has been wiped off Nepal's electricity grid." },
                { id: 3, order: 3, type: "heading", content: "Nature’s fury knows no borders" },
                { id: 4, order: 4, type: "paragraph", content: "For Nepal, India and China, ordinarily caught up in geopolitical contestations, the catastrophic force of nature is a reminder that physical interconnections inextricably link the three countries. China’s Gyirong Port, upgraded at a cost of $175.8 million, is now buried beneath heavy debris." },
                { id: 5, order: 5, type: "heading", content: "Flood fallout for India" },
                { id: 6, order: 6, type: "paragraph", content: "For India, downstream flood threats reached the Gandak, Kosi and Ganga rivers in Bihar, prompting maximum alert at Valmikinagar Barrage. New Delhi activated an extensive Humanitarian Assistance and Disaster Relief (HADR) programme with Indian Air Force dispatching 47.5 tonnes of relief material." }
            ],
            relatedPyqs: [
                { id: 1, gsPaper: "GS-2", year: 2023, questionNumber: 18, marks: 15, questionText: "The geopolitical contestations in South Asia necessitate that India reorients its Neighbourhood First policy into actionable regional connectivity and disaster diplomacy. Critically examine." },
                { id: 2, gsPaper: "GS-3", year: 2024, questionNumber: 16, marks: 15, questionText: "Dam bursts and glacial lake outburst floods (GLOFs) pose an acute threat to the fragile Himalayan ecosystem. Analyze the institutional preparedness required." }
            ]
        },
        {
            id: 2,
            source: "The Hindu",
            sourceUrl: "https://www.thehindu.com/opinion/editorial/escape-velocity-on-what-indias-space-sector-must-focus-on/article71389175.ece",
            title: "Escape velocity: On what India’s space sector must focus on",
            subtitle: "India’s space sector must focus on reliability and regular launches",
            author: "The Hindu Desk",
            publishedDate: "2026-08-26",
            layoutSlot: "SIDE_1",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Awareness in the fields of Space & Indigenization of Technology",
            statistics: [
                "Launch cost: $13,302 per kg to Low-Earth Orbit on Indian rockets vs $3,225 in US",
                "SpaceX captured 75% of global orbital payload in 2025"
            ],
            elements: [
                { id: 7, order: 1, type: "paragraph", content: "For much of the 20th century, a rocket tearing a white seam through the sky did for India roughly what football did for Argentina and Brazil. A famished republic gambled on rockets and atomic piles. Today, satellites are the plumbing of the information age." },
                { id: 8, order: 2, type: "paragraph", content: "A recent analysis in Economics Letters finds that it cost $13,302 to loft a kilogram into low-earth orbit on an Indian rocket in 2025. That is because India launches too rarely. The value of India’s space sector can no longer rely on aura, but on jobs, capital, and heavy-lift launch cadence." }
            ],
            relatedPyqs: [
                { id: 3, gsPaper: "GS-3", year: 2021, questionNumber: 7, marks: 10, questionText: "Discuss the role of the private sector in space exploration with special reference to IN-SPACe." }
            ]
        },
        {
            id: 3,
            source: "The Indian Express",
            sourceUrl: "https://indianexpress.com/article/opinion/editorials/himalayan-glacier-risks-nepal-floods-10856158/",
            title: "As glaciers melt, prepare for a Himalayan challenge",
            subtitle: "Ecological fragility and early warning systems across the Himalayan range",
            author: "IE Bureau",
            publishedDate: "2026-08-31",
            layoutSlot: "SIDE_2",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Disaster and disaster management; Himalayan Ecology",
            statistics: ["Over 2,000 potentially dangerous glacial lakes identified across the Hindu Kush Himalaya."],
            elements: [
                { id: 9, order: 1, type: "paragraph", content: "The Himalayan mountain system is the ecological mainstay of large parts of the Indian Subcontinent. It is the wellspring of rivers and shapes the monsoon. However, the range has become increasingly fragile." }
            ],
            relatedPyqs: [
                { id: 4, gsPaper: "GS-3", year: 2024, questionNumber: 16, marks: 15, questionText: "Dam bursts and glacial lake outburst floods (GLOFs) pose an acute threat to the fragile Himalayan ecosystem." }
            ]
        },
        {
            id: 4,
            source: "The Indian Express",
            sourceUrl: "https://indianexpress.com/article/opinion/columns/indias-central-asia-strategy-needs-less-romance-more-realism-10849030/",
            title: "C Raja Mohan writes: India’s Central Asia strategy needs realism",
            subtitle: "Moving from romantic historical ties to pragmatic trade corridors",
            author: "C. Raja Mohan",
            publishedDate: "2026-08-31",
            layoutSlot: "OPED_1",
            gsPaper: "GS-2",
            syllabusTopicTitle: "Bilateral groupings involving India (Central Asia & INSTC)",
            statistics: ["INSTC freight transit times reduced by 40% compared to Suez Canal route."],
            elements: [
                { id: 10, order: 1, type: "paragraph", content: "When the Soviet Union dissolved in 1991 and five new republics emerged in Central Asia, there was extraordinary enthusiasm in Delhi. Today, Delhi must focus on real transit corridors via Chabahar and INSTC." }
            ],
            relatedPyqs: [
                { id: 5, gsPaper: "GS-2", year: 2023, questionNumber: 18, marks: 15, questionText: "The geopolitical contestations in South Asia necessitate regional connectivity." }
            ]
        }
    ]
};
