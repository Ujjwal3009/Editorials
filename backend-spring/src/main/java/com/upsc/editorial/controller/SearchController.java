package com.upsc.editorial.controller;

import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.service.EnrichmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final EnrichmentService enrichmentService;

    @GetMapping("/hybrid")
    public ResponseEntity<List<Pyq>> hybridSearch(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "ALL") String gsPaper,
            @RequestParam(required = false, defaultValue = "5") int limit) {
        
        List<Pyq> results = enrichmentService.searchPyqsHybrid(query, gsPaper, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/prelims/hybrid")
    public ResponseEntity<List<com.upsc.editorial.model.PrelimsPyq>> searchPrelims(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "ALL") String subject,
            @RequestParam(required = false, defaultValue = "5") int limit) {
        return ResponseEntity.ok(enrichmentService.searchPrelimsHybrid(query, subject, limit));
    }
}
