package com.waldo.games.overwatch.catalogs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/waldo/games/overwatch/heroes")
public class OverwatchHeroController {

    private final OverwatchHeroCatalogService catalogService;

    public OverwatchHeroController(OverwatchHeroCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ResponseEntity<OverwatchHeroListResponse> list() {
        return ResponseEntity.ok(catalogService.listHeroes());
    }

    @GetMapping("/{heroId}")
    public ResponseEntity<OverwatchHeroDetailResponse> detail(@PathVariable String heroId) {
        return ResponseEntity.ok(catalogService.getHero(heroId));
    }
}
