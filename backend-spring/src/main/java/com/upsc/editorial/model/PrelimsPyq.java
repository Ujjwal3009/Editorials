package com.upsc.editorial.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prelims_pyqs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrelimsPyq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_year", nullable = false)
    private Integer year;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(length = 150)
    private String subtopic;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "correct_answer", length = 10)
    private String correctAnswer;
}
