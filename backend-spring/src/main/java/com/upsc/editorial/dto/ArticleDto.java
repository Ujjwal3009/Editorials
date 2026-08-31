package com.upsc.editorial.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ArticleDto {
    private Long id;
    private String source;
    private String sourceUrl;
    private String title;
    private String subtitle;
    private String author;
    private LocalDate publishedDate;
    private String layoutSlot;
    private String gsPaper;
    private String syllabusTopicCode;
    private String syllabusTopicTitle;
    private List<String> keyTakeaways;
    private List<String> statistics;
    private List<String> committeesCited;
    private List<ElementDto> elements;
    private List<PyqDto> relatedPyqs;

    @Data
    @Builder
    public static class ElementDto {
        private Long id;
        private Integer order;
        private String type;
        private String content;
    }

    @Data
    @Builder
    public static class PyqDto {
        private Long id;
        private String gsPaper;
        private Integer year;
        private Integer questionNumber;
        private Integer marks;
        private String questionText;
        private String modelApproachHints;
    }
}
