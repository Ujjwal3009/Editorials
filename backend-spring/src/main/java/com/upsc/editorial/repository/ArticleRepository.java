package com.upsc.editorial.repository;

import com.upsc.editorial.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    Optional<Article> findBySourceUrl(String sourceUrl);
    List<Article> findByPublishedDateOrderByLayoutSlotAsc(LocalDate date);
    List<Article> findByGsPaperOrderByPublishedDateDesc(String gsPaper);
    List<Article> findAllByOrderByPublishedDateDesc();
}
