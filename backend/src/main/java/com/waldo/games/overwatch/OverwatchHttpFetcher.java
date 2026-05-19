package com.waldo.games.overwatch;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
class OverwatchHttpFetcher {

    private static final Logger log = LoggerFactory.getLogger(OverwatchHttpFetcher.class);

    static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    private static final String REFERER_SEARCH = "https://overwatch.blizzard.com/ko-kr/search/";
    private static final String REFERER_CAREER = "https://overwatch.blizzard.com/ko-kr/career/";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    String fetchText(String url) {
        return fetch(url).body();
    }

    OverwatchHttpFetchResult fetchForSearch(String url) {
        return fetch(url, REFERER_SEARCH);
    }

    OverwatchHttpFetchResult fetchForCareer(String url) {
        return fetch(url, REFERER_CAREER);
    }

    OverwatchHttpFetchResult fetch(String url) {
        return fetch(url, REFERER_CAREER);
    }

    private OverwatchHttpFetchResult fetch(String url, String referer) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(25))
                .header("User-Agent", USER_AGENT)
                .header("Accept-Language", "ko-KR,ko;q=0.9,en;q=0.8")
                .header("Accept", "text/html,application/xhtml+xml,application/json")
                .header("Referer", referer)
                .header("Origin", "https://overwatch.blizzard.com")
                .GET()
                .build();
        try {
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String body = response.body();
            String finalUrl = response.uri().toString();
            log.debug(
                    "Blizzard GET {} -> HTTP {} final={} ({} bytes)",
                    url,
                    status,
                    finalUrl,
                    body == null ? 0 : body.length());
            if (status == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다.");
            }
            if (status < 200 || status >= 300) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY, "Blizzard 응답 HTTP " + status);
            }
            return new OverwatchHttpFetchResult(url, finalUrl, status, body);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "요청이 중단되었습니다.");
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Blizzard 서버에 연결하지 못했습니다.");
        }
    }
}
