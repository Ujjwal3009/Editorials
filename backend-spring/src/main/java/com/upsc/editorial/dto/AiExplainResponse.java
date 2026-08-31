package com.upsc.editorial.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AiExplainResponse {
    private boolean isAiGenerated;
    private String explanation;
    private String upscSignificance;
    private List<String> keyArguments;
    private List<String> modelDimensions;
    private String wayForward;
    private String notice;
}
