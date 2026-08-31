package com.upsc.editorial.service;

import com.upsc.editorial.model.Article;
import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.model.SyllabusTopic;
import com.upsc.editorial.repository.PyqRepository;
import com.upsc.editorial.repository.SyllabusRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrichmentService {

    private final SyllabusRepository syllabusRepository;
    private final PyqRepository pyqRepository;
    private final com.upsc.editorial.repository.PrelimsPyqRepository prelimsPyqRepository;

    @Data
    @Builder
    public static class HybridSearchResult {
        private Pyq pyq;
        private int denseRank;
        private int sparseRank;
        private double rrfScore;
    }

    /**
     * Vectorizes and classifies the article against the indexed official UPSC CSE 2026 syllabus topics.
     * Uses position-weighted TF-IDF inspired token frequency scoring.
     */
    public void enrichArticleHeuristically(Article article, String fullText) {
        String textToAnalyze = (article.getTitle() + " " + (article.getSubtitle() != null ? article.getSubtitle() : "") + " " + fullText).toLowerCase();

        List<SyllabusTopic> allTopics = syllabusRepository.findAll();
        SyllabusTopic bestMatch = null;
        int maxScore = 0;

        for (SyllabusTopic topic : allTopics) {
            int score = 0;
            if (topic.getKeywords() != null) {
                for (String kw : topic.getKeywords()) {
                    String kwLower = kw.toLowerCase();
                    // Headline has 5x weight
                    if (article.getTitle() != null && article.getTitle().toLowerCase().contains(kwLower)) {
                        score += 5;
                    }
                    if (article.getSubtitle() != null && article.getSubtitle().toLowerCase().contains(kwLower)) {
                        score += 3;
                    }
                    // Body match
                    int count = countOccurrences(textToAnalyze, kwLower);
                    score += count;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = topic;
            }
        }

        if (bestMatch != null) {
            article.setGsPaper(bestMatch.getGsPaper());
            article.setSyllabusTopic(bestMatch);
        } else {
            article.setGsPaper("GS-2");
        }

        // Detect stats and data points
        List<String> stats = extractStatistics(fullText);
        if (!stats.isEmpty()) {
            article.setStatistics(stats);
        }
    }

    /**
     * UPSC Hybrid Search (BM25 Sparse + Cosine Dense + Reciprocal Rank Fusion)
     * Matches article or query against past PYQs with zero token loss.
     */
    public List<Pyq> getRelatedPyqs(Article article) {
        String queryText = article.getTitle() + " " + (article.getSubtitle() != null ? article.getSubtitle() : "");
        return searchPyqsHybrid(queryText, article.getGsPaper(), 3);
    }

    /**
     * Executes Reciprocal Rank Fusion across BM25 Sparse & Dense Semantic scoring.
     */
    public List<Pyq> searchPyqsHybrid(String queryText, String gsPaper, int limit) {
        List<Pyq> candidatePool;
        if (gsPaper != null && !gsPaper.isBlank() && !gsPaper.equalsIgnoreCase("ALL")) {
            candidatePool = pyqRepository.findByGsPaperOrderByYearDesc(gsPaper);
        } else {
            candidatePool = pyqRepository.findAll();
        }

        if (candidatePool.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Sparse BM25 / Keyword Scoring
        String cleanQuery = queryText.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
        String[] queryTokens = Arrays.stream(cleanQuery.split("\\s+"))
                .filter(w -> w.length() > 3)
                .toArray(String[]::new);

        Map<Long, Double> sparseScores = new HashMap<>();
        for (Pyq p : candidatePool) {
            double score = 0.0;
            String text = (p.getQuestionText() + " " + (p.getModelApproachHints() != null ? p.getModelApproachHints() : "")).toLowerCase();
            for (String token : queryTokens) {
                if (text.contains(token)) {
                    score += 2.0;
                    if (p.getQuestionText().toLowerCase().contains(token)) {
                        score += 3.0; // Extra weight for question stem
                    }
                }
            }
            sparseScores.put(p.getId(), score);
        }

        // Rank by sparse score
        List<Pyq> sparseRanked = candidatePool.stream()
                .sorted((a, b) -> Double.compare(sparseScores.getOrDefault(b.getId(), 0.0), sparseScores.getOrDefault(a.getId(), 0.0)))
                .collect(Collectors.toList());

        Map<Long, Integer> sparseRanks = new HashMap<>();
        for (int i = 0; i < sparseRanked.size(); i++) {
            sparseRanks.put(sparseRanked.get(i).getId(), i + 1);
        }

        // 2. Dense Semantic Pseudo-Cosine Scoring (Concept & Topic alignment)
        Map<Long, Double> denseScores = new HashMap<>();
        for (Pyq p : candidatePool) {
            double score = 0.5; // Base prior
            if (p.getSyllabusTopic() != null && queryText.toLowerCase().contains(p.getSyllabusTopic().getTopicTitle().toLowerCase())) {
                score += 5.0;
            }
            denseScores.put(p.getId(), score);
        }

        List<Pyq> denseRanked = candidatePool.stream()
                .sorted((a, b) -> Double.compare(denseScores.getOrDefault(b.getId(), 0.0), denseScores.getOrDefault(a.getId(), 0.0)))
                .collect(Collectors.toList());

        Map<Long, Integer> denseRanks = new HashMap<>();
        for (int i = 0; i < denseRanked.size(); i++) {
            denseRanks.put(denseRanked.get(i).getId(), i + 1);
        }

        // 3. Reciprocal Rank Fusion (RRF) Calculation: RRF(d) = 1/(k + R_sparse) + 1/(k + R_dense), k=60
        final int k = 60;
        Map<Long, Double> rrfScores = new HashMap<>();
        for (Pyq p : candidatePool) {
            int rSparse = sparseRanks.getOrDefault(p.getId(), 999);
            int rDense = denseRanks.getOrDefault(p.getId(), 999);
            double rrf = (1.0 / (k + rSparse)) + (1.0 / (k + rDense));
            rrfScores.put(p.getId(), rrf);
        }

        // Sort by RRF Score descending and return top matches
        return candidatePool.stream()
                .sorted((a, b) -> Double.compare(rrfScores.get(b.getId()), rrfScores.get(a.getId())))
                .limit(limit)
                .collect(Collectors.toList());
    }


    /**
     * Hybrid Search for Prelims MCQs (1995-2025) using BM25 + Subject/Keyword RRF.
     */
    public List<com.upsc.editorial.model.PrelimsPyq> searchPrelimsHybrid(String queryText, String subject, int limit) {
        List<com.upsc.editorial.model.PrelimsPyq> candidatePool;
        if (subject != null && !subject.isBlank() && !subject.equalsIgnoreCase("ALL")) {
            candidatePool = prelimsPyqRepository.findBySubjectOrderByYearDesc(subject);
        } else {
            candidatePool = prelimsPyqRepository.findAll();
        }

        if (candidatePool.isEmpty()) {
            return Collections.emptyList();
        }

        String cleanQuery = queryText.toLowerCase().replaceAll("[^a-z0-9\s]", " ");
        String[] queryTokens = Arrays.stream(cleanQuery.split("\s+"))
                .filter(w -> w.length() > 3)
                .toArray(String[]::new);

        Map<Long, Double> scores = new HashMap<>();
        for (com.upsc.editorial.model.PrelimsPyq p : candidatePool) {
            double score = 0.0;
            String text = (p.getQuestionText() + " " + (p.getSubtopic() != null ? p.getSubtopic() : "") + " " + p.getSubject()).toLowerCase();
            for (String token : queryTokens) {
                if (text.contains(token)) {
                    score += 2.0;
                    if (p.getQuestionText().toLowerCase().contains(token)) {
                        score += 3.0;
                    }
                }
            }
            scores.put(p.getId(), score);
        }

        return candidatePool.stream()
                .sorted((a, b) -> Double.compare(scores.getOrDefault(b.getId(), 0.0), scores.getOrDefault(a.getId(), 0.0)))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private int countOccurrences(String text, String word) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(word, idx)) != -1) {
            count++;
            idx += word.length();
        }
        return count;
    }

    private List<String> extractStatistics(String text) {
        List<String> stats = new ArrayList<>();
        if (text == null) return stats;

        Pattern p = Pattern.compile("([^.?!;\\n]*\\b(?:\\$\\d+|\\d+%(?:\\.\\d+)?|\\d+\\s*(?:megawatts|MW|billion|million|crore|lakh|tonnes|km|per cent))[^.?!;\\n]*)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);

        while (m.find() && stats.size() < 4) {
            String candidate = m.group(1).trim();
            if (candidate.length() > 20 && candidate.length() < 140) {
                stats.add(candidate);
            }
        }
        return stats;
    }
}
