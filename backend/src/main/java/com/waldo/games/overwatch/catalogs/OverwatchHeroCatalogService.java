package com.waldo.games.overwatch.catalogs;

import com.waldo.games.overwatch.OverwatchHttpFetcher;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class OverwatchHeroCatalogService {

    private static final String HEROES_LIST_URL = "https://overwatch.blizzard.com/ko-kr/heroes/";
    private static final Duration CACHE_TTL = Duration.ofHours(6);

    private final OverwatchHttpFetcher httpFetcher;

    private volatile CachedList listCache;
    private final Map<String, CachedDetail> detailCache = new ConcurrentHashMap<>();

    public OverwatchHeroCatalogService(OverwatchHttpFetcher httpFetcher) {
        this.httpFetcher = httpFetcher;
    }

    public OverwatchHeroListResponse listHeroes() {
        CachedList cached = listCache;
        if (cached != null && !cached.isExpired()) {
            return cached.response();
        }
        String html = httpFetcher.fetchForHeroes(HEROES_LIST_URL).body();
        List<OverwatchHeroListResponse.OverwatchHeroSummary> heroes =
                OverwatchHeroCatalogHtmlParser.parseHeroList(html);
        OverwatchHeroListResponse response = new OverwatchHeroListResponse(HEROES_LIST_URL, heroes);
        listCache = new CachedList(response, Instant.now().plus(CACHE_TTL));
        return response;
    }

    public OverwatchHeroDetailResponse getHero(String heroId) {
        String normalizedId = OverwatchHeroCatalogHtmlParser.normalizeHeroId(heroId);
        CachedDetail cached = detailCache.get(normalizedId);
        if (cached != null && !cached.isExpired()) {
            return cached.response();
        }
        String detailUrl = "https://overwatch.blizzard.com/ko-kr/heroes/" + normalizedId + "/";
        String html = httpFetcher.fetchForHeroes(detailUrl).body();
        OverwatchHeroDetailResponse parsed =
                OverwatchHeroCatalogHtmlParser.parseHeroDetail(html, normalizedId);
        String portraitUrl = portraitUrlFromHeroesList(normalizedId);
        if (portraitUrl == null) {
            portraitUrl = parsed.portraitUrl();
        }
        OverwatchHeroDetailResponse response =
                new OverwatchHeroDetailResponse(
                        parsed.id(),
                        parsed.name(),
                        parsed.role(),
                        parsed.roleLabel(),
                        parsed.subrole(),
                        portraitUrl,
                        parsed.description(),
                        parsed.storyIntro(),
                        detailUrl,
                        parsed.facts(),
                        parsed.abilities(),
                        parsed.perks(),
                        parsed.perksIntro(),
                        parsed.stadiumIntro(),
                        parsed.talents(),
                        parsed.storySections());
        detailCache.put(normalizedId, new CachedDetail(response, Instant.now().plus(CACHE_TTL)));
        return response;
    }

    /** 영웅 목록 페이지(`/ko-kr/heroes/`) 카드의 blz-image URL — 상세 화면 초상화와 통일 */
    private String portraitUrlFromHeroesList(String normalizedId) {
        return listHeroes().heroes().stream()
                .filter(hero -> hero.id().equalsIgnoreCase(normalizedId))
                .map(OverwatchHeroListResponse.OverwatchHeroSummary::portraitUrl)
                .findFirst()
                .orElse(null);
    }

    private record CachedList(OverwatchHeroListResponse response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private record CachedDetail(OverwatchHeroDetailResponse response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
