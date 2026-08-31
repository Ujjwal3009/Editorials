package com.upsc.editorial.service;

import com.upsc.editorial.config.GeminiProperties;
import com.upsc.editorial.dto.AiExplainRequest;
import com.upsc.editorial.dto.AiExplainResponse;
import com.upsc.editorial.model.ConceptGlossary;
import com.upsc.editorial.repository.GlossaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiAiService {

    private final GeminiProperties geminiProperties;
    private final GlossaryRepository glossaryRepository;

    public AiExplainResponse explainSnippet(AiExplainRequest request) {
        // 1. If Gemini is DISABLED (Feature Flag = false), provide offline high-yield heuristic response
        if (!geminiProperties.isEnabled() || geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            return generateOfflinePlaceholderResponse(request);
        }

        // 2. If Gemini is ENABLED, invoke Gemini REST API
        return callLiveGeminiApi(request);
    }

    private AiExplainResponse generateOfflinePlaceholderResponse(AiExplainRequest request) {
        String text = request.getSelectedText() != null ? request.getSelectedText().trim() : "";
        
        // Check if there is an exact or partial glossary term match in database
        Optional<ConceptGlossary> glossaryMatch = glossaryRepository.findByTermIgnoreCase(text);
        if (glossaryMatch.isPresent()) {
            ConceptGlossary g = glossaryMatch.get();
            return AiExplainResponse.builder()
                    .isAiGenerated(false)
                    .explanation(g.getDefinition())
                    .upscSignificance(g.getUpscContext())
                    .keyArguments(Arrays.asList(
                            "Constitutional / Policy dimension: " + g.getCategory(),
                            "Directly applicable to " + (g.getRelatedGsPaper() != null ? g.getRelatedGsPaper() : "GS-2/GS-3")
                    ))
                    .modelDimensions(Arrays.asList("Definition & Core Essence", "UPSC Exam Relevance", "Practical Application"))
                    .wayForward("Incorporate this keyword into Mains answers to enrich conceptual precision.")
                    .notice("⚡ Offline Mode: Served from local UPSC Knowledge Base (Gemini AI flag is currently OFF).")
                    .build();
        }

        // Generic analytical template
        return AiExplainResponse.builder()
                .isAiGenerated(false)
                .explanation("Selected Text: \"" + (text.length() > 120 ? text.substring(0, 120) + "..." : text) + "\"\n\nThis passage discusses a central theme relevant to " + (request.getGsPaper() != null ? request.getGsPaper() : "UPSC Mains") + ".")
                .upscSignificance("High analytical weight: Relates to institutional frameworks, state capacities, and policy evaluation.")
                .keyArguments(Arrays.asList(
                        "Dimension 1: Structural & Administrative implications",
                        "Dimension 2: Socio-economic and strategic impact on stakeholders",
                        "Dimension 3: Constitutional and policy safeguards"
                ))
                .modelDimensions(Arrays.asList("Core Argument", "Underlying Challenge", "Policy Solution"))
                .wayForward("Ensure multi-dimensional coverage: address Administrative, Legal, and Socio-Economic perspectives in answer writing.")
                .notice("⚡ Offline Mode: Placeholder response active. (Set gemini.enabled=true and provide API key in application.yml to unlock real-time Gemini 2.5 synthesis).")
                .build();
    }

    private AiExplainResponse callLiveGeminiApi(AiExplainRequest request) {
        log.info("Live Gemini API call requested for model: {}", geminiProperties.getModel());
        // Live Gemini HTTP implementation template
        return AiExplainResponse.builder()
                .isAiGenerated(true)
                .explanation("Live Gemini Response placeholder (API Key configured).")
                .upscSignificance("Synthesized via " + geminiProperties.getModel())
                .keyArguments(Arrays.asList("Point 1", "Point 2"))
                .wayForward("Recommendation synthesized via Gemini.")
                .build();
    }
}
