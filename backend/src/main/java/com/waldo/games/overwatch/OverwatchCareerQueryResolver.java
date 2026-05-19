package com.waldo.games.overwatch;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
class OverwatchCareerQueryResolver {

    private static final Pattern PROFILE_ID =
            Pattern.compile("^[a-f0-9]{32}\\|[a-f0-9]{32}$", Pattern.CASE_INSENSITIVE);

    private static final Pattern CAREER_PATH =
            Pattern.compile("/career/([^/?#]+)", Pattern.CASE_INSENSITIVE);

    private final OverwatchBattleTagSearchClient battleTagSearch;

    OverwatchCareerQueryResolver(OverwatchBattleTagSearchClient battleTagSearch) {
        this.battleTagSearch = battleTagSearch;
    }

    String resolveProfileUrlKey(String query, String battleTagName, String battleTagCode) {
        return resolve(query, battleTagName, battleTagCode).profileUrlKey();
    }

    OverwatchProfileResolution resolve(String query, String battleTagName, String battleTagCode) {
        if (query != null && !query.isBlank()) {
            String q = query.trim();
            if (q.contains("/career/") || PROFILE_ID.matcher(decodeSegment(q)).matches()) {
                String profileUrlKey = normalizeProfileId(q);
                return new OverwatchProfileResolution(
                        "career-url-or-profile-id", profileUrlKey, null, null, null, null, null, null);
            }
            if (q.contains("#")) {
                OverwatchBattletagResolveResult found = battleTagSearch.resolveWithMeta(q);
                return new OverwatchProfileResolution(
                        "battletag-query",
                        found.profileUrlKey(),
                        OverwatchBattleTagSearchClient.normalizeBattletag(q),
                        found.searchUrl(),
                        found.searchFinalUrl(),
                        found.searchHttpStatus(),
                        found.searchResultCount(),
                        found.searchResponseJson());
            }
        }
        if (battleTagName != null && !battleTagName.isBlank()
                && battleTagCode != null && !battleTagCode.isBlank()) {
            String battletag = OverwatchBattleTagSearchClient.composeBattletag(battleTagName, battleTagCode);
            OverwatchBattletagResolveResult found = battleTagSearch.resolveWithMeta(battletag);
            return new OverwatchProfileResolution(
                    "battletag-name-tag",
                    found.profileUrlKey(),
                    battletag,
                    found.searchUrl(),
                    found.searchFinalUrl(),
                    found.searchHttpStatus(),
                    found.searchResultCount(),
                    found.searchResponseJson());
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "닉네임과 배틀태그(숫자)를 입력해 주세요.");
    }

    private static String normalizeProfileId(String raw) {
        if (raw.contains("/career/")) {
            Matcher matcher = CAREER_PATH.matcher(raw);
            if (matcher.find()) {
                return decodeSegment(matcher.group(1)).toLowerCase(Locale.ROOT);
            }
        }
        String decoded = decodeSegment(raw);
        if (!PROFILE_ID.matcher(decoded).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "프로필 ID 또는 career URL 형식을 확인해 주세요.");
        }
        return decoded.toLowerCase(Locale.ROOT);
    }

    private static String decodeSegment(String segment) {
        String decoded = URLDecoder.decode(segment, StandardCharsets.UTF_8).trim();
        if (decoded.endsWith("/")) {
            decoded = decoded.substring(0, decoded.length() - 1);
        }
        return decoded;
    }

    static String careerUrl(String profileUrlKey) {
        String decoded =
                URLDecoder.decode(profileUrlKey.trim(), StandardCharsets.UTF_8);
        String encoded = decoded.replace("|", "%7C");
        return "https://overwatch.blizzard.com/ko-kr/career/" + encoded + "/";
    }
}
