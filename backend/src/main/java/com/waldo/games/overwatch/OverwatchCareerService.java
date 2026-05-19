package com.waldo.games.overwatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OverwatchCareerService {

    private static final Logger log = LoggerFactory.getLogger(OverwatchCareerService.class);

    private final OverwatchHttpFetcher httpFetcher;
    private final OverwatchCareerQueryResolver queryResolver;
    private final ObjectMapper objectMapper;

    public OverwatchCareerService(
            OverwatchHttpFetcher httpFetcher,
            OverwatchCareerQueryResolver queryResolver,
            ObjectMapper objectMapper) {
        this.httpFetcher = httpFetcher;
        this.queryResolver = queryResolver;
        this.objectMapper = objectMapper;
    }

    public OverwatchCareerProbeResponse probeCareerFetch(
            String query, String battleTagName, String battleTagCode) {
        CareerFetchAttempt attempt = fetchCareerHtml(query, battleTagName, battleTagCode);
        return toProbeResponse(attempt);
    }

    public OverwatchCareerResponse fetchCareer(
            String query, String battleTagName, String battleTagCode, boolean debug) {
        CareerFetchAttempt attempt = fetchCareerHtml(query, battleTagName, battleTagCode);
        ensureCareerHtmlUsable(attempt);

        OverwatchCareerHtmlParser.ParsedCareer parsed = OverwatchCareerHtmlParser.parse(attempt.html());
        OverwatchCareerDebug debugInfo = debug ? buildDebug(attempt, parsed) : null;
        if (debugInfo != null) {
            log.info("Overwatch career debug: {}", debugInfo);
        }

        return new OverwatchCareerResponse(
                attempt.profileUrlKey(),
                attempt.careerRequestUrl(),
                attempt.battletag(),
                parsed.displayName(),
                parsed.title(),
                parsed.queueMode(),
                parsed.statLabel(),
                parsed.activeStatIndex(),
                parsed.statCategories(),
                parsed.heroes(),
                debugInfo);
    }

    private CareerFetchAttempt fetchCareerHtml(
            String query, String battleTagName, String battleTagCode) {
        OverwatchProfileResolution resolution =
                queryResolver.resolve(query, battleTagName, battleTagCode);
        String profileUrlKey = resolution.profileUrlKey();
        String battletag = resolution.battletag() != null
                ? resolution.battletag()
                : resolveBattletagLabel(query, battleTagName, battleTagCode);
        String careerRequestUrl = OverwatchCareerQueryResolver.careerUrl(profileUrlKey);

        log.info(
                "Overwatch career GET request={} (profileKey={} mode={})",
                careerRequestUrl,
                profileUrlKey,
                resolution.inputMode());

        OverwatchHttpFetchResult careerFetch = httpFetcher.fetchForCareer(careerRequestUrl);
        String html = careerFetch.body();
        OverwatchCareerHtmlParser.HtmlDiagnostics htmlDiag = OverwatchCareerHtmlParser.diagnose(html);

        log.info(
                "Overwatch career GET result request={} final={} http={} bytes={} loginPage={} valid={}",
                careerFetch.requestUrl(),
                careerFetch.finalUrl(),
                careerFetch.statusCode(),
                careerFetch.bodyLength(),
                htmlDiag.looksLikeLoginPage(),
                htmlDiag.careerPageLooksValid());

        return new CareerFetchAttempt(
                resolution,
                battletag,
                profileUrlKey,
                careerRequestUrl,
                careerFetch,
                html,
                htmlDiag);
    }

    private static void ensureCareerHtmlUsable(CareerFetchAttempt attempt) {
        if (attempt.htmlDiag().looksLikeLoginPage()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Blizzard career 대신 Battle.net 로그인 페이지를 받았습니다. "
                            + "요청 URL: "
                            + attempt.careerRequestUrl()
                            + " · 최종 URL: "
                            + attempt.careerFetch().finalUrl()
                            + " (프로필 ID가 포함된 /career/{id}/ 형식인지 확인하세요.)");
        }
        if (!attempt.htmlDiag().careerPageLooksValid()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "career HTML에서 프로필을 찾지 못했습니다. 요청 URL: "
                            + attempt.careerRequestUrl()
                            + " · 최종 URL: "
                            + attempt.careerFetch().finalUrl()
                            + " · title="
                            + attempt.htmlDiag().pageTitle());
        }
    }

    private static OverwatchCareerProbeResponse toProbeResponse(CareerFetchAttempt attempt) {
        return new OverwatchCareerProbeResponse(
                attempt.profileUrlKey(),
                attempt.careerRequestUrl(),
                attempt.careerFetch().finalUrl(),
                attempt.careerFetch().redirected(),
                attempt.careerFetch().statusCode(),
                attempt.careerFetch().bodyLength(),
                attempt.htmlDiag().pageTitle(),
                attempt.htmlDiag().looksLikeLoginPage(),
                attempt.htmlDiag().careerPageLooksValid(),
                attempt.htmlDiag().hasPlayerName(),
                attempt.htmlDiag().hasQuickPlaySection(),
                buildNote(attempt));
    }

    private OverwatchCareerDebug buildDebug(
            CareerFetchAttempt attempt, OverwatchCareerHtmlParser.ParsedCareer parsed) {
        return new OverwatchCareerDebug(
                attempt.resolution().inputMode(),
                attempt.battletag(),
                attempt.resolution().searchUrl(),
                attempt.resolution().searchFinalUrl(),
                attempt.resolution().searchHttpStatus(),
                attempt.resolution().searchResultCount(),
                attempt.profileUrlKey(),
                attempt.careerRequestUrl(),
                attempt.careerFetch().finalUrl(),
                attempt.careerFetch().redirected(),
                attempt.careerFetch().statusCode(),
                attempt.careerFetch().bodyLength(),
                attempt.htmlDiag().pageTitle(),
                attempt.htmlDiag().looksLikeLoginPage(),
                attempt.htmlDiag().careerPageLooksValid(),
                attempt.htmlDiag().hasPlayerName(),
                attempt.htmlDiag().hasQuickPlaySection(),
                parsed.heroes().size(),
                buildNote(attempt),
                prettyJson(attempt.resolution().searchResponseJson()),
                prettyJson(parsedSummary(parsed)));
    }

    private static java.util.Map<String, Object> parsedSummary(
            OverwatchCareerHtmlParser.ParsedCareer parsed) {
        java.util.Map<String, Object> summary = new java.util.LinkedHashMap<>();
        summary.put("displayName", parsed.displayName());
        summary.put("title", parsed.title());
        summary.put("queueMode", parsed.queueMode());
        summary.put("statLabel", parsed.statLabel());
        summary.put("activeStatIndex", parsed.activeStatIndex());
        summary.put("statCategories", parsed.statCategories());
        summary.put("heroes", parsed.heroes());
        return summary;
    }

    private String prettyJson(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String raw) {
            if (raw.isBlank()) {
                return raw;
            }
            try {
                Object tree = objectMapper.readTree(raw);
                return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(tree);
            } catch (Exception ex) {
                return raw;
            }
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (Exception ex) {
            return String.valueOf(value);
        }
    }

    private static String buildNote(CareerFetchAttempt attempt) {
        if (attempt.htmlDiag().looksLikeLoginPage()) {
            return "career HTML이 Battle.net 로그인 페이지입니다. "
                    + "https://overwatch.blizzard.com/ko-kr/career/ 만 열면 로그인으로 가며, "
                    + "백엔드는 /career/{프로필ID}/ 를 호출해야 합니다.";
        }
        if (attempt.careerFetch().redirected()) {
            return "리다이렉트 발생: request → final URL을 비교하세요.";
        }
        if (attempt.htmlDiag().careerPageLooksValid()) {
            return "career URL 호출·HTML 모두 정상으로 보입니다.";
        }
        return "HTTP는 성공했지만 career 프로필 마커가 없습니다. URL·프로필 공개 설정을 확인하세요.";
    }

    private static String resolveBattletagLabel(String query, String battleTagName, String battleTagCode) {
        if (battleTagName != null && !battleTagName.isBlank()
                && battleTagCode != null && !battleTagCode.isBlank()) {
            return OverwatchBattleTagSearchClient.composeBattletag(battleTagName, battleTagCode);
        }
        if (query != null && query.contains("#")) {
            return OverwatchBattleTagSearchClient.normalizeBattletag(query.trim());
        }
        return null;
    }

    private record CareerFetchAttempt(
            OverwatchProfileResolution resolution,
            String battletag,
            String profileUrlKey,
            String careerRequestUrl,
            OverwatchHttpFetchResult careerFetch,
            String html,
            OverwatchCareerHtmlParser.HtmlDiagnostics htmlDiag) {}
}
