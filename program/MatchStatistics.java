package program;

import java.awt.BorderLayout;
import java.awt.GridLayout;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import program.repository.MatchRepository;
import program.repository.SeedPlayerRepository;

public class MatchStatistics extends JFrame {
    private static final DateTimeFormatter FILE_TIME_FORMAT =
        DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final Pattern JSON_STRING_PATTERN_TEMPLATE =
        Pattern.compile("\"%s\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
    private static final String LEAGUE_EXP_URL =
        "https://kr.api.riotgames.com/lol/league-exp/v4/entries/"
            + "RANKED_SOLO_5x5/EMERALD/I?page=1";
    private static final String MATCH_IDS_URL_TEMPLATE =
        "https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/%s/ids?start=0&count=%d";
    private static final String MATCH_DETAIL_URL_TEMPLATE =
        "https://asia.api.riotgames.com/lol/match/v5/matches/%s";
    private static final int MATCH_COUNT_PER_PLAYER = 5;

    private final JTextField riotApiKeyField = new JTextField();
    private final JTextArea responseArea = new JTextArea();
    private final JButton requestButton = new JButton("league-exp-v4 호출");
    private final SeedPlayerRepository seedPlayerRepository = new SeedPlayerRepository();
    private final MatchRepository matchRepository = new MatchRepository();

    public MatchStatistics() {
        setTitle("Match Statistics");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(760, 520);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));

        JPanel inputPanel = new JPanel(new GridLayout(1, 2, 8, 8));
        inputPanel.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        inputPanel.add(new JLabel("Riot API Key:"));
        inputPanel.add(riotApiKeyField);

        responseArea.setEditable(false);
        responseArea.setLineWrap(true);
        responseArea.setWrapStyleWord(true);
        responseArea.setText("버튼을 눌러 Riot league-exp-v4 응답을 확인하세요.");

        requestButton.addActionListener(event -> requestLeagueEntries());

        JPanel topPanel = new JPanel(new BorderLayout(8, 8));
        topPanel.add(inputPanel, BorderLayout.CENTER);
        topPanel.add(requestButton, BorderLayout.EAST);

        add(topPanel, BorderLayout.NORTH);
        add(new JScrollPane(responseArea), BorderLayout.CENTER);
    }

    private void requestLeagueEntries() {
        String apiKey = riotApiKeyField.getText().trim();
        if (apiKey.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Riot API Key를 입력해주세요.", "입력 오류", JOptionPane.ERROR_MESSAGE);
            return;
        }

        requestButton.setEnabled(false);
        responseArea.setText("요청 중...");

        Thread requestThread = new Thread(() -> {
            String result;
            try {
                ApiResponse response = callLeagueExp(apiKey);
                Path savedPath = saveResponseToLogs(response);
                SeedSaveBundle seedSave = saveSeedPlayersToOracle(response);
                MatchRepository.MatchSaveSummary matchSummary =
                    fetchAndSaveMatchesByPuuid(apiKey, seedSave.seedRows);
                result = "저장 파일: " + savedPath.toString() + "\n\n"
                    + "DB 저장(시드): " + seedSave.dbResult.message + "\n"
                    + "DB 저장(매치): " + matchSummary.message + "\n\n"
                    + "HTTP " + response.statusCode + "\n\n" + response.body;
            } catch (Exception ex) {
                result = "호출 실패: " + ex.getMessage();
            }

            String finalResult = result;
            SwingUtilities.invokeLater(() -> {
                responseArea.setText(finalResult);
                requestButton.setEnabled(true);
            });
        });
        requestThread.start();
    }

    private ApiResponse callLeagueExp(String apiKey) throws Exception {
        HttpURLConnection connection = null;
        try {
            URL url = URI.create(LEAGUE_EXP_URL).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);
            connection.setRequestProperty("X-Riot-Token", apiKey);

            int statusCode = connection.getResponseCode();
            InputStream stream = statusCode >= 200 && statusCode < 300
                ? connection.getInputStream()
                : connection.getErrorStream();

            String body = readFully(stream);
            String contentType = connection.getHeaderField("Content-Type");
            return new ApiResponse(statusCode, body, contentType);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private Path saveResponseToLogs(ApiResponse response) throws IOException {
        Path logsDir = Path.of("logs");
        Files.createDirectories(logsDir);

        String extension = isJsonResponse(response) ? ".json" : ".txt";
        String fileName = "league-exp-v4_" + FILE_TIME_FORMAT.format(LocalDateTime.now())
            + "_status-" + response.statusCode + extension;

        Path filePath = logsDir.resolve(fileName);
        Files.writeString(filePath, response.body, StandardCharsets.UTF_8);
        return filePath.toAbsolutePath().normalize();
    }

    private SeedSaveBundle saveSeedPlayersToOracle(ApiResponse response) throws Exception {
        if (response.statusCode < 200 || response.statusCode >= 300) {
            return new SeedSaveBundle(
                new SeedPlayerRepository.DbSaveResult(
                    0,
                    "HTTP 실패 응답이라 DB 저장을 건너뜁니다. (status=" + response.statusCode + ")"
                ),
                new ArrayList<>()
            );
        }

        List<SeedPlayerRepository.SeedPlayerRow> rows = parseSeedPlayers(response.body);
        if (rows.isEmpty()) {
            return new SeedSaveBundle(
                new SeedPlayerRepository.DbSaveResult(0, "저장할 데이터가 없습니다."),
                rows
            );
        }

        SeedPlayerRepository.DbSaveResult saveResult = seedPlayerRepository.saveRows(rows);
        return new SeedSaveBundle(saveResult, rows);
    }

    private List<SeedPlayerRepository.SeedPlayerRow> parseSeedPlayers(String jsonBody) {
        List<SeedPlayerRepository.SeedPlayerRow> rows = new ArrayList<>();
        if (jsonBody == null || jsonBody.isBlank()) {
            return rows;
        }

        for (String objectJson : splitTopLevelObjects(jsonBody)) {
            String puuid = extractJsonStringValue(objectJson, "puuid");
            String tier = extractJsonStringValue(objectJson, "tier");
            String rankDivision = extractJsonStringValue(objectJson, "rank");
            String queueType = extractJsonStringValue(objectJson, "queueType");

            if (!isBlank(puuid) && !isBlank(tier) && !isBlank(rankDivision) && !isBlank(queueType)) {
                rows.add(new SeedPlayerRepository.SeedPlayerRow(puuid, tier, rankDivision, queueType));
            }
        }
        return rows;
    }

    private List<String> splitTopLevelObjects(String jsonBody) {
        List<String> objects = new ArrayList<>();
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        int objectStart = -1;

        for (int i = 0; i < jsonBody.length(); i++) {
            char ch = jsonBody.charAt(i);

            if (escaped) {
                escaped = false;
                continue;
            }

            if (ch == '\\') {
                escaped = true;
                continue;
            }

            if (ch == '"') {
                inString = !inString;
                continue;
            }

            if (inString) {
                continue;
            }

            if (ch == '{') {
                if (depth == 0) {
                    objectStart = i;
                }
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0 && objectStart >= 0) {
                    objects.add(jsonBody.substring(objectStart, i + 1));
                    objectStart = -1;
                }
            }
        }

        return objects;
    }

    private String extractJsonStringValue(String jsonObject, String fieldName) {
        Pattern pattern = Pattern.compile(
            String.format(JSON_STRING_PATTERN_TEMPLATE.pattern(), Pattern.quote(fieldName))
        );
        Matcher matcher = pattern.matcher(jsonObject);
        if (!matcher.find()) {
            return "";
        }

        String value = matcher.group(1);
        return unescapeJsonString(value);
    }

    private String unescapeJsonString(String value) {
        return value
            .replace("\\\"", "\"")
            .replace("\\\\", "\\")
            .replace("\\n", "\n")
            .replace("\\t", "\t")
            .replace("\\r", "\r");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private MatchRepository.MatchSaveSummary fetchAndSaveMatchesByPuuid(
        String apiKey,
        List<SeedPlayerRepository.SeedPlayerRow> seedRows
    ) throws Exception {
        if (seedRows == null || seedRows.isEmpty()) {
            return new MatchRepository.MatchSaveSummary(0, 0, 0, "PUUID가 없어 매치 저장을 건너뜁니다.");
        }

        int requestedMatchCount = 0;
        int savedMatchCount = 0;
        int savedParticipantCount = 0;

        for (SeedPlayerRepository.SeedPlayerRow seedRow : seedRows) {
            List<String> matchIds = callMatchIdsByPuuid(apiKey, seedRow.puuid, MATCH_COUNT_PER_PLAYER);
            requestedMatchCount += matchIds.size();

            for (String matchId : matchIds) {
                ApiResponse matchResponse = callMatchDetail(apiKey, matchId);
                if (matchResponse.statusCode < 200 || matchResponse.statusCode >= 300) {
                    continue;
                }

                MatchRepository.MatchRecord matchRecord = parseMatchRecord(matchId, matchResponse.body);
                List<MatchRepository.MatchParticipantRecord> participants = parseMatchParticipants(
                    matchId,
                    matchResponse.body
                );

                if (matchRecord == null || participants.isEmpty()) {
                    continue;
                }

                MatchRepository.MatchSaveSummary oneResult = matchRepository.saveMatch(matchRecord, participants);
                savedMatchCount += oneResult.savedMatchCount;
                savedParticipantCount += oneResult.savedParticipantCount;
            }
        }

        return new MatchRepository.MatchSaveSummary(
            requestedMatchCount,
            savedMatchCount,
            savedParticipantCount,
            "요청 매치 " + requestedMatchCount + "건, 저장 MATCH " + savedMatchCount
                + "건, PARTICIPANT " + savedParticipantCount + "건"
        );
    }

    private List<String> callMatchIdsByPuuid(String apiKey, String puuid, int count) throws Exception {
        String encodedPuuid = URLEncoder.encode(puuid, StandardCharsets.UTF_8);
        String url = String.format(MATCH_IDS_URL_TEMPLATE, encodedPuuid, count);
        ApiResponse response = callRiotApi(url, apiKey);
        if (response.statusCode < 200 || response.statusCode >= 300) {
            return new ArrayList<>();
        }
        return parseJsonStringArray(response.body);
    }

    private ApiResponse callMatchDetail(String apiKey, String matchId) throws Exception {
        String encodedMatchId = URLEncoder.encode(matchId, StandardCharsets.UTF_8);
        String url = String.format(MATCH_DETAIL_URL_TEMPLATE, encodedMatchId);
        return callRiotApi(url, apiKey);
    }

    private ApiResponse callRiotApi(String urlString, String apiKey) throws Exception {
        HttpURLConnection connection = null;
        try {
            URL url = URI.create(urlString).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);
            connection.setRequestProperty("X-Riot-Token", apiKey);

            int statusCode = connection.getResponseCode();
            InputStream stream = statusCode >= 200 && statusCode < 300
                ? connection.getInputStream()
                : connection.getErrorStream();
            String body = readFully(stream);
            String contentType = connection.getHeaderField("Content-Type");
            return new ApiResponse(statusCode, body, contentType);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private List<String> parseJsonStringArray(String jsonBody) {
        List<String> values = new ArrayList<>();
        if (isBlank(jsonBody)) {
            return values;
        }

        Matcher matcher = Pattern.compile("\"((?:\\\\.|[^\"\\\\])*)\"").matcher(jsonBody);
        while (matcher.find()) {
            values.add(unescapeJsonString(matcher.group(1)));
        }
        return values;
    }

    private MatchRepository.MatchRecord parseMatchRecord(String matchId, String matchJson) {
        String infoJson = extractObjectByName(matchJson, "info");
        if (isBlank(infoJson)) {
            return null;
        }

        Integer queueId = extractJsonIntValue(infoJson, "queueId");
        Long gameStartTime = extractJsonLongValue(infoJson, "gameStartTimestamp");
        String gameVersion = extractJsonStringValue(infoJson, "gameVersion");
        String patchVersion = toPatchVersion(gameVersion);

        if (queueId == null || isBlank(patchVersion)) {
            return null;
        }

        return new MatchRepository.MatchRecord(matchId, queueId, patchVersion, gameStartTime);
    }

    private List<MatchRepository.MatchParticipantRecord> parseMatchParticipants(String matchId, String matchJson) {
        List<MatchRepository.MatchParticipantRecord> participants = new ArrayList<>();
        String infoJson = extractObjectByName(matchJson, "info");
        String participantsArray = extractArrayByName(infoJson, "participants");
        if (isBlank(participantsArray)) {
            return participants;
        }

        for (String participantJson : splitTopLevelObjects(participantsArray)) {
            String puuid = extractJsonStringValue(participantJson, "puuid");
            Integer championId = extractJsonIntValue(participantJson, "championId");
            Integer kills = extractJsonIntValue(participantJson, "kills");
            Integer deaths = extractJsonIntValue(participantJson, "deaths");
            Integer assists = extractJsonIntValue(participantJson, "assists");
            Boolean win = extractJsonBooleanValue(participantJson, "win");

            if (isBlank(puuid) || championId == null || win == null) {
                continue;
            }

            participants.add(new MatchRepository.MatchParticipantRecord(
                matchId,
                puuid,
                championId,
                win ? "Y" : "N",
                defaultZero(kills),
                defaultZero(deaths),
                defaultZero(assists)
            ));
        }

        return participants;
    }

    private Integer defaultZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String toPatchVersion(String gameVersion) {
        if (isBlank(gameVersion)) {
            return "";
        }
        Matcher matcher = Pattern.compile("(\\d+\\.\\d+)").matcher(gameVersion);
        return matcher.find() ? matcher.group(1) : "";
    }

    private String extractObjectByName(String json, String objectName) {
        if (isBlank(json)) {
            return "";
        }

        int keyIndex = json.indexOf("\"" + objectName + "\"");
        if (keyIndex < 0) {
            return "";
        }
        int objectStart = json.indexOf('{', keyIndex);
        if (objectStart < 0) {
            return "";
        }
        int objectEnd = findMatchingBracket(json, objectStart, '{', '}');
        if (objectEnd < 0) {
            return "";
        }
        return json.substring(objectStart, objectEnd + 1);
    }

    private String extractArrayByName(String json, String arrayName) {
        if (isBlank(json)) {
            return "";
        }

        int keyIndex = json.indexOf("\"" + arrayName + "\"");
        if (keyIndex < 0) {
            return "";
        }
        int arrayStart = json.indexOf('[', keyIndex);
        if (arrayStart < 0) {
            return "";
        }
        int arrayEnd = findMatchingBracket(json, arrayStart, '[', ']');
        if (arrayEnd < 0) {
            return "";
        }
        return json.substring(arrayStart, arrayEnd + 1);
    }

    private int findMatchingBracket(String text, int startIndex, char openBracket, char closeBracket) {
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int i = startIndex; i < text.length(); i++) {
            char ch = text.charAt(i);

            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch == '\\') {
                escaped = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }

            if (ch == openBracket) {
                depth++;
            } else if (ch == closeBracket) {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    private Integer extractJsonIntValue(String jsonObject, String fieldName) {
        Matcher matcher = Pattern.compile(
            String.format("\"%s\"\\s*:\\s*(-?\\d+)", Pattern.quote(fieldName))
        ).matcher(jsonObject);
        if (!matcher.find()) {
            return null;
        }
        return Integer.parseInt(matcher.group(1));
    }

    private Long extractJsonLongValue(String jsonObject, String fieldName) {
        Matcher matcher = Pattern.compile(
            String.format("\"%s\"\\s*:\\s*(-?\\d+)", Pattern.quote(fieldName))
        ).matcher(jsonObject);
        if (!matcher.find()) {
            return null;
        }
        return Long.parseLong(matcher.group(1));
    }

    private Boolean extractJsonBooleanValue(String jsonObject, String fieldName) {
        Matcher matcher = Pattern.compile(
            String.format("\"%s\"\\s*:\\s*(true|false)", Pattern.quote(fieldName))
        ).matcher(jsonObject);
        if (!matcher.find()) {
            return null;
        }
        return Boolean.parseBoolean(matcher.group(1));
    }

    private boolean isJsonResponse(ApiResponse response) {
        String contentType = response.contentType == null ? "" : response.contentType.toLowerCase();
        String body = response.body == null ? "" : response.body.trim();
        return contentType.contains("application/json")
            || body.startsWith("{")
            || body.startsWith("[");
    }

    private String readFully(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line).append('\n');
            }
        }
        return builder.toString();
    }

    private static class ApiResponse {
        private final int statusCode;
        private final String body;
        private final String contentType;

        private ApiResponse(int statusCode, String body, String contentType) {
            this.statusCode = statusCode;
            this.body = body;
            this.contentType = contentType;
        }
    }

    private static class SeedSaveBundle {
        private final SeedPlayerRepository.DbSaveResult dbResult;
        private final List<SeedPlayerRepository.SeedPlayerRow> seedRows;

        private SeedSaveBundle(
            SeedPlayerRepository.DbSaveResult dbResult,
            List<SeedPlayerRepository.SeedPlayerRow> seedRows
        ) {
            this.dbResult = dbResult;
            this.seedRows = seedRows;
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            MatchStatistics app = new MatchStatistics();
            app.setVisible(true);
        });
    }
}
