package com.upsc.editorial.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(name = "source_url", nullable = false, unique = true, columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String subtitle;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(name = "published_date", nullable = false)
    private LocalDate publishedDate;

    @Column(name = "layout_slot", length = 50)
    private String layoutSlot; // LEAD, SIDE_1, SIDE_2, OPED_1, OPED_2

    @Column(name = "gs_paper", length = 10)
    private String gsPaper; // GS-1, GS-2, GS-3, GS-4

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "syllabus_topic_id")
    private SyllabusTopic syllabusTopic;

    @ElementCollection
    @CollectionTable(name = "article_key_takeaways", joinColumns = @JoinColumn(name = "article_id"))
    @Builder.Default
    @Column(name = "takeaway", columnDefinition = "TEXT")
    private List<String> keyTakeaways = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "article_statistics", joinColumns = @JoinColumn(name = "article_id"))
    @Builder.Default
    @Column(name = "statistic", columnDefinition = "TEXT")
    private List<String> statistics = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "article_committees", joinColumns = @JoinColumn(name = "article_id"))
    @Builder.Default
    @Column(name = "committee", columnDefinition = "TEXT")
    private List<String> committeesCited = new ArrayList<>();

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @OrderBy("sequenceOrder ASC")
    private List<ArticleElement> elements = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
