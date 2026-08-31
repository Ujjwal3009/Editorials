package com.upsc.editorial.dto;

import lombok.Data;

@Data
public class AiExplainRequest {
    private String selectedText;
    private String articleContextTitle;
    private String gsPaper;
    private String queryType; // 'EXPLAIN', 'MAINS_POINTS', 'PROS_CONS', 'SYLLABUS_LINK'
}
