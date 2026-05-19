package com.waldo.games.overwatch;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
class OverwatchBattleTagSearchClient {

    private static final String SEARCH_BASE =
            "https://overwatch.blizzard.com/ko-kr/search/account-by-name/";

    private final OverwatchHttpFetcher httpFetcher;
    private final ObjectMapper objectMapper;

    OverwatchBattleTagSearchClient(OverwatchHttpFetcher httpFetcher, ObjectMapper objectMapper) {
        this.httpFetcher = httpFetcher;
        this.objectMapper = objectMapper;
    }

    String resolveProfileUrlKey(String battletag) {
        return resolveWithMeta(battletag).profileUrlKey();
    }

    OverwatchBattletagResolveResult resolveWithMeta(String battletag) {
        String normalized = normalizeBattletag(battletag);
        String wantedName = normalized.substring(0, normalized.indexOf('#')).trim();

        SearchAttempt first = search(normalized);
        if (first.accounts().isEmpty()) {
            first = search(normalized.replace("#", "-"));
        }
        if (first.accounts().isEmpty()) {
            first = search(wantedName);
        }
        if (first.accounts().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "플레이어를 찾을 수 없습니다. 닉네임·배틀태그 숫자·프로필 공개 설정을 확인해 주세요.");
        }

        String profileUrlKey;
        if (first.accounts().size() == 1) {
            profileUrlKey = requireUrlKey(first.accounts().getFirst());
        } else {
            List<OverwatchSearchAccount> exact = first.accounts().stream()
                    .filter(a -> a.name() != null && a.name().equalsIgnoreCase(wantedName))
                    .toList();
            if (exact.size() == 1) {
                profileUrlKey = requireUrlKey(exact.getFirst());
            } else {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "검색 결과가 여러 건입니다. 배틀태그를 정확히 입력해 주세요.");
            }
        }
        return new OverwatchBattletagResolveResult(
                profileUrlKey,
                first.url(),
                first.finalUrl(),
                first.httpStatus(),
                first.accounts().size(),
                first.responseBody());
    }

    private SearchAttempt search(String queryKey) {
        String encoded = URLEncoder.encode(queryKey, StandardCharsets.UTF_8);
        String url = SEARCH_BASE + encoded + "/";
        OverwatchHttpFetchResult response = httpFetcher.fetchForSearch(url);
        try {
            OverwatchSearchAccount[] rows =
                    objectMapper.readValue(response.body(), OverwatchSearchAccount[].class);
            List<OverwatchSearchAccount> accounts = rows == null ? List.of() : Arrays.asList(rows);
            return new SearchAttempt(
                    url, response.finalUrl(), response.statusCode(), response.body(), accounts);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "플레이어 검색 응답을 해석하지 못했습니다.");
        }
    }

    private static String requireUrlKey(OverwatchSearchAccount account) {
        if (account.url() == null || account.url().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "검색 결과에 프로필 ID가 없습니다.");
        }
        return normalizeProfileUrlKey(account.url());
    }

    static String normalizeProfileUrlKey(String raw) {
        String decoded = URLDecoder.decode(raw.trim(), StandardCharsets.UTF_8);
        if (decoded.endsWith("/")) {
            decoded = decoded.substring(0, decoded.length() - 1);
        }
        return decoded.toLowerCase();
    }

    static String normalizeBattletag(String battletag) {
        String trimmed = battletag.trim();
        int hash = trimmed.indexOf('#');
        if (hash <= 0 || hash >= trimmed.length() - 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "배틀태그는 닉네임#숫자 형식이어야 합니다.");
        }
        String name = trimmed.substring(0, hash).trim();
        String tag = trimmed.substring(hash + 1).trim();
        if (name.isEmpty() || tag.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "배틀태그는 닉네임#숫자 형식이어야 합니다.");
        }
        return name + "#" + tag;
    }

    static String composeBattletag(String name, String tag) {
        if (name == null || name.isBlank() || tag == null || tag.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임과 배틀태그를 입력해 주세요.");
        }
        String cleanTag = tag.trim();
        if (cleanTag.startsWith("#")) {
            cleanTag = cleanTag.substring(1);
        }
        return normalizeBattletag(name.trim() + "#" + cleanTag);
    }

    private record SearchAttempt(
            String url,
            String finalUrl,
            int httpStatus,
            String responseBody,
            List<OverwatchSearchAccount> accounts) {}
}
