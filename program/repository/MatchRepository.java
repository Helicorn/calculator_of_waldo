package program.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;

public class MatchRepository {
    private static final String DEFAULT_DB_URL = "jdbc:oracle:thin:@localhost:1521:xe";
    private static final String DEFAULT_DB_USER = "c##db1";
    private static final String DEFAULT_DB_PASSWORD = "wkddjwmf1234!@#$";

    private static final String MERGE_MATCH_SQL =
        "MERGE INTO LOL_MATCH tgt "
            + "USING (SELECT ? AS MATCH_ID, ? AS QUEUE_ID, ? AS PATCH_VERSION, ? AS GAME_START_TIME FROM dual) src "
            + "ON (tgt.MATCH_ID = src.MATCH_ID) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "tgt.QUEUE_ID = src.QUEUE_ID, "
            + "tgt.PATCH_VERSION = src.PATCH_VERSION, "
            + "tgt.GAME_START_TIME = src.GAME_START_TIME "
            + "WHEN NOT MATCHED THEN INSERT "
            + "(MATCH_ID, QUEUE_ID, PATCH_VERSION, GAME_START_TIME, CREATED_AT) "
            + "VALUES (src.MATCH_ID, src.QUEUE_ID, src.PATCH_VERSION, src.GAME_START_TIME, SYSTIMESTAMP)";

    private static final String MERGE_PARTICIPANT_SQL =
        "MERGE INTO LOL_MATCH_PARTICIPANT tgt "
            + "USING (SELECT ? AS MATCH_ID, ? AS PUUID, ? AS CHAMPION_ID, ? AS LINE, ? AS WIN_YN, ? AS KILLS, ? AS DEATHS, ? AS ASSISTS FROM dual) src "
            + "ON (tgt.MATCH_ID = src.MATCH_ID AND tgt.PUUID = src.PUUID) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "tgt.CHAMPION_ID = src.CHAMPION_ID, "
            + "tgt.LINE = src.LINE, "
            + "tgt.WIN_YN = src.WIN_YN, "
            + "tgt.KILLS = src.KILLS, "
            + "tgt.DEATHS = src.DEATHS, "
            + "tgt.ASSISTS = src.ASSISTS "
            + "WHEN NOT MATCHED THEN INSERT "
            + "(MATCH_ID, PUUID, CHAMPION_ID, LINE, WIN_YN, KILLS, DEATHS, ASSISTS, CREATED_AT) "
            + "VALUES (src.MATCH_ID, src.PUUID, src.CHAMPION_ID, src.LINE, src.WIN_YN, src.KILLS, src.DEATHS, src.ASSISTS, SYSTIMESTAMP)";
    private static final int SOLO_RANKED_QUEUE_ID = 420;
    private static final String DELETE_CHAMPION_STATS_BY_QUEUE_SQL =
        "DELETE FROM LOL_CHAMPION_STATS WHERE QUEUE_ID = ?";
    private static final String INSERT_CHAMPION_STATS_SQL =
        "INSERT INTO LOL_CHAMPION_STATS ("
            + " PATCH_VERSION, QUEUE_ID, CHAMPION_ID, LINE, GAMES, WINS, LOSSES, WIN_RATE, PICK_RATE "
            + ") "
            + "SELECT M.PATCH_VERSION, M.QUEUE_ID, P.CHAMPION_ID, NVL(P.LINE, 'UNKNOWN') AS LINE, "
            + "COUNT(*) AS GAMES, "
            + "SUM(CASE WHEN P.WIN_YN = 'Y' THEN 1 ELSE 0 END) AS WINS, "
            + "SUM(CASE WHEN P.WIN_YN = 'N' THEN 1 ELSE 0 END) AS LOSSES, "
            + "ROUND(SUM(CASE WHEN P.WIN_YN = 'Y' THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) AS WIN_RATE, "
            + "ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER (PARTITION BY M.PATCH_VERSION, M.QUEUE_ID, NVL(P.LINE, 'UNKNOWN')), 2) AS PICK_RATE "
            + "FROM LOL_MATCH_PARTICIPANT P "
            + "JOIN LOL_MATCH M ON M.MATCH_ID = P.MATCH_ID "
            + "WHERE M.QUEUE_ID = ? "
            + "GROUP BY M.PATCH_VERSION, M.QUEUE_ID, P.CHAMPION_ID, NVL(P.LINE, 'UNKNOWN')";

    public MatchSaveSummary saveMatch(MatchRecord match, List<MatchParticipantRecord> participants) throws Exception {
        if (match == null || participants == null || participants.isEmpty()) {
            return new MatchSaveSummary(0, 0, 0, "저장할 매치 데이터가 없습니다.");
        }

        String dbUrl = readEnvOrDefault("LOL_DB_URL", DEFAULT_DB_URL);
        String dbUser = readEnvOrDefault("LOL_DB_USER", DEFAULT_DB_USER);
        String dbPassword = DEFAULT_DB_PASSWORD;
        Class.forName("oracle.jdbc.OracleDriver");

        int savedMatchCount = 0;
        int savedParticipantCount = 0;

        try (Connection connection = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            PreparedStatement matchPs = connection.prepareStatement(MERGE_MATCH_SQL);
            PreparedStatement participantPs = connection.prepareStatement(MERGE_PARTICIPANT_SQL)) {
            connection.setAutoCommit(false);

            matchPs.setString(1, match.matchId);
            matchPs.setInt(2, match.queueId);
            matchPs.setString(3, match.patchVersion);
            if (match.gameStartTime == null) {
                matchPs.setNull(4, java.sql.Types.BIGINT);
            } else {
                matchPs.setLong(4, match.gameStartTime);
            }
            savedMatchCount += matchPs.executeUpdate();

            for (MatchParticipantRecord participant : participants) {
                participantPs.setString(1, participant.matchId);
                participantPs.setString(2, participant.puuid);
                participantPs.setInt(3, participant.championId);
                participantPs.setString(4, participant.line);
                participantPs.setString(5, participant.winYn);
                participantPs.setInt(6, participant.kills);
                participantPs.setInt(7, participant.deaths);
                participantPs.setInt(8, participant.assists);
                savedParticipantCount += participantPs.executeUpdate();
            }

            connection.commit();
        }

        return new MatchSaveSummary(
            1,
            savedMatchCount,
            savedParticipantCount,
            "MATCH " + savedMatchCount + "건, PARTICIPANT " + savedParticipantCount + "건 저장"
        );
    }

    public ChampionStatsRefreshResult refreshChampionStatsForSoloRanked() throws Exception {
        String dbUrl = readEnvOrDefault("LOL_DB_URL", DEFAULT_DB_URL);
        String dbUser = readEnvOrDefault("LOL_DB_USER", DEFAULT_DB_USER);
        String dbPassword = DEFAULT_DB_PASSWORD;
        Class.forName("oracle.jdbc.OracleDriver");

        int deletedRows;
        int insertedRows;
        try (Connection connection = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            PreparedStatement deletePs = connection.prepareStatement(DELETE_CHAMPION_STATS_BY_QUEUE_SQL);
            PreparedStatement insertPs = connection.prepareStatement(INSERT_CHAMPION_STATS_SQL)) {
            connection.setAutoCommit(false);

            deletePs.setInt(1, SOLO_RANKED_QUEUE_ID);
            deletedRows = deletePs.executeUpdate();

            insertPs.setInt(1, SOLO_RANKED_QUEUE_ID);
            insertedRows = insertPs.executeUpdate();

            connection.commit();
        }

        return new ChampionStatsRefreshResult(
            deletedRows,
            insertedRows,
            "LOL_CHAMPION_STATS 재집계 완료 (삭제 " + deletedRows + "건, 삽입 " + insertedRows + "건)"
        );
    }

    private String readEnvOrDefault(String envKey, String defaultValue) {
        String value = System.getenv(envKey);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim();
    }

    public static class MatchRecord {
        public final String matchId;
        public final int queueId;
        public final String patchVersion;
        public final Long gameStartTime;

        public MatchRecord(String matchId, int queueId, String patchVersion, Long gameStartTime) {
            this.matchId = matchId;
            this.queueId = queueId;
            this.patchVersion = patchVersion;
            this.gameStartTime = gameStartTime;
        }
    }

    public static class MatchParticipantRecord {
        public final String matchId;
        public final String puuid;
        public final int championId;
        public final String line;
        public final String winYn;
        public final int kills;
        public final int deaths;
        public final int assists;

        public MatchParticipantRecord(
            String matchId,
            String puuid,
            int championId,
            String line,
            String winYn,
            int kills,
            int deaths,
            int assists
        ) {
            this.matchId = matchId;
            this.puuid = puuid;
            this.championId = championId;
            this.line = line;
            this.winYn = winYn;
            this.kills = kills;
            this.deaths = deaths;
            this.assists = assists;
        }
    }

    public static class MatchSaveSummary {
        public final int requestedMatchCount;
        public final int savedMatchCount;
        public final int savedParticipantCount;
        public final String message;

        public MatchSaveSummary(
            int requestedMatchCount,
            int savedMatchCount,
            int savedParticipantCount,
            String message
        ) {
            this.requestedMatchCount = requestedMatchCount;
            this.savedMatchCount = savedMatchCount;
            this.savedParticipantCount = savedParticipantCount;
            this.message = message;
        }
    }

    public static class ChampionStatsRefreshResult {
        public final int deletedRows;
        public final int insertedRows;
        public final String message;

        public ChampionStatsRefreshResult(int deletedRows, int insertedRows, String message) {
            this.deletedRows = deletedRows;
            this.insertedRows = insertedRows;
            this.message = message;
        }
    }
}
