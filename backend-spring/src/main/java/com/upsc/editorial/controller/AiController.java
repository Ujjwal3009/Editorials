package com.upsc.editorial.controller;

import com.upsc.editorial.dto.AiExplainRequest;
import com.upsc.editorial.dto.AiExplainResponse;
import com.upsc.editorial.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiAiService geminiAiService;

    @PostMapping("/explain")
    public ResponseEntity<AiExplainResponse> explainSelection(@RequestBody AiExplainRequest request) {
        return ResponseEntity.ok(geminiAiService.explainSnippet(request));
    }
}
