package com.upsc.editorial.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "syllabus_topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyllabusTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gs_paper", nullable = false, length = 10)
    private String gsPaper;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(name = "topic_code", nullable = false, unique = true, length = 50)
    private String topicCode;

    @Column(name = "topic_title", nullable = false, columnDefinition = "TEXT")
    private String topicTitle;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "syllabus_topic_keywords", joinColumns = @JoinColumn(name = "syllabus_topic_id"))
    @Column(name = "keyword")
    private List<String> keywords = new ArrayList<>();
}
