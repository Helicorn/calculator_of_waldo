package com.waldo.games.overwatch.catalogs;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class OverwatchHeroCatalogHtmlParser {

    private static final Pattern HERO_CARD = Pattern.compile(
            "<a class=\"hero-card\"([^>]*?)href=\"([^\"]+)\"([^>]*?)>[\\s\\S]*?"
                    + "<blz-image[^>]*src=\"([^\"]+)\"[\\s\\S]*?<h2[^>]*>([^<]+)</h2>",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern ABILITY_TAB = Pattern.compile(
            "<blz-tab-control id=\"([^\"]+)\"[^>]*label=\"([^\"]+)\"[^>]*>"
                    + "[\\s\\S]*?<blz-image slot=\"icon\" src=\"([^\"]+)\"",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern ABILITY_SLIDE = Pattern.compile(
            "<blz-feature slot=\"slide\"[\\s\\S]*?<h3 class=\"heading\" slot=\"heading\">([^<]+)</h3>"
                    + "<p slot=\"description\">([\\s\\S]*?)</p>",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PERK_BLOCK = Pattern.compile(
            "<div class=\"perk-details[^\"]*\"[^>]*>[\\s\\S]*?"
                    + "<img alt=\"([^\"]+)\" src=\"([^\"]+)\"[\\s\\S]*?"
                    + "<h3 slot=\"subheading\">([^<]+)</h3><div slot=\"description\">([^<]+)</div>",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HERO_FACT = Pattern.compile(
            "<blz-list-item class=\"([^\"]+)\"[^>]*?(?:descriptiontext=\"([^\"]*)\")?[^>]*>"
                    + "[\\s\\S]*?(?:<p slot=\"description\">([^<]*)</p>)?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern STORY_LABEL = Pattern.compile(
            "<span slot=\"label\" data-group=\"(\\d+)\"[^>]*story-id=\"([^\"]*)\"[^>]*>([^<]+)</span>",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern STORY_PARAGRAPH = Pattern.compile("<p[^>]*>([^<]+)</p>", Pattern.CASE_INSENSITIVE);
    private static final Pattern TALENT = Pattern.compile(
            "<img class=\"talent-image\" alt=\"([^\"]*)\" src=\"([^\"]+)\"[^>]*>"
                    + "[\\s\\S]*?<p class=\"talent-name\" slot=\"heading\">([^<]+)</p>"
                    + "<p class=\"talent-desc\" slot=\"description\">([\\s\\S]*?)</p>",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HERO_TITLE = Pattern.compile(
            "<title>오버워치 - 영웅 - ([^<]+)</title>", Pattern.CASE_INSENSITIVE);
    private static final Pattern TAGLINE = Pattern.compile(
            "<p slot=\"description\">([^<]{20,})</p>", Pattern.CASE_INSENSITIVE);

    private OverwatchHeroCatalogHtmlParser() {
    }

    static List<OverwatchHeroListResponse.OverwatchHeroSummary> parseHeroList(String html) {
        if (html == null || html.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "heroes page is empty");
        }
        List<OverwatchHeroListResponse.OverwatchHeroSummary> heroes = new ArrayList<>();
        Matcher matcher = HERO_CARD.matcher(html);
        while (matcher.find()) {
            String attrs = matcher.group(1) + matcher.group(3);
            String href = matcher.group(2).trim();
            String id = heroIdFromHref(href);
            if (id.isEmpty()) {
                continue;
            }
            heroes.add(new OverwatchHeroListResponse.OverwatchHeroSummary(
                    id,
                    matcher.group(5).trim(),
                    roleFromAttrs(attrs),
                    roleLabel(roleFromAttrs(attrs)),
                    subroleFromAttrs(attrs),
                    matcher.group(4).trim(),
                    attrs.contains("data-new=\"true\"")));
        }
        if (heroes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "영웅 목록을 파싱하지 못했습니다. 페이지 형식이 변경되었을 수 있습니다.");
        }
        heroes.sort(Comparator.comparing(OverwatchHeroListResponse.OverwatchHeroSummary::name));
        return heroes;
    }

    static OverwatchHeroDetailResponse parseHeroDetail(String html, String heroId) {
        if (html == null || html.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "hero page is empty");
        }
        String normalizedId = normalizeHeroId(heroId);
        if (!html.contains("/heroes/" + normalizedId)
                && !html.contains("id=\"" + normalizedId + "\"")
                && !html.toLowerCase(Locale.ROOT).contains(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영웅을 찾을 수 없습니다.");
        }

        String name = firstGroup(HERO_TITLE, html);
        if (name == null) {
            name = normalizedId;
        }

        String attrs = extractHeroAttrs(html, normalizedId);
        String role = roleFromAttrs(attrs);

        return new OverwatchHeroDetailResponse(
                normalizedId,
                name.trim(),
                role,
                roleLabel(role),
                subroleFromAttrs(attrs),
                null,
                parseTagline(html),
                parseStoryIntro(html),
                null,
                parseFacts(html),
                parseAbilities(html),
                parsePerks(html),
                parseSectionIntro(html, ">특전<"),
                parseSectionIntro(html, "스타디움 파워"),
                parseTalents(html),
                parseStorySections(html));
    }

    private static String parseTagline(String html) {
        int skillsIdx = html.indexOf(">기술<");
        String header = skillsIdx > 0 ? html.substring(0, skillsIdx) : html;
        return firstGroup(TAGLINE, header);
    }

    private static String parseStoryIntro(String html) {
        return parseSectionIntro(html, ">이야기<");
    }

    private static String parseSectionIntro(String html, String marker) {
        int idx = html.indexOf(marker);
        if (idx < 0) {
            return null;
        }
        int end = Math.min(html.length(), idx + 4000);
        Matcher matcher =
                Pattern.compile(
                                Pattern.quote(marker)
                                        + "</h2></blz-header><span slot=\"description\">([^<]+)",
                                Pattern.CASE_INSENSITIVE)
                        .matcher(html.substring(idx, end));
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private static List<OverwatchHeroDetailResponse.OverwatchHeroFact> parseFacts(String html) {
        int skillsIdx = html.indexOf(">기술<");
        String header = skillsIdx > 0 ? html.substring(0, skillsIdx) : html;
        List<OverwatchHeroDetailResponse.OverwatchHeroFact> facts = new ArrayList<>();
        Matcher matcher = HERO_FACT.matcher(header);
        while (matcher.find()) {
            String type = matcher.group(1).trim().toLowerCase(Locale.ROOT);
            String descriptionText = matcher.group(2) != null ? matcher.group(2).trim() : "";
            String slotText = matcher.group(3) != null ? matcher.group(3).trim() : "";
            String value = !slotText.isBlank() ? slotText : descriptionText;
            if (value.isBlank()) {
                continue;
            }
            facts.add(new OverwatchHeroDetailResponse.OverwatchHeroFact(type, factLabel(type), value));
        }
        return facts;
    }

    private static String factLabel(String type) {
        return switch (type) {
            case "role" -> "역할";
            case "subrole" -> "부역할";
            case "location" -> "출신";
            case "birthday" -> "생일";
            default -> type;
        };
    }

    private static List<OverwatchHeroDetailResponse.OverwatchHeroAbility> parseAbilities(String html) {
        int skillsIdx = html.indexOf(">기술<");
        int perksIdx = html.indexOf("id=\"perks\"");
        if (skillsIdx < 0) {
            return List.of();
        }
        int sectionEnd = perksIdx > skillsIdx ? perksIdx : html.length();
        String section = html.substring(skillsIdx, sectionEnd);

        Map<String, String> descriptionsByName = new LinkedHashMap<>();
        Matcher slideMatcher = ABILITY_SLIDE.matcher(section);
        while (slideMatcher.find()) {
            descriptionsByName.put(
                    slideMatcher.group(1).trim(), htmlToPlainText(slideMatcher.group(2)));
        }

        List<OverwatchHeroDetailResponse.OverwatchHeroAbility> abilities = new ArrayList<>();
        Matcher tabMatcher = ABILITY_TAB.matcher(section);
        while (tabMatcher.find()) {
            String abilityName = tabMatcher.group(2).trim();
            abilities.add(
                    new OverwatchHeroDetailResponse.OverwatchHeroAbility(
                            tabMatcher.group(1).trim(),
                            abilityName,
                            tabMatcher.group(3).trim(),
                            descriptionsByName.get(abilityName)));
        }
        return abilities;
    }

    private static List<OverwatchHeroDetailResponse.OverwatchHeroPerk> parsePerks(String html) {
        int perksIdx = html.indexOf("id=\"perks\"");
        int stadiumIdx = html.indexOf("스타디움 파워");
        if (perksIdx < 0) {
            return List.of();
        }
        int sectionEnd = stadiumIdx > perksIdx ? stadiumIdx : html.length();
        String section = html.substring(perksIdx, sectionEnd);

        List<OverwatchHeroDetailResponse.OverwatchHeroPerk> perks = new ArrayList<>();
        Matcher matcher = PERK_BLOCK.matcher(section);
        while (matcher.find()) {
            String blockStart = section.substring(0, matcher.start());
            String category = currentPerkCategory(blockStart);
            String tierLabel = currentPerkTier(blockStart);
            perks.add(
                    new OverwatchHeroDetailResponse.OverwatchHeroPerk(
                            matcher.group(3).trim(),
                            matcher.group(2).trim(),
                            matcher.group(4).trim(),
                            category,
                            tierLabel));
        }
        return perks;
    }

    private static String currentPerkCategory(String precedingHtml) {
        int minor = precedingHtml.lastIndexOf("perk-category minor");
        int major = precedingHtml.lastIndexOf("perk-category major");
        if (minor > major) {
            return "minor";
        }
        if (major >= 0) {
            return "major";
        }
        return null;
    }

    private static String currentPerkTier(String precedingHtml) {
        Matcher matcher =
                Pattern.compile("<div slot=\"description\">\\(([^)]+)\\)</div>", Pattern.CASE_INSENSITIVE)
                        .matcher(precedingHtml);
        String tier = null;
        while (matcher.find()) {
            tier = matcher.group(1).trim();
        }
        return tier;
    }

    private static List<OverwatchHeroDetailResponse.OverwatchHeroTalent> parseTalents(String html) {
        int stadiumIdx = html.indexOf("스타디움 파워");
        int storyIdx = html.indexOf(">이야기<");
        if (stadiumIdx < 0) {
            return List.of();
        }
        int sectionEnd = storyIdx > stadiumIdx ? storyIdx : html.length();
        String section = html.substring(stadiumIdx, sectionEnd);

        Map<String, OverwatchHeroDetailResponse.OverwatchHeroTalent> unique = new LinkedHashMap<>();
        Matcher matcher = TALENT.matcher(section);
        while (matcher.find()) {
            String name = matcher.group(3).trim();
            unique.putIfAbsent(
                    name,
                    new OverwatchHeroDetailResponse.OverwatchHeroTalent(
                            name, htmlToPlainText(matcher.group(4)), matcher.group(2).trim()));
        }
        return new ArrayList<>(unique.values());
    }

    private static List<OverwatchHeroDetailResponse.OverwatchHeroStorySection> parseStorySections(String html) {
        int storyIdx = html.indexOf(">이야기<");
        if (storyIdx < 0) {
            return List.of();
        }
        String storyHtml = html.substring(storyIdx);

        List<OverwatchHeroDetailResponse.OverwatchHeroStorySection> sections = new ArrayList<>();
        Matcher labelMatcher = STORY_LABEL.matcher(storyHtml);
        while (labelMatcher.find()) {
            int group = Integer.parseInt(labelMatcher.group(1));
            String storyId = labelMatcher.group(2).trim();
            String label = labelMatcher.group(3).trim();

            List<String> paragraphs = parseStoryParagraphs(storyHtml, group);

            Pattern imagePattern =
                    Pattern.compile(
                            "<div slot=\"optional[^\"]*\" data-group=\""
                                    + group
                                    + "\"[^>]*>[\\s\\S]*?src=\"([^\"]+)\"",
                            Pattern.CASE_INSENSITIVE);
            String imageUrl = firstGroup(imagePattern, storyHtml);

            sections.add(
                    new OverwatchHeroDetailResponse.OverwatchHeroStorySection(
                            group, storyId, label, paragraphs, imageUrl));
        }
        return sections;
    }

    private static List<String> parseStoryParagraphs(String storyHtml, int group) {
        String open = "<div slot=\"content\" data-group=\"" + group + "\">";
        int start = storyHtml.indexOf(open);
        if (start < 0) {
            return List.of();
        }
        start += open.length();
        int end = storyHtml.indexOf("<div slot=\"optional", start);
        if (end < 0) {
            end = storyHtml.length();
        }
        return parseParagraphs(storyHtml.substring(start, end));
    }

    private static List<String> parseParagraphs(String htmlChunk) {
        List<String> paragraphs = new ArrayList<>();
        Matcher matcher = STORY_PARAGRAPH.matcher(htmlChunk);
        while (matcher.find()) {
            String text = matcher.group(1).trim();
            if (!text.isBlank()) {
                paragraphs.add(text);
            }
        }
        return paragraphs;
    }

    private static String htmlToPlainText(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        String text =
                html.replaceAll("<img[^>]*alt=['\"]([^'\"]+)['\"][^>]*/?>", " ")
                        .replaceAll("<[^>]+>", " ")
                        .replace("&nbsp;", " ")
                        .replaceAll("\\s+", " ")
                        .trim();
        return text.isEmpty() ? null : text;
    }

    private static String extractHeroAttrs(String html, String heroId) {
        Pattern card =
                Pattern.compile(
                        "<a class=\"hero-card\"([^>]*?)href=\"/heroes/" + Pattern.quote(heroId) + "\"([^>]*?)>",
                        Pattern.CASE_INSENSITIVE);
        Matcher matcher = card.matcher(html);
        if (matcher.find()) {
            return matcher.group(1) + matcher.group(2);
        }
        Pattern roleOnly =
                Pattern.compile(
                        "data-role=\"([^\"]+)\"[^>]*data-subrole=\"([^\"]+)\"",
                        Pattern.CASE_INSENSITIVE);
        Matcher roleMatcher = roleOnly.matcher(html);
        if (roleMatcher.find()) {
            return roleMatcher.group(0);
        }
        return "";
    }

    private static String heroIdFromHref(String href) {
        String path = href.trim();
        if (path.startsWith("http")) {
            int idx = path.lastIndexOf("/heroes/");
            if (idx < 0) {
                return "";
            }
            path = path.substring(idx + "/heroes/".length());
        } else if (path.startsWith("/heroes/")) {
            path = path.substring("/heroes/".length());
        }
        while (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path.toLowerCase(Locale.ROOT);
    }

    static String normalizeHeroId(String heroId) {
        if (heroId == null) {
            return "";
        }
        return heroId.trim().toLowerCase(Locale.ROOT).replaceAll("^/+|/+$", "");
    }

    private static String roleFromAttrs(String attrs) {
        Matcher matcher = Pattern.compile("data-role=\"([^\"]+)\"").matcher(attrs);
        return matcher.find() ? matcher.group(1).trim().toLowerCase(Locale.ROOT) : "";
    }

    private static String subroleFromAttrs(String attrs) {
        Matcher matcher = Pattern.compile("data-subrole=\"([^\"]+)\"").matcher(attrs);
        return matcher.find() ? matcher.group(1).trim().toLowerCase(Locale.ROOT) : null;
    }

    static String roleLabel(String role) {
        return switch (role) {
            case "tank" -> "돌격";
            case "damage" -> "공격";
            case "support" -> "지원";
            default -> role;
        };
    }

    private static String firstGroup(Pattern pattern, String html) {
        Matcher matcher = pattern.matcher(html);
        return matcher.find() ? matcher.group(1) : null;
    }
}
