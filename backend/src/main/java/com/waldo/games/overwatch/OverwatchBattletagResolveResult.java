package com.waldo.games.overwatch;

/** 배틀태그 검색 API 호출 결과(프로필 키 + 디버그용 메타). */
record OverwatchBattletagResolveResult(
        String profileUrlKey,
        String searchUrl,
        String searchFinalUrl,
        int searchHttpStatus,
        int searchResultCount,
        String searchResponseJson) {}
