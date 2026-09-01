// API Client for Spring Boot Backend
// Dynamic Backend Base URL
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080/api/v1'
    : (window.BACKEND_API_URL || 'https://editorials.onrender.com/api/v1');

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

    async generateAiDossier(articleId, studentAnswer = '') {
        try {
            const res = await fetch(`${API_BASE}/ai/generate-dossier`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId, studentAnswer })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('Backend AI proxy error, using local fallback:', e);
            return null;
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
        { term: "SAMADHAN Doctrine", category: "Security", definition: "MHA 8-pillar operational framework for Left-Wing Extremism containment.", upscContext: "GS-3 Internal Security & Tribal Welfare integration." }
    ],
    articles: [
        {
            id: 101,
            source: "The Hindu",
            sourceUrl: "https://www.thehindu.com/opinion/editorial/step-up-regulation-on-ayush-medical-education/article71411043.ece",
            title: "Step up regulation: On AYUSH medical education",
            subtitle: "The Union government and the National Commission for Indian System of Medicine must enforce uniform clinical standards and accreditation across AYUSH institutions.",
            author: "The Hindu Editorial Desk",
            publishedDate: "2026-09-01",
            layoutSlot: "LEAD",
            gsPaper: "GS-2",
            syllabusTopicTitle: "Issues relating to development and management of Social Sector/Services relating to Health",
            statistics: [
                "Over 750 AYUSH medical colleges currently operating across India",
                "National Commission for Indian System of Medicine (NCISM) Act 2020 regulatory oversight",
                "Ayush grid integration with Ayushman Bharat Digital Mission (ABDM)"
            ],
            elements: [
                { id: 1, order: 1, type: "paragraph", content: "The rapid expansion of the Indian Systems of Medicine (AYUSH) in the public healthcare matrix necessitates stringent quality benchmarks. While the National Commission for Indian System of Medicine (NCISM) has sought to standardize curricula, regulatory loopholes persist in faculty accreditation and infrastructural compliance." },
                { id: 2, order: 2, type: "paragraph", content: "A robust integrative healthcare architecture requires evidence-based validation. Integrating AYUSH practitioners into rural health infrastructure must be backed by continuous clinical audits to maintain patient safety and uniform treatment protocols." }
            ]
        },
        {
            id: 102,
            source: "The Hindu",
            sourceUrl: "https://www.thehindu.com/opinion/editorial/deadly-span-on-vulture-safety-in-india-threat-of-electrocution/article71411071.ece",
            title: "Deadly span: On vulture safety in India, threat of electrocution",
            subtitle: "Mitigating high-tension powerline electrocutions is critical for safeguarding recovering vulture populations in India.",
            author: "The Hindu Editorial Desk",
            publishedDate: "2026-09-01",
            layoutSlot: "SIDE_1",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Conservation, environmental pollution and degradation, wildlife protection",
            statistics: [
                "99% crash in Gyps vulture populations due to veterinary diclofenac since the 1990s",
                "Action Plan for Vulture Conservation in India (2020-2025)",
                "Bird flight diverters mandated by Supreme Court in Great Indian Bustard & Vulture priority areas"
            ],
            elements: [
                { id: 3, order: 1, type: "paragraph", content: "India’s vulture populations, slowly recovering from the catastrophic diclofenac-induced crash, face a new existential menace: electrocution from high-voltage transmission networks spanning arid and sanctuary corridors." },
                { id: 4, order: 2, type: "paragraph", content: "Undergrounding power cables and installing reflective bird flight diverters are imperative. The Ministry of Environment, Forest and Climate Change must ensure energy infrastructure expansion does not jeopardize critically endangered avian apex scavengers." }
            ]
        },
        {
            id: 103,
            source: "The Indian Express",
            sourceUrl: "https://indianexpress.com/article/opinion/editorials/us-iran-war-hormuz-military-economic-escalation-10857864/",
            title: "In US vs Iran, all roads lead back to Hormuz",
            subtitle: "Geopolitical flashpoints in West Asia threaten global maritime transit corridors and India's hydrocarbon security.",
            author: "IE Editorial Bureau",
            publishedDate: "2026-09-01",
            layoutSlot: "SIDE_2",
            gsPaper: "GS-2",
            syllabusTopicTitle: "Effect of policies and politics of developed and developing countries on India's interests",
            statistics: [
                "Over 20% of global petroleum liquids transit through the Strait of Hormuz daily",
                "India imports over 85% of its crude oil requirements, heavily reliant on Persian Gulf shipments",
                "Operation SANKALP initiated by Indian Navy for maritime security in the Gulf region"
            ],
            elements: [
                { id: 5, order: 1, type: "paragraph", content: "The Strait of Hormuz remains the world's most critical energy chokepoint. Any escalation between Washington and Tehran that threatens shipping navigation triggers instantaneous supply disruptions and freight insurance spikes." },
                { id: 6, order: 2, type: "paragraph", content: "For New Delhi, preserving unhindered sea lines of communication in the Persian Gulf is essential for macroeconomic stability. India must leverage its diplomatic equities with both West Asian partners to urge de-escalation." }
            ]
        },
        {
            id: 104,
            source: "The Indian Express",
            sourceUrl: "https://indianexpress.com/article/opinion/columns/nepal-did-not-create-today-climate-crisis-floods-august-26-10858356/",
            title: "Nepal did not create today’s climate crisis. Why should it pay the price?",
            subtitle: "Himalayan ecology demands regional transboundary disaster diplomacy and climate finance equity.",
            author: "IE Strategic Column",
            publishedDate: "2026-09-01",
            layoutSlot: "OPED_1",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Disaster and disaster management; Climate Justice & Himalayan Ecology",
            statistics: [
                "Hindu Kush Himalaya holds third largest ice mass on Earth after poles",
                "Loss and Damage Fund operationalized under UNFCCC COP28",
                "Over 200 million people directly reliant on Himalayan river basins for water and agriculture"
            ],
            elements: [
                { id: 7, order: 1, type: "paragraph", content: "The devastating August flash floods across Nepal and downstream Indian states highlight the disproportionate vulnerability of the Himalayan mountain ecology. Mountain communities contribute negligibly to global emissions yet bear catastrophic losses from Glacial Lake Outburst Floods." },
                { id: 8, order: 2, type: "paragraph", content: "Transboundary hydrological data-sharing, joint early warning radar networks, and targeted Loss and Damage climate finance must form the core of South Asian regional resilience." }
            ]
        },
        {
            id: 105,
            source: "MP-IDSA Defence Institute",
            sourceUrl: "https://idsa.in/publisher/issuebrief/diversification-of-the-philippines-strategic-partnerships",
            title: "Diversification of the Philippines’ Strategic Partnerships",
            subtitle: "Manila's Indo-Pacific defense realignment and the strategic significance of India's BrahMos supersonic missile export.",
            author: "MP-IDSA Strategic Brief",
            publishedDate: "2026-09-01",
            layoutSlot: "OPED_2",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Security challenges and their management in border areas; Defence Indigenization & Exports",
            statistics: [
                "$375 million BrahMos shore-based anti-ship missile system contract delivered by India",
                "Philippines Comprehensive Archipelagic Defense Concept (CADC) implementation",
                "India-ASEAN Strategic Comprehensive Partnership and maritime security coordination"
            ],
            elements: [
                { id: 9, order: 1, type: "paragraph", content: "The Philippines is actively modernizing its archipelagic defense posture in the South China Sea through diversified security partnerships with India, Japan, and the United States." },
                { id: 10, order: 2, type: "paragraph", content: "The successful induction of India's BrahMos anti-ship cruise missiles represents a landmark milestone for India's defense manufacturing diplomacy, validating New Delhi as a reliable net security provider in the Indo-Pacific." }
            ]
        },
        {
            id: 106,
            source: "Down To Earth",
            sourceUrl: "https://www.downtoearth.org.in/governance/india-finally-gives-its-wastelands-a-name-and-a-future",
            title: "India finally gives its ‘wastelands’ a name and a future",
            subtitle: "Reclassifying open natural ecosystems (grasslands and savannas) from 'wasteland' to ecologically vital carbon sinks.",
            author: "Down To Earth Governance Desk",
            publishedDate: "2026-09-01",
            layoutSlot: "OPED_3",
            gsPaper: "GS-3",
            syllabusTopicTitle: "Land reforms, ecosystem restoration & environmental governance",
            statistics: [
                "Over 17% of India's geographic area historically classified as colonial 'wastelands'",
                "Grasslands and scrub forests support over 500 million livestock and pastoral livelihoods",
                "Bonn Challenge target: Restoring 26 million hectares of degraded land by 2030"
            ],
            elements: [
                { id: 11, order: 1, type: "paragraph", content: "For over a century, colonial-era revenue categorizations labeled biodiverse grasslands, scrublands, and semi-arid savannas as 'wastelands', paving the way for ecological degradation and inappropriate tree-planting drives." },
                { id: 12, order: 2, type: "paragraph", content: "Recognizing Open Natural Ecosystems (ONEs) as unique biodiversity habitats and pastoral safety nets is crucial for achieving India's land degradation neutrality commitments under UNCCD." }
            ]
        }
    ]
};
