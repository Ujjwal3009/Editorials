package com.upsc.editorial.repository;

import com.upsc.editorial.model.ConceptGlossary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlossaryRepository extends JpaRepository<ConceptGlossary, Long> {
    Optional<ConceptGlossary> findByTerm(String term);
    Optional<ConceptGlossary> findByTermIgnoreCase(String term);
    List<ConceptGlossary> findByRelatedGsPaper(String relatedGsPaper);
}
