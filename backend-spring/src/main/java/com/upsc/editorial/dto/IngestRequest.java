package com.upsc.editorial.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class IngestRequest {
    private String source;
    private String url;
    private String title;
    private String subtitle;
    private String author;
    private LocalDate publishedDate;
    private String layoutSlot; // LEAD, SIDE_1, SIDE_2, OPED_1, OPED_2
    private List<ElementDto> elements;
    private String fullText;

    @Data
    public static class ElementDto {
        private String type; // 'heading' or 'paragraph'
        private String text;
    }
}
