package com.upsc.editorial.repository;

import com.upsc.editorial.model.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<UserNote, Long> {
    List<UserNote> findByArticleIdOrderByCreatedAtDesc(Long articleId);
    List<UserNote> findAllByOrderByCreatedAtDesc();
}
