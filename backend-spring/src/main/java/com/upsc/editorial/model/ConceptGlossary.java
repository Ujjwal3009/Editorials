package com.upsc.editorial.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "concept_glossaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConceptGlossary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String term;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "upsc_context", nullable = false, columnDefinition = "TEXT")
    private String upscContext;

    @Column(name = "related_gs_paper", length = 10)
    private String relatedGsPaper;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "concept_synonyms", joinColumns = @JoinColumn(name = "concept_id"))
    @Column(name = "synonym")
    private List<String> synonyms = new ArrayList<>();
}
