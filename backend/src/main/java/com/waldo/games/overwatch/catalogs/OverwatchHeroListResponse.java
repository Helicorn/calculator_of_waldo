package com.waldo.games.overwatch.catalogs;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OverwatchHeroListResponse(
        String sourceUrl, List<OverwatchHeroSummary> heroes) {

    public record OverwatchHeroSummary(
            String id,
            String name,
            String role,
            String roleLabel,
            String subrole,
            String portraitUrl,
            boolean isNew) {
    }
}
