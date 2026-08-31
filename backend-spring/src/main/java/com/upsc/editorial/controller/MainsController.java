package com.upsc.editorial.controller;

import com.upsc.editorial.model.ConceptGlossary;
import com.upsc.editorial.model.Pyq;
import com.upsc.editorial.model.SyllabusTopic;
import com.upsc.editorial.repository.GlossaryRepository;
import com.upsc.editorial.repository.PyqRepository;
import com.upsc.editorial.repository.SyllabusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mains")
@RequiredArgsConstructor
public class MainsController {

    private final SyllabusRepository syllabusRepository;
    private final PyqRepository pyqRepository;
    private final GlossaryRepository glossaryRepository;

    @GetMapping("/syllabus")
    public ResponseEntity<List<SyllabusTopic>> getSyllabus(@RequestParam(required = false) String gsPaper) {
        if (gsPaper != null && !gsPaper.isBlank()) {
            return ResponseEntity.ok(syllabusRepository.findByGsPaper(gsPaper));
        }
        return ResponseEntity.ok(syllabusRepository.findAll());
    }

    @GetMapping("/pyqs")
    public ResponseEntity<List<Pyq>> getPyqs(@RequestParam(required = false) String gsPaper) {
        if (gsPaper != null && !gsPaper.isBlank()) {
            return ResponseEntity.ok(pyqRepository.findByGsPaperOrderByYearDesc(gsPaper));
        }
        return ResponseEntity.ok(pyqRepository.findAll());
    }

    @GetMapping("/glossary")
    public ResponseEntity<List<ConceptGlossary>> getGlossary() {
        return ResponseEntity.ok(glossaryRepository.findAll());
    }

    @GetMapping("/glossary/{term}")
    public ResponseEntity<ConceptGlossary> getGlossaryTerm(@PathVariable String term) {
        return glossaryRepository.findByTermIgnoreCase(term)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
