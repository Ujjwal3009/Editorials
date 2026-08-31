package com.upsc.editorial.dto;

import lombok.Data;

@Data
public class UserNoteRequest {
    private Long articleId;
    private String selectedText;
    private String noteContent;
    private String gsTag;
}
