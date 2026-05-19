package com.waldo.games.overwatch;

/** {@code debug=true} 일 때만 응답에 포함되는 URL·HTTP·파싱·원본 JSON. */
public record OverwatchCareerDebug(
        String inputMode,
        String battletag,
        String searchUrl,
        String searchFinalUrl,
        Integer searchHttpStatus,
        Integer searchResultCount,
        String profileUrlKey,
        String careerRequestUrl,
        String careerFinalUrl,
        boolean careerRedirected,
        Integer careerHttpStatus,
        Integer careerHtmlLength,
        String htmlPageTitle,
        boolean htmlLooksLikeLoginPage,
        boolean careerPageLooksValid,
        boolean htmlHasPlayerName,
        boolean htmlHasQuickPlaySection,
        int parsedHeroCount,
        String note,
        String searchResponseJson,
        String parsedHeroesJson) {}
