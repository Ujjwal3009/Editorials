package com.upsc.editorial.config;

import com.upsc.editorial.model.Article;
import com.upsc.editorial.model.ArticleElement;
import com.upsc.editorial.model.ConceptGlossary;
import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.model.SyllabusTopic;
import com.upsc.editorial.repository.ArticleRepository;
import com.upsc.editorial.repository.GlossaryRepository;
import com.upsc.editorial.repository.PyqRepository;
import com.upsc.editorial.repository.SyllabusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SyllabusRepository syllabusRepository;
    private final PyqRepository pyqRepository;
    private final GlossaryRepository glossaryRepository;
    private final ArticleRepository articleRepository;
    private final com.upsc.editorial.repository.PrelimsPyqRepository prelimsPyqRepository;

    @Override
    public void run(String... args) {


        if (pyqRepository.count() < 900) {
            log.info("[*] Seeding 939 Complete 13-Year UPSC Mains PYQs (2013-2025)...");
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper().configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                java.io.InputStream is = getClass().getResourceAsStream("/mains_pyqs_all.json");
                if (is != null) {
                    List<com.upsc.editorial.model.Pyq> list = mapper.readValue(is, new com.fasterxml.jackson.core.type.TypeReference<List<com.upsc.editorial.model.Pyq>>() {});
                    pyqRepository.saveAll(list);
                    log.info("[+] Successfully seeded {} 13-Year Mains PYQs!", list.size());
                }
            } catch (Exception e) {
                log.error("[-] Error seeding Mains PYQs: {}", e.getMessage());
            }
        }

        if (prelimsPyqRepository.count() == 0) {
            log.info("[*] Seeding 3,897 Complete UPSC Prelims PYQs (1995-2025)...");
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper().configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                java.io.InputStream is = getClass().getResourceAsStream("/prelims_pyqs_all.json");
                if (is != null) {
                    List<com.upsc.editorial.model.PrelimsPyq> list = mapper.readValue(is, new com.fasterxml.jackson.core.type.TypeReference<List<com.upsc.editorial.model.PrelimsPyq>>() {});
                    prelimsPyqRepository.saveAll(list);
                    log.info("[+] Successfully seeded {} Prelims PYQs!", list.size());
                }
            } catch (Exception e) {
                log.error("[-] Error seeding Prelims PYQs: {}", e.getMessage());
            }
        }

        if (syllabusRepository.count() < 10) {
            log.info("[*] Indexing Full Official UPSC CSE 2026 Notification Syllabus & Mains PYQs...");

            List<SyllabusTopic> topics = new ArrayList<>();

            // ==========================================
            // GS-1: HERITAGE, HISTORY, SOCIETY & GEOGRAPHY
            // ==========================================
            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-1").subject("Indian Culture").topicCode("GS1_CULTURE")
                    .topicTitle("Indian culture will cover the salient aspects of Art Forms, literature and Architecture from ancient to modern times")
                    .keywords(Arrays.asList("art", "architecture", "sculpture", "temple", "monuments", "literature", "buddhism", "jainism", "bhakti", "sufi", "classical dance", "unesco", "heritage"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-1").subject("Modern History").topicCode("GS1_MOD_HIST")
                    .topicTitle("Modern Indian history from about the middle of the eighteenth century until the present - significant events, personalities, issues")
                    .keywords(Arrays.asList("colonial", "british raj", "1857", "east india company", "governor general", "viceroy", "revolt", "plassey", "buxar", "swadeshi", "land revenue", "ryotwari"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-1").subject("Indian Society").topicCode("GS1_SOCIETY")
                    .topicTitle("Salient features of Indian Society, Diversity of India; Role of women and women’s organization, population, poverty, urbanization")
                    .keywords(Arrays.asList("caste", "communalism", "secularism", "urbanization", "women empowerment", "patriarchy", "slums", "diversity", "regionalism", "fertility", "demography"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-1").subject("Physical Geography").topicCode("GS1_PHYSICAL_GEO")
                    .topicTitle("Important Geophysical phenomena such as earthquakes, Tsunami, Volcanic activity, cyclone, changes in critical geographical features")
                    .keywords(Arrays.asList("earthquake", "cyclone", "tsunami", "glacier", "ice-caps", "monsoon", "el nino", "la nina", "volcano", "plate tectonics", "river basin", "himalayan ecology"))
                    .build());

            // ==========================================
            // GS-2: GOVERNANCE, CONSTITUTION, POLITY & IR
            // ==========================================
            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-2").subject("Constitution & Polity").topicCode("GS2_CONST_POLITY")
                    .topicTitle("Indian Constitution—historical underpinnings, evolution, features, amendments, significant provisions, basic structure, separation of powers")
                    .keywords(Arrays.asList("constitution", "fundamental rights", "dpsp", "basic structure", "preamble", "amendment", "article 21", "article 19", "judicial review", "separation of powers", "ordinance"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-2").subject("Federalism & Governance").topicCode("GS2_FEDERALISM")
                    .topicTitle("Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure, devolution of powers")
                    .keywords(Arrays.asList("federalism", "centre-state", "governor", "inter-state", "finance commission", "gst council", "panchayati raj", "73rd amendment", "74th amendment", "local governance"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-2").subject("Social Justice & Welfare").topicCode("GS2_SOCIAL_JUSTICE")
                    .topicTitle("Welfare schemes for vulnerable sections by Centre and States; Issues relating to development and management of Health, Education, Human Resources, Poverty and hunger")
                    .keywords(Arrays.asList("welfare", "vulnerable sections", "sc/st", "minorities", "health", "education", "poverty", "malnutrition", "human resources", "national health policy", "poshan", "nhrc"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-2").subject("International Relations").topicCode("GS2_IR_BILATERAL")
                    .topicTitle("Bilateral, regional and global groupings and agreements involving India and/or affecting India’s interests; India and its neighborhood")
                    .keywords(Arrays.asList("geopolitics", "china", "nepal", "usa", "pakistan", "quad", "brics", "sco", "diplomacy", "border", "cross-border", "treaty", "strategic autonomy", "instc", "indo-pacific", "global south"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-2").subject("Global Institutions").topicCode("GS2_INTERNATIONAL_INST")
                    .topicTitle("Important International institutions, agencies and fora - their structure, mandate; Effect of policies of developed countries on India's interests")
                    .keywords(Arrays.asList("united nations", "unsc", "wto", "who", "imf", "world bank", "multilateralism", "sanctions", "trade war", "eu", "nato", "g20", "g7"))
                    .build());

            // ==========================================
            // GS-3: ECONOMY, S&T, ENVIRONMENT & SECURITY
            // ==========================================
            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-3").subject("Indian Economy").topicCode("GS3_ECONOMY")
                    .topicTitle("Indian Economy and issues relating to planning, mobilization of resources, growth, development, employment, inclusive growth, Government Budgeting")
                    .keywords(Arrays.asList("economy", "gdp", "growth", "inflation", "rbi", "monetary policy", "fiscal deficit", "budget", "taxation", "banking", "npa", "fdi", "manufacturing", "employment"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-3").subject("Agriculture").topicCode("GS3_AGRICULTURE")
                    .topicTitle("Major crops-cropping patterns, irrigation, storage, transport, marketing of agricultural produce; farm subsidies, MSP, PDS, food security")
                    .keywords(Arrays.asList("agriculture", "farmer", "msp", "pds", "food security", "irrigation", "drip irrigation", "fertilizer subsidy", "pm-kisan", "crop insurance", "buffer stock", "fci"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-3").subject("Science & Technology").topicCode("GS3_TECH_SPACE")
                    .topicTitle("Science and Technology- developments and applications; Awareness in IT, Space, Computers, robotics, nano-technology, bio-technology, IPR")
                    .keywords(Arrays.asList("space", "rocket", "isro", "satellite", "spacex", "orbit", "low-earth orbit", "ai", "artificial intelligence", "semiconductor", "biotechnology", "gene editing", "lifi", "li-fi", "optical wireless", "military communications", "defence technology", "crispr", "quantum", "ipr"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-3").subject("Disaster Management").topicCode("GS3_DISASTER_MGMT")
                    .topicTitle("Disaster and disaster management; Climate change impacts, conservation, environmental pollution, degradation, EIA")
                    .keywords(Arrays.asList("disaster", "floods", "glacier", "glof", "earthquake", "landslide", "ndma", "ndrf", "early warning", "sendai framework", "pollution", "air quality", "climate change", "biodiversity", "eia"))
                    .build());

            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-3").subject("Internal Security").topicCode("GS3_INTERNAL_SEC")
                    .topicTitle("Linkages between development and spread of extremism; Challenges to internal security through communication networks, cyber security, money-laundering, border management")
                    .keywords(Arrays.asList("security", "cyber security", "money laundering", "military communications", "defence", "armed forces", "terrorism", "border security", "bsf", "extremism", "left wing extremism", "naxalism", "coastal security", "drone warfare"))
                    .build());

            // ==========================================
            // GS-4: ETHICS, INTEGRITY & APTITUDE
            // ==========================================
            topics.add(SyllabusTopic.builder()
                    .gsPaper("GS-4").subject("Ethics & Values").topicCode("GS4_ETHICS_PUBLIC")
                    .topicTitle("Public/Civil service values and Ethics in Public administration: status and problems, ethical dilemmas, accountability, probity in governance, RTI, citizen charters, anti-corruption")
                    .keywords(Arrays.asList("ethics", "integrity", "impartiality", "probity", "corruption", "rti", "citizen charter", "conflict of interest", "moral dilemma", "emotional intelligence", "code of conduct", "empathy"))
                    .build());

            for (SyllabusTopic topic : topics) {
                if (syllabusRepository.findByTopicCode(topic.getTopicCode()).isEmpty()) {
                    syllabusRepository.save(topic);
                }
            }

            // ==========================================
            // MAINS PYQS (2013-2025)
            // ==========================================
            SyllabusTopic spaceTop = syllabusRepository.findByTopicCode("GS3_TECH_SPACE").orElse(topics.get(11));
            SyllabusTopic disasterTop = syllabusRepository.findByTopicCode("GS3_DISASTER_MGMT").orElse(topics.get(12));
            SyllabusTopic irTop = syllabusRepository.findByTopicCode("GS2_IR_BILATERAL").orElse(topics.get(7));
            SyllabusTopic fedTop = syllabusRepository.findByTopicCode("GS2_FEDERALISM").orElse(topics.get(5));
            SyllabusTopic ethicsTop = syllabusRepository.findByTopicCode("GS4_ETHICS_PUBLIC").orElse(topics.get(14));

            List<Pyq> pyqs = Arrays.asList(
                    Pyq.builder().gsPaper("GS-3").year(2023).questionNumber(14).marks(15).syllabusTopic(spaceTop)
                            .questionText("What is the main task of India’s third moon mission? Discuss how this mission elevates India’s standing in global space commerce and commercial satellite launches.")
                            .modelApproachHints("1. Intro: Chandrayaan-3 lunar south pole achievement. 2. Technological objectives. 3. Commercial benefits: IN-SPACe scaling and cost undercutting.").build(),

                    Pyq.builder().gsPaper("GS-3").year(2024).questionNumber(16).marks(15).syllabusTopic(disasterTop)
                            .questionText("Dam bursts and glacial lake outburst floods (GLOFs) pose an acute threat to the fragile Himalayan ecosystem. Analyze the institutional and technological preparedness required.")
                            .modelApproachHints("1. Causes: Climate warming, seismic vulnerability. 2. Preparedness: Automated weather stations, cross-border telemetry. 3. Sendai Framework.").build(),

                    Pyq.builder().gsPaper("GS-2").year(2023).questionNumber(18).marks(15).syllabusTopic(irTop)
                            .questionText("The geopolitical contestations in South Asia necessitate that India reorients its Neighbourhood First policy into actionable regional connectivity and disaster diplomacy. Critically examine.")
                            .modelApproachHints("1. Neighbourhood First rationale. 2. Disaster diplomacy as a soft power tool (HADR operations). 3. Institutional mechanisms (BIMSTEC, BBIN).").build(),

                    Pyq.builder().gsPaper("GS-2").year(2022).questionNumber(4).marks(10).syllabusTopic(fedTop)
                            .questionText("Discuss the role of the Finance Commission in maintaining fiscal federalism in India amidst growing disparities in revenue mobilization.")
                            .modelApproachHints("1. Article 280 mandate. 2. Vertical vs Horizontal devolution. 3. Performance-based incentives and cess/surcharge concerns.").build(),

                    Pyq.builder().gsPaper("GS-4").year(2023).questionNumber(7).marks(10).syllabusTopic(ethicsTop)
                            .questionText("‘Probity in governance is not merely absence of corruption, but active adherence to transparency, ethical courage, and citizen welfare.’ Elucidate with suitable examples.")
                            .modelApproachHints("1. Define probity beyond negative non-corruption. 2. Positive duties: RTI proactively, whistleblower protection. 3. Example of upright civil servants.").build()
            );

            if (pyqRepository.count() < 5) {
                pyqRepository.saveAll(pyqs);
            }

            // ==========================================
            // HIGH-YIELD CONCEPT GLOSSARY
            // ==========================================
            List<ConceptGlossary> glossaries = Arrays.asList(
                    ConceptGlossary.builder().term("Strategic Autonomy").category("International Relations")
                            .definition("A state capability to pursue national interest and foreign policy independently without coercive alignment.")
                            .upscContext("Key doctrine of India’s foreign policy balancing multi-alignment across US, Russia, and the Global South.")
                            .relatedGsPaper("GS-2").synonyms(Arrays.asList("Multi-alignment", "Strategic Hedging")).build(),

                    ConceptGlossary.builder().term("Low-Earth Orbit").category("Space & Tech")
                            .definition("An Earth-centered orbit with an altitude between 160 km and 2,000 km, optimal for communication constellations and earth observation.")
                            .upscContext("Crucial for Space 2.0 commercial satellite constellations, LEO broadband, and ISRO commercialization.")
                            .relatedGsPaper("GS-3").synonyms(Arrays.asList("LEO")).build(),

                    ConceptGlossary.builder().term("Glacial Lake Outburst Flood").category("Environment & Disaster")
                            .definition("A catastrophic release of water from a glacial lake dammed by unstable moraines, triggered by avalanches or seismic activity.")
                            .upscContext("Central to Himalayan disaster resilience, NDMA guidelines, and automated early warning systems.")
                            .relatedGsPaper("GS-3").synonyms(Arrays.asList("GLOF")).build(),

                    ConceptGlossary.builder().term("Fiscal Federalism").category("Polity & Governance")
                            .definition("The division of governmental functions and financial relations among tiers of state and union government.")
                            .upscContext("Key topic for GS-2/GS-3 involving Article 280 Finance Commission, GST Council, and tax devolution.")
                            .relatedGsPaper("GS-2").synonyms(Arrays.asList("Cooperative Federalism")).build(),

                    ConceptGlossary.builder().term("Basic Structure Doctrine").category("Polity & Constitution")
                            .definition("Judicial principle established in Kesavananda Bharati (1973) stating Parliament cannot alter core constitution features.")
                            .upscContext("Fundamental pillar of Indian constitutional law ensuring judicial review, federalism, and rule of law.")
                            .relatedGsPaper("GS-2").synonyms(Arrays.asList("Basic Structure")).build()
            );

            for (ConceptGlossary g : glossaries) {
                if (glossaryRepository.findByTerm(g.getTerm()).isEmpty()) {
                    glossaryRepository.save(g);
                }
            }
            log.info("[+] Successfully indexed " + syllabusRepository.count() + " syllabus micro-topics, " + pyqRepository.count() + " PYQs, and " + glossaryRepository.count() + " glossary terms.");
        }
    }
}
