package com.waldo.games.overwatch;

/** Blizzard HTTP 응답 메타(디버그·로깅용). */
public record OverwatchHttpFetchResult(String requestUrl, String finalUrl, int statusCode, String body) {

    public int bodyLength() {
        return body == null ? 0 : body.length();
    }

    public boolean redirected() {
        return finalUrl != null && requestUrl != null && !finalUrl.equals(requestUrl);
    }
}
