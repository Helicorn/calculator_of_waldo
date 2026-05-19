package com.waldo.games.overwatch;

/** 배틀태그·URL·프로필 ID 입력을 career 경로용 프로필 키로 바꾼 결과. */
record OverwatchProfileResolution(
        String inputMode,
        String profileUrlKey,
        String battletag,
        String searchUrl,
        String searchFinalUrl,
        Integer searchHttpStatus,
        Integer searchResultCount,
        String searchResponseJson) {}
