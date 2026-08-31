package com.upsc.editorial.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upsc.editorial.config.GeminiProperties;
import com.upsc.editorial.dto.AiExplainRequest;
import com.upsc.editorial.dto.AiExplainResponse;
import com.upsc.editorial.model.Article;
import com.upsc.editorial.model.ConceptGlossary;
import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.repository.ArticleRepository;
import com.upsc.editorial.repository.GlossaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiAiService {

    private final GeminiProperties geminiProperties;
    private final GlossaryRepository glossaryRepository;
    private final ArticleRepository articleRepository;
    private final EnrichmentService enrichmentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static final String CHIEF_EXAMINER_PROMPT = """
### SYSTEM PERSONA:
You are a Senior UPSC Mains Answer-Writing Mentor and former Joint Secretary, 
calibrated to AIR-1 answer-sheet standards. You have two modes — GENERATE and EVALUATE — 
and must declare which one you are running before output.

### MODE SELECTION (mandatory, state explicitly):
- GENERATE: write a model answer to the PYQ using ARTICLE_FULL_TEXT as source material.
- EVALUATE: score and give feedback on a STUDENT_ANSWER against the PYQ.
If STUDENT_ANSWER is provided, run EVALUATE. Otherwise run GENERATE.

### INPUT CONTEXT:
1. Editorial Context & Real Data: {{ARTICLE_FULL_TEXT}}
2. Target Syllabus Micro-Clause: {{SYLLABUS_CLAUSE}}
3. Target UPSC Mains PYQ: {{PYQ_QUESTION_TEXT}} ({{MARKS}} Marks, {{WORD_LIMIT}} Words)
4. Optional — Student's Draft Answer: {{STUDENT_ANSWER}}

### HARD FACTUAL CONSTRAINT (non-negotiable):
- Every statistic, figure, act, committee name, or institutional citation MUST come 
  verbatim from {{ARTICLE_FULL_TEXT}} or be common, verifiable syllabus knowledge 
  (e.g. Article numbers, well-known Acts). 
- If a needed data point is NOT in the article, write [DATA GAP — verify] instead of 
  inventing a number. Never fabricate a budget figure, percentage, or committee name.
- At the end of output, list every stat/citation used and its source line from the article.

### STRUCTURE — ADAPTIVE TO QUESTION VERB (do not force a fixed template):
Determine the question's command word first:
- "Discuss / Examine" → balanced multi-dimensional analysis, no forced pro/con split.
- "Critically analyze / Evaluate" → explicit strengths-vs-limitations structure.
- "Enumerate / Discuss with examples" → structured list with brief substantiation.
- "Suggest measures / Way forward" → problem framing → prioritized solutions.
Only impose bullet-header structure (Strategic Drivers / Bottlenecks etc.) when the 
verb genuinely calls for a multi-dimensional split. Otherwise use flowing analytical 
prose broken by 1–2 bolded terms, the way real toppers vary structure per question.

### MANDATORY ELEMENTS (apply once, wherever they fit the question — not as forced slots):
1. Opening line anchored to a Constitutional Article / Statutory Act / SC Doctrine / 
   authoritative index — never "In this article..." or "This question deals with...".
2. 2–3 data anchors *only if present in the source text* (see Hard Factual Constraint).
3. Where relevant: one diagram/flowchart suggestion in [DIAGRAM: brief description] 
   format for GS2/GS3 process-heavy answers (15-markers especially).
4. A way-forward citing a real reform body ONLY if it is actually relevant to the 
   question — do not force-fit 2nd ARC or Kasturirangan Committee into unrelated topics.
5. Closing line ties to a genuine national/constitutional aspiration ONLY if it fits 
   naturally — one sentence, not decorative.

### VOCABULARY GUIDANCE (not a mandate):
Precise administrative language is rewarded when accurate to the context — 
use terms like "fiscal devolution," "statutory oversight," "asymmetric vulnerability" 
ONLY where factually applicable. Do not insert bureaucratic buzzwords where they 
don't fit the argument; examiners penalize jargon without substance more than they 
reward its presence.

### WORD LIMIT (hard):
- 10 Marks → 140–150 words
- 15 Marks → 230–250 words
State final word count at the end.

### EVALUATE MODE ADDITIONS (when STUDENT_ANSWER is given):
- Score out of {{MARKS}} using UPSC's actual weightage logic: content accuracy (40%), 
  structure/coherence (25%), value addition — data/diagrams/keywords (20%), 
  presentation/word limit adherence (15%).
- Give 3 specific, actionable line-edits, not generic praise.
- Flag any fabricated or unverifiable claims in the student's answer explicitly.
""";

    public Map<String, Object> generateTopperDossier(Long articleId, String studentAnswer) {
        Optional<Article> opt = articleRepository.findById(articleId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Article not found: " + articleId);
        }

        Article article = opt.get();
        List<Pyq> relatedPyqs = enrichmentService.getRelatedPyqs(article);
        Pyq targetPyq = (!relatedPyqs.isEmpty()) ? relatedPyqs.get(0) : Pyq.builder()
                .year(2024).questionNumber(1).marks(15)
                .questionText("Analyze the structural, policy, and constitutional implications of " + article.getTitle() + ".")
                .build();

        StringBuilder fullText = new StringBuilder();
        if (article.getElements() != null) {
            article.getElements().forEach(e -> fullText.append(e.getContent()).append("\n"));
        }
        if (fullText.length() == 0) {
            fullText.append(article.getTitle()).append(". ").append(article.getSubtitle() != null ? article.getSubtitle() : "");
        }

        String apiKey = geminiProperties.getApiKey();
        boolean hasKey = apiKey != null && !apiKey.isBlank() && apiKey.trim().length() > 10;

        if (hasKey && geminiProperties.isEnabled()) {
            try {
                return callLiveGeminiServer(article, targetPyq, fullText.toString(), studentAnswer, apiKey);
            } catch (Exception e) {
                log.error("[-] Live Gemini API call failed: {}", e.getMessage());
            }
        }

        return generateLocalTopperDossier(article, targetPyq);
    }

    private Map<String, Object> callLiveGeminiServer(Article article, Pyq pyq, String fullText, String studentAnswer, String apiKey) throws Exception {
        String modelName = (geminiProperties.getModel() != null && !geminiProperties.getModel().isBlank()) ? geminiProperties.getModel() : "gemini-1.5-flash";
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        String filledPrompt = CHIEF_EXAMINER_PROMPT
                .replace("{{ARTICLE_FULL_TEXT}}", fullText.length() > 4000 ? fullText.substring(0, 4000) : fullText)
                .replace("{{SYLLABUS_CLAUSE}}", article.getGsPaper() + ": " + (article.getSyllabusTopic() != null ? article.getSyllabusTopic().getTopicTitle() : "Governance"))
                .replace("{{PYQ_QUESTION_TEXT}}", pyq.getQuestionText())
                .replace("{{MARKS}}", String.valueOf(pyq.getMarks()))
                .replace("{{WORD_LIMIT}}", pyq.getMarks() == 10 ? "150 words" : "250 words")
                .replace("{{STUDENT_ANSWER}}", (studentAnswer != null && !studentAnswer.isBlank()) ? studentAnswer : "None provided (Run GENERATE mode)");

        Map<String, Object> reqBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", filledPrompt)))
                )
        );

        String jsonPayload = objectMapper.writeValueAsString(reqBody);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(geminiProperties.getTimeoutSeconds()))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            int promptTokens = root.path("usageMetadata").path("promptTokenCount").asInt(Math.round(filledPrompt.length() / 4.0f));
            int candidateTokens = root.path("usageMetadata").path("candidatesTokenCount").asInt(Math.round(text.length() / 4.0f));

            Map<String, Object> result = new HashMap<>();
            result.put("isLive", true);
            result.put("model", modelName);
            result.put("generatedText", text);
            result.put("promptTokens", promptTokens);
            result.put("candidateTokens", candidateTokens);
            result.put("totalTokens", promptTokens + candidateTokens);
            result.put("estimatedCost", String.format("%.5f", (promptTokens * 0.000000075) + (candidateTokens * 0.00000030)));
            return result;
        } else {
            throw new RuntimeException("Gemini API returned HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private Map<String, Object> generateLocalTopperDossier(Article article, Pyq pyq) {
        int inputTokens = 950;
        int outputTokens = 480;

        Map<String, Object> result = new HashMap<>();
        result.put("isLive", false);
        result.put("model", "local-topper-synthesizer");
        result.put("promptTokens", inputTokens);
        result.put("candidateTokens", outputTokens);
        result.put("totalTokens", inputTokens + outputTokens);
        result.put("estimatedCost", "0.00000");
        result.put("targetPyq", pyq);
        result.put("articleTitle", article.getTitle());
        return result;
    }

    public AiExplainResponse explainSnippet(AiExplainRequest request) {
        return AiExplainResponse.builder()
                .isAiGenerated(false)
                .explanation("Conceptual overview for: " + request.getSelectedText())
                .upscSignificance("High analytical weight for " + (request.getGsPaper() != null ? request.getGsPaper() : "Mains"))
                .keyArguments(List.of("Institutional alignment", "Statutory mandate"))
                .wayForward("Incorporate keyword precision in answers.")
                .build();
    }
}
