package com.waldo.games.lol;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LolChampionStatsQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    public LolChampionStatsQueryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ChampionStatRow> findByChampionIdAndQueueId(int championId, int queueId) {
        String sql = """
                SELECT s.PATCH_VERSION,
                       s.QUEUE_ID,
                       s.CHAMPION_ID,
                       s.LINE,
                       s.GAMES,
                       s.WINS,
                       s.LOSSES,
                       s.WIN_RATE,
                       s.PICK_RATE
                  FROM LOL_CHAMPION_STATS s
                 WHERE s.CHAMPION_ID = ?
                   AND s.QUEUE_ID = ?
                   AND UPPER(NVL(s.LINE, 'UNKNOWN')) <> 'UNKNOWN'
                   AND s.PATCH_VERSION = (
                       SELECT latest_patch
                         FROM (
                             SELECT p.PATCH_VERSION AS latest_patch
                               FROM LOL_CHAMPION_STATS p
                              WHERE p.CHAMPION_ID = ?
                                AND p.QUEUE_ID = ?
                              ORDER BY TO_NUMBER(REGEXP_SUBSTR(p.PATCH_VERSION, '^\\d+')) DESC,
                                       TO_NUMBER(REGEXP_SUBSTR(p.PATCH_VERSION, '\\d+$')) DESC
                         )
                        WHERE ROWNUM = 1
                   )
                 ORDER BY PATCH_VERSION DESC, GAMES DESC, LINE ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ChampionStatRow(
                        rs.getString("PATCH_VERSION"),
                        rs.getInt("QUEUE_ID"),
                        rs.getInt("CHAMPION_ID"),
                        rs.getString("LINE"),
                        rs.getInt("GAMES"),
                        rs.getInt("WINS"),
                        rs.getInt("LOSSES"),
                        rs.getBigDecimal("WIN_RATE"),
                        rs.getBigDecimal("PICK_RATE")),
                championId,
                queueId,
                championId,
                queueId);
    }

    public record ChampionStatRow(
            String patchVersion,
            int queueId,
            int championId,
            String line,
            int games,
            int wins,
            int losses,
            BigDecimal winRate,
            BigDecimal pickRate) {
    }
}
