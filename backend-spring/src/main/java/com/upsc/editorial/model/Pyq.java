package com.upsc.editorial.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "mains_pyqs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Pyq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gs_paper", nullable = false, length = 10)
    private String gsPaper;

    @Column(name = "exam_year", nullable = false)
    private Integer year;

    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @Column(nullable = false)
    private Integer marks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "syllabus_topic_id")
    private SyllabusTopic syllabusTopic;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "model_approach_hints", columnDefinition = "TEXT")
    private String modelApproachHints;
}
