package com.waldo.games.overwatch;

/**
 * career URL만 Blizzard에 요청해 응답을 검증합니다. HTML 파싱은 하지 않습니다.
 *
 * <p>예: {@code GET /api/waldo/games/overwatch/career/probe?query=career URL}
 */
public record OverwatchCareerProbeResponse(
        String profileUrlKey,
        String careerRequestUrl,
        String careerFinalUrl,
        boolean careerRedirected,
        int careerHttpStatus,
        int careerHtmlLength,
        String htmlPageTitle,
        boolean htmlLooksLikeLoginPage,
        boolean careerPageLooksValid,
        boolean htmlHasPlayerName,
        boolean htmlHasQuickPlaySection,
        String note) {}
