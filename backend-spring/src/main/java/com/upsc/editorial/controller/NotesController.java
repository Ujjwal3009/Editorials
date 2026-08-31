package com.upsc.editorial.controller;

import com.upsc.editorial.dto.UserNoteRequest;
import com.upsc.editorial.model.UserNote;
import com.upsc.editorial.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NoteRepository noteRepository;

    @GetMapping
    public ResponseEntity<List<UserNote>> getNotes(@RequestParam(required = false) Long articleId) {
        if (articleId != null) {
            return ResponseEntity.ok(noteRepository.findByArticleIdOrderByCreatedAtDesc(articleId));
        }
        return ResponseEntity.ok(noteRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<UserNote> createNote(@RequestBody UserNoteRequest request) {
        UserNote note = UserNote.builder()
                .articleId(request.getArticleId())
                .selectedText(request.getSelectedText())
                .noteContent(request.getNoteContent())
                .gsTag(request.getGsTag() != null ? request.getGsTag() : "GS-2")
                .build();
        return ResponseEntity.ok(noteRepository.save(note));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        noteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
