package com.upsc.editorial.controller;

import com.upsc.editorial.dto.ArticleDto;
import com.upsc.editorial.dto.IngestRequest;
import com.upsc.editorial.model.Article;
import com.upsc.editorial.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping
    public ResponseEntity<List<ArticleDto>> getArticles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String gsPaper) {
        if (gsPaper != null && !gsPaper.isBlank()) {
            return ResponseEntity.ok(articleService.getArticlesByGsPaper(gsPaper));
        }
        return ResponseEntity.ok(articleService.getTodayEditorials(date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleDto> getArticleById(@PathVariable Long id) {
        return articleService.getArticleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticleById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllArticles() {
        articleService.deleteAllArticles();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ingest")
    public ResponseEntity<ArticleDto> ingestArticle(@RequestBody IngestRequest request) {
        ArticleDto saved = articleService.ingestArticle(request);
        return ResponseEntity.ok(saved);
    }
}
