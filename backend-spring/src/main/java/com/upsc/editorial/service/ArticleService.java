package com.upsc.editorial.service;

import com.upsc.editorial.dto.ArticleDto;
import com.upsc.editorial.dto.IngestRequest;
import com.upsc.editorial.model.Article;
import com.upsc.editorial.model.ArticleElement;
import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final EnrichmentService enrichmentService;

    @Transactional
    public ArticleDto ingestArticle(IngestRequest request) {
        Optional<Article> existing = articleRepository.findBySourceUrl(request.getUrl());
        Article article = existing.orElseGet(() -> Article.builder()
                .source(request.getSource())
                .sourceUrl(request.getUrl())
                .build());

        article.setTitle(request.getTitle());
        article.setSubtitle(request.getSubtitle());
        article.setAuthor(request.getAuthor() != null ? request.getAuthor() : "Editorial Desk");
        article.setPublishedDate(request.getPublishedDate() != null ? request.getPublishedDate() : LocalDate.now());
        article.setLayoutSlot(request.getLayoutSlot() != null ? request.getLayoutSlot() : "LEAD");

        // Elements
        if (article.getElements() == null) { article.setElements(new ArrayList<>()); } else { article.getElements().clear(); }
        if (request.getElements() != null) {
            int seq = 1;
            for (IngestRequest.ElementDto elemDto : request.getElements()) {
                ArticleElement element = ArticleElement.builder()
                        .article(article)
                        .sequenceOrder(seq++)
                        .elementType(elemDto.getType() != null ? elemDto.getType() : "paragraph")
                        .content(elemDto.getText())
                        .build();
                article.getElements().add(element);
            }
        }

        // Enrich with GS paper & PYQs
        String fullText = request.getFullText() != null ? request.getFullText() : "";
        enrichmentService.enrichArticleHeuristically(article, fullText);

        Article saved = articleRepository.save(article);
        return mapToDto(saved);
    }

    /**
     * Retrieves the smart composite edition:
     * - Newspapers (The Hindu, Indian Express): STRICTLY for the selected date.
     * - Think Tanks & Research (ORF, MP-IDSA, Down To Earth, PIB): LATEST 5 active articles up to selected date.
     */
    public List<ArticleDto> getTodayEditorials(LocalDate date) {
        if (date == null) {
            return articleRepository.findAllByOrderByPublishedDateDesc().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        List<Article> allArticles = articleRepository.findAllByOrderByPublishedDateDesc();
        List<Article> result = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();

        // 1. Newspapers (The Hindu & Indian Express) - Strictly on this date
        allArticles.stream()
                .filter(a -> (a.getSource().contains("Hindu") || a.getSource().contains("Express")))
                .filter(a -> a.getPublishedDate().equals(date))
                .forEach(a -> {
                    if (seenIds.add(a.getId())) result.add(a);
                });

        // 2. Think Tanks & Research Outlets - Rolling Latest 5 Active Articles (publishedDate <= date)
        List<String> researchSources = Arrays.asList(
                "Observer Research Foundation",
                "MP-IDSA Defence Institute",
                "Down To Earth",
                "InsightsIAS"
        );

        for (String sourceKeyword : researchSources) {
            allArticles.stream()
                    .filter(a -> a.getSource().contains(sourceKeyword) || (sourceKeyword.equals("InsightsIAS") && a.getSource().contains("PIB")))
                    .filter(a -> !a.getPublishedDate().isAfter(date))
                    .sorted(Comparator.comparing(Article::getPublishedDate).reversed())
                    .limit(5)
                    .forEach(a -> {
                        if (seenIds.add(a.getId())) result.add(a);
                    });
        }

        // Return mapped DTOs sorted so LEAD is first, then Newspapers, then Think Tanks
        return result.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteArticleById(Long id) {
        articleRepository.deleteById(id);
    }

    @Transactional
    public void deleteAllArticles() {
        articleRepository.deleteAll();
    }

    public Optional<ArticleDto> getArticleById(Long id) {
        return articleRepository.findById(id).map(this::mapToDto);
    }

    public List<ArticleDto> getArticlesByGsPaper(String gsPaper) {
        return articleRepository.findByGsPaperOrderByPublishedDateDesc(gsPaper).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ArticleDto mapToDto(Article article) {
        List<Pyq> relatedPyqs = enrichmentService.getRelatedPyqs(article);
        
        List<ArticleDto.PyqDto> pyqDtos = relatedPyqs.stream().map(p -> ArticleDto.PyqDto.builder()
                .id(p.getId())
                .gsPaper(p.getGsPaper())
                .year(p.getYear())
                .questionNumber(p.getQuestionNumber())
                .marks(p.getMarks())
                .questionText(p.getQuestionText())
                .modelApproachHints(p.getModelApproachHints())
                .build()
        ).collect(Collectors.toList());

        List<ArticleDto.ElementDto> elementDtos = article.getElements().stream().map(e -> ArticleDto.ElementDto.builder()
                .id(e.getId())
                .order(e.getSequenceOrder())
                .type(e.getElementType())
                .content(e.getContent())
                .build()
        ).collect(Collectors.toList());

        return ArticleDto.builder()
                .id(article.getId())
                .source(article.getSource())
                .sourceUrl(article.getSourceUrl())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .author(article.getAuthor())
                .publishedDate(article.getPublishedDate())
                .layoutSlot(article.getLayoutSlot())
                .gsPaper(article.getGsPaper())
                .syllabusTopicCode(article.getSyllabusTopic() != null ? article.getSyllabusTopic().getTopicCode() : null)
                .syllabusTopicTitle(article.getSyllabusTopic() != null ? article.getSyllabusTopic().getTopicTitle() : null)
                .keyTakeaways(article.getKeyTakeaways())
                .statistics(article.getStatistics())
                .committeesCited(article.getCommitteesCited())
                .elements(elementDtos)
                .relatedPyqs(pyqDtos)
                .build();
    }
}
