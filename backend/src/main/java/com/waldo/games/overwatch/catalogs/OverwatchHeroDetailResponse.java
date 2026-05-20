package com.waldo.games.overwatch.catalogs;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OverwatchHeroDetailResponse(
        String id,
        String name,
        String role,
        String roleLabel,
        String subrole,
        String portraitUrl,
        String description,
        String storyIntro,
        String detailUrl,
        List<OverwatchHeroFact> facts,
        List<OverwatchHeroAbility> abilities,
        List<OverwatchHeroPerk> perks,
        String perksIntro,
        String stadiumIntro,
        List<OverwatchHeroTalent> talents,
        List<OverwatchHeroStorySection> storySections) {

    public record OverwatchHeroFact(String type, String label, String value) {
    }

    public record OverwatchHeroAbility(String id, String name, String iconUrl, String description) {
    }

    public record OverwatchHeroPerk(
            String name, String iconUrl, String description, String category, String tierLabel) {
    }

    public record OverwatchHeroTalent(String name, String description, String iconUrl) {
    }

    public record OverwatchHeroStorySection(
            int group,
            String storyId,
            String label,
            List<String> paragraphs,
            String imageUrl) {
    }
}
