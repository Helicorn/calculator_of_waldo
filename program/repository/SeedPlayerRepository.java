package program.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;

public class SeedPlayerRepository {
    private static final String DEFAULT_DB_URL = "jdbc:oracle:thin:@localhost:1521:xe";
    private static final String DEFAULT_DB_USER = "c##db1";
    private static final String DEFAULT_DB_PASSWORD = "wkddjwmf1234!@#$";

    private static final String MERGE_SQL =
        "MERGE INTO LOL_SEED_PLAYER tgt "
            + "USING (SELECT ? AS PUUID, ? AS TIER, ? AS RANK_DIVISION, ? AS QUEUE_TYPE FROM dual) src "
            + "ON (tgt.PUUID = src.PUUID) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "tgt.TIER = src.TIER, "
            + "tgt.RANK_DIVISION = src.RANK_DIVISION, "
            + "tgt.QUEUE_TYPE = src.QUEUE_TYPE, "
            + "tgt.IS_ACTIVE = 'Y', "
            + "tgt.UPDATED_AT = SYSTIMESTAMP "
            + "WHEN NOT MATCHED THEN INSERT "
            + "(PUUID, TIER, RANK_DIVISION, QUEUE_TYPE, IS_ACTIVE, CREATED_AT, UPDATED_AT) "
            + "VALUES (src.PUUID, src.TIER, src.RANK_DIVISION, src.QUEUE_TYPE, 'Y', SYSTIMESTAMP, SYSTIMESTAMP)";

    public DbSaveResult saveRows(List<SeedPlayerRow> rows) throws Exception {
        if (rows == null || rows.isEmpty()) {
            return new DbSaveResult(0, "저장할 데이터가 없습니다.");
        }

        String dbUrl = readEnvOrDefault("LOL_DB_URL", DEFAULT_DB_URL);
        String dbUser = readEnvOrDefault("LOL_DB_USER", DEFAULT_DB_USER);
        String dbPassword = DEFAULT_DB_PASSWORD;

        int affectedRows = 0;
        try (Connection connection = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            PreparedStatement ps = connection.prepareStatement(MERGE_SQL)) {
            connection.setAutoCommit(false);

            for (SeedPlayerRow row : rows) {
                ps.setString(1, row.puuid);
                ps.setString(2, row.tier);
                ps.setString(3, row.rankDivision);
                ps.setString(4, row.queueType);
                affectedRows += ps.executeUpdate();
            }

            connection.commit();
        }

        return new DbSaveResult(
            affectedRows,
            "총 " + rows.size() + "건 처리, DB 영향 row 수 " + affectedRows + "건"
        );
    }

    private String readEnvOrDefault(String envKey, String defaultValue) {
        String value = System.getenv(envKey);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim();
    }

    public static class SeedPlayerRow {
        public final String puuid;
        public final String tier;
        public final String rankDivision;
        public final String queueType;

        public SeedPlayerRow(String puuid, String tier, String rankDivision, String queueType) {
            this.puuid = puuid;
            this.tier = tier;
            this.rankDivision = rankDivision;
            this.queueType = queueType;
        }
    }

    public static class DbSaveResult {
        public final int affectedRows;
        public final String message;

        public DbSaveResult(int affectedRows, String message) {
            this.affectedRows = affectedRows;
            this.message = message;
        }
    }
}
