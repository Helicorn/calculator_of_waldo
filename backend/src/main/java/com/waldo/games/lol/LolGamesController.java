package com.waldo.games.lol;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/waldo/games/lol")
public class LolGamesController {

    private final LolChampionStatsQueryRepository championStatsQueryRepository;

    public LolGamesController(LolChampionStatsQueryRepository championStatsQueryRepository) {
        this.championStatsQueryRepository = championStatsQueryRepository;
    }

    @GetMapping("/champions/{championId}/stats")
    public ResponseEntity<List<ChampionStatsRowResponse>> championStats(
            @PathVariable int championId,
            @RequestParam(name = "queueId", defaultValue = "420") int queueId) {
        List<ChampionStatsRowResponse> rows = championStatsQueryRepository
                .findByChampionIdAndQueueId(championId, queueId)
                .stream()
                .map(row -> new ChampionStatsRowResponse(
                        row.patchVersion(),
                        row.queueId(),
                        row.championId(),
                        row.line(),
                        row.games(),
                        row.wins(),
                        row.losses(),
                        row.winRate() == null ? null : row.winRate().doubleValue(),
                        row.pickRate() == null ? null : row.pickRate().doubleValue()))
                .toList();
        return ResponseEntity.ok(rows);
    }

    public record ChampionStatsRowResponse(
            String patchVersion,
            int queueId,
            int championId,
            String line,
            int games,
            int wins,
            int losses,
            Double winRate,
            Double pickRate) {
    }
}
