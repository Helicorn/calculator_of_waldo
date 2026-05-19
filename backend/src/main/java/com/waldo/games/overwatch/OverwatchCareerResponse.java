package com.waldo.games.overwatch;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OverwatchCareerResponse(
        String profileId,
        String careerUrl,
        String battletag,
        String displayName,
        String title,
        String queueMode,
        String statLabel,
        int activeStatIndex,
        List<StatCategory> statCategories,
        List<HeroRow> heroes,
        OverwatchCareerDebug debug) {

    public OverwatchCareerResponse(
            String profileId,
            String careerUrl,
            String battletag,
            String displayName,
            String title,
            String queueMode,
            String statLabel,
            int activeStatIndex,
            List<StatCategory> statCategories,
            List<HeroRow> heroes) {
        this(
                profileId,
                careerUrl,
                battletag,
                displayName,
                title,
                queueMode,
                statLabel,
                activeStatIndex,
                statCategories,
                heroes,
                null);
    }

    public record StatCategory(String label, String valueId, List<HeroRow> heroes) {
    }

    public record HeroRow(String heroId, String name, String statValue) {
    }
}
