package com.waldo.games.overwatch.history;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class OverwatchCareerHtmlParser {

    private static final Pattern NAME =
            Pattern.compile("<h1 class=\"Profile-player--name\">([^<]+)</h1>");
    private static final Pattern TITLE =
            Pattern.compile("<h2 class=\"Profile-player--title\">([^<]+)</h2>");
    private static final Pattern STAT_OPTION = Pattern.compile(
            "<option value=\"([^\"]+)\" option-id=\"([^\"]+)\"([^>]*)>([^<]*)</option>");
    private static final Pattern HERO_BLOCK = Pattern.compile(
            "data-hero-id=\"([^\"]+)\"[^>]*>.*?<div class=\"Profile-progressBar-title\">([^<]+)</div>\\s*"
                    + "<div class=\"Profile-progressBar-description\">([^<]+)</div>",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);

    private OverwatchCareerHtmlParser() {
    }

    static ParsedCareer parse(String html) {
        if (html == null || html.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "career page is empty");
        }

        String displayName = firstGroup(NAME, html);
        if (displayName == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "프로필을 찾을 수 없거나 페이지 형식이 변경되었습니다.");
        }

        String title = firstGroup(TITLE, html);
        String section = extractQuickPlaySection(html);
        List<StatOption> statOptions = parseStatOptions(section);
        List<OverwatchCareerResponse.HeroRow> allHeroRows = parseHeroRows(section);
        List<OverwatchCareerResponse.StatCategory> statCategories =
                groupHeroesByStat(statOptions, allHeroRows);

        int activeStatIndex = activeStatIndex(statOptions);
        String statLabel =
                statCategories.isEmpty() ? "플레이 시간" : statCategories.get(activeStatIndex).label();
        List<OverwatchCareerResponse.HeroRow> activeHeroes =
                statCategories.isEmpty()
                        ? allHeroRows
                        : statCategories.get(activeStatIndex).heroes();

        return new ParsedCareer(
                displayName.trim(),
                title != null ? title.trim() : null,
                "quickPlay",
                statLabel,
                activeStatIndex,
                statCategories,
                activeHeroes);
    }

    private static String extractQuickPlaySection(String html) {
        int marker = html.indexOf("quickPlay-view is-active");
        if (marker < 0) {
            marker = html.indexOf("Profile-heroSummary--view quickPlay-view");
        }
        if (marker < 0) {
            return html;
        }
        int end = html.indexOf("competitive-view", marker);
        if (end < 0) {
            end = html.indexOf("Profile-heroSummary--view competitive-view", marker);
        }
        String section = end > marker ? html.substring(marker, end) : html.substring(marker);
        int duplicate = section.indexOf("Profile-heroSummary--view quickPlay-view", 1);
        if (duplicate > 0) {
            section = section.substring(0, duplicate);
        }
        return section;
    }

    private static List<StatOption> parseStatOptions(String section) {
        List<StatOption> options = new ArrayList<>();
        Matcher matcher = STAT_OPTION.matcher(section);
        while (matcher.find()) {
            options.add(new StatOption(
                    matcher.group(1).trim(),
                    matcher.group(2).trim(),
                    matcher.group(3).contains("selected")));
        }
        return options;
    }

    private static int activeStatIndex(List<StatOption> options) {
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i).selected()) {
                return i;
            }
        }
        return 0;
    }

    private static List<OverwatchCareerResponse.StatCategory> groupHeroesByStat(
            List<StatOption> statOptions, List<OverwatchCareerResponse.HeroRow> allHeroRows) {
        if (statOptions.isEmpty() || allHeroRows.isEmpty()) {
            return List.of();
        }
        int statCount = statOptions.size();
        if (allHeroRows.size() % statCount != 0) {
            return List.of(new OverwatchCareerResponse.StatCategory(
                    statOptions.getFirst().label(),
                    statOptions.getFirst().valueId(),
                    allHeroRows));
        }
        int heroesPerStat = allHeroRows.size() / statCount;
        List<OverwatchCareerResponse.StatCategory> categories = new ArrayList<>(statCount);
        for (int i = 0; i < statCount; i++) {
            StatOption option = statOptions.get(i);
            int from = i * heroesPerStat;
            int to = from + heroesPerStat;
            categories.add(new OverwatchCareerResponse.StatCategory(
                    option.label(), option.valueId(), List.copyOf(allHeroRows.subList(from, to))));
        }
        return categories;
    }

    private static List<OverwatchCareerResponse.HeroRow> parseHeroRows(String section) {
        List<OverwatchCareerResponse.HeroRow> heroes = new ArrayList<>();
        Matcher matcher = HERO_BLOCK.matcher(section);
        while (matcher.find()) {
            heroes.add(new OverwatchCareerResponse.HeroRow(
                    matcher.group(1).trim(),
                    matcher.group(2).trim(),
                    matcher.group(3).trim()));
        }
        if (heroes.isEmpty()) {
            Pattern fallback = Pattern.compile(
                    "<div class=\"Profile-progressBar-title\">([^<]+)</div>\\s*"
                            + "<div class=\"Profile-progressBar-description\">([^<]+)</div>",
                    Pattern.DOTALL);
            Matcher fb = fallback.matcher(section);
            while (fb.find()) {
                heroes.add(new OverwatchCareerResponse.HeroRow(null, fb.group(1).trim(), fb.group(2).trim()));
            }
        }
        return heroes;
    }

    private static String firstGroup(Pattern pattern, String html) {
        Matcher matcher = pattern.matcher(html);
        return matcher.find() ? matcher.group(1) : null;
    }

    static HtmlDiagnostics diagnose(String html) {
        boolean hasHtml = html != null && !html.isBlank();
        boolean looksLikeLoginPage = hasHtml && looksLikeBattleNetLogin(html);
        boolean hasPlayerName = hasHtml && !looksLikeLoginPage && NAME.matcher(html).find();
        boolean hasQuickPlay = hasHtml
                && !looksLikeLoginPage
                && (html.contains("quickPlay-view is-active")
                        || html.contains("Profile-heroSummary--view quickPlay-view"));
        int heroCount = 0;
        if (hasHtml && !looksLikeLoginPage) {
            String section = extractQuickPlaySection(html);
            ParsedCareer parsed = parseQuiet(section);
            heroCount = parsed.heroes().size();
        }
        String pageTitle = extractPageTitle(html);
        return new HtmlDiagnostics(
                hasHtml, looksLikeLoginPage, pageTitle, hasPlayerName, hasQuickPlay, heroCount);
    }

    /** diagnose용 — 오류 없이 섹션만 파싱. */
    private static ParsedCareer parseQuiet(String section) {
        List<StatOption> statOptions = parseStatOptions(section);
        List<OverwatchCareerResponse.HeroRow> allHeroRows = parseHeroRows(section);
        List<OverwatchCareerResponse.StatCategory> statCategories =
                groupHeroesByStat(statOptions, allHeroRows);
        int activeStatIndex = activeStatIndex(statOptions);
        List<OverwatchCareerResponse.HeroRow> activeHeroes =
                statCategories.isEmpty()
                        ? allHeroRows
                        : statCategories.get(activeStatIndex).heroes();
        String statLabel =
                statCategories.isEmpty() ? "" : statCategories.get(activeStatIndex).label();
        return new ParsedCareer("", null, "quickPlay", statLabel, activeStatIndex, statCategories, activeHeroes);
    }

    static boolean looksLikeBattleNetLogin(String html) {
        if (html == null || html.isBlank()) {
            return false;
        }
        return html.contains("Battle.net Login")
                || html.contains("Log in or sign up")
                || html.contains("blizzard.login")
                || html.contains("account.battle.net");
    }

    private static String extractPageTitle(String html) {
        if (html == null) {
            return null;
        }
        Matcher matcher = Pattern.compile("<title[^>]*>([^<]+)</title>", Pattern.CASE_INSENSITIVE)
                .matcher(html);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private record StatOption(String valueId, String label, boolean selected) {
    }

    record HtmlDiagnostics(
            boolean hasHtml,
            boolean looksLikeLoginPage,
            String pageTitle,
            boolean hasPlayerName,
            boolean hasQuickPlaySection,
            int heroCount) {

        boolean careerPageLooksValid() {
            return hasPlayerName && !looksLikeLoginPage;
        }
    }

    record ParsedCareer(
            String displayName,
            String title,
            String queueMode,
            String statLabel,
            int activeStatIndex,
            List<OverwatchCareerResponse.StatCategory> statCategories,
            List<OverwatchCareerResponse.HeroRow> heroes) {
    }
}
