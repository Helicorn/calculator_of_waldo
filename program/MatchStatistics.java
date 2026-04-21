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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
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

/**
 * 특정 버전 및 특정 티어의 매치 전적을 조회하고, 조회한 매치 전적을 데이터베이스에 저장하는 프로그램(솔로랭크, 에메랄드 1)
 * 원래 배치를 이용하여 매치 전적을 저장하려 했으나, 개인 취미 프로젝트 특성상 배치 이용이 부적합하여 수동으로 저장하는 방식으로 구현
 */

public class MatchStatistics extends JFrame {
    private static final DateTimeFormatter FILE_TIME_FORMAT =
        DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final Pattern JSON_STRING_PATTERN_TEMPLATE =
        Pattern.compile("\"%s\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
    /** {@code page}는 1부터 증가시키며, 빈 배열 응답이 나올 때까지 모두 조회한다. */
    private static final String LEAGUE_EXP_URL_TEMPLATE =
        "https://kr.api.riotgames.com/lol/league-exp/v4/entries/"
            + "RANKED_SOLO_5x5/EMERALD/I?page=%d";
    /** Riot 한 페이지당 항목 수보다 넉넉한 상한(비정상 응답 시 무한 루프 방지). */
    private static final int LEAGUE_EXP_MAX_PAGES = 1000;
    private static final int LEAGUE_EXP_MAX_RETRIES_PER_PAGE = 8;
    private static final long LEAGUE_EXP_DEFAULT_RETRY_WAIT_MS = 2000L;
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
    private final AtomicLong lastProgressAtMs = new AtomicLong();
    private final AtomicBoolean requestRunning = new AtomicBoolean(false);

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
        responseArea.setText("");
        requestRunning.set(true);
        lastProgressAtMs.set(System.currentTimeMillis());
        appendProgress("요청 시작");
        Thread heartbeatThread = startHeartbeatThread();

        Thread requestThread = new Thread(() -> {
            String result;
            try {
                appendProgress("league-exp 전체 페이지 조회 시작");
                ApiResponse response = callLeagueExp(apiKey);
                appendProgress("league-exp 조회 완료 (HTTP " + response.statusCode + ")");
                Path savedPath = saveResponseToLogs(response);
                appendProgress("응답 로그 저장 완료: " + savedPath.toString());
                SeedSaveBundle seedSave = saveSeedPlayersToOracle(response);
                appendProgress("시드 저장 결과: " + seedSave.dbResult.message);
                MatchRepository.MatchSaveSummary matchSummary =
                    fetchAndSaveMatchesByPuuid(apiKey, seedSave.seedRows);
                appendProgress("매치 저장 결과: " + matchSummary.message);
                result = "저장 파일: " + savedPath.toString() + "\n\n"
                    + "DB 저장(시드): " + seedSave.dbResult.message + "\n"
                    + "DB 저장(매치): " + matchSummary.message + "\n\n"
                    + "HTTP " + response.statusCode + "\n\n"
                    + "(JSON 본문은 GUI에 표시하지 않습니다. 저장 파일을 확인하세요.)";
            } catch (Exception ex) {
                result = "호출 실패: " + ex.getMessage();
                appendProgress("오류: " + ex.getMessage());
            }

            String finalResult = result;
            requestRunning.set(false);
            heartbeatThread.interrupt();
            SwingUtilities.invokeLater(() -> {
                responseArea.append("\n=== 최종 결과 ===\n");
                responseArea.append(finalResult);
                requestButton.setEnabled(true);
            });
        });
        requestThread.start();
    }

    /**
     * league-exp-v4를 page=1부터 순회해, 빈 페이지가 나올 때까지 전부 받아 하나의 JSON 배열로 합친다.
     */
    private ApiResponse callLeagueExp(String apiKey) throws Exception {
        List<String> allObjectJson = new ArrayList<>();
        String lastContentType = "application/json";
        int lastStatus = 200;

        for (int page = 1; ; page++) {
            if (page > LEAGUE_EXP_MAX_PAGES) {
                throw new IOException(
                    "league-exp-v4 페이지 상한(" + LEAGUE_EXP_MAX_PAGES + ")에 도달했습니다. "
                        + "마지막 응답에 아직 항목이 있어 중단했습니다."
                );
            }

            if (page > 1) {
                try {
                    Thread.sleep(150);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("league-exp 페이지 조회가 중단되었습니다.", ie);
                }
            }

            String url = String.format(LEAGUE_EXP_URL_TEMPLATE, page);
            appendProgress("league-exp page " + page + " 조회 중...");
            ApiResponse pageResponse = callLeagueExpPageWithRetry(apiKey, url, page);
            lastStatus = pageResponse.statusCode;
            if (pageResponse.contentType != null && !pageResponse.contentType.isBlank()) {
                lastContentType = pageResponse.contentType;
            }

            if (pageResponse.statusCode < 200 || pageResponse.statusCode >= 300) {
                if (page == 1) {
                    return pageResponse;
                }
                throw new IOException(
                    "league-exp-v4 페이지 " + page + " HTTP 실패: " + pageResponse.statusCode
                );
            }

            List<String> pageObjects = splitTopLevelObjects(pageResponse.body.trim());
            if (pageObjects.isEmpty()) {
                appendProgress("league-exp page " + page + " 비어 있음 -> 페이지 순회 종료");
                break;
            }
            appendProgress("league-exp page " + page + " 항목 " + pageObjects.size() + "건 수집");
            allObjectJson.addAll(pageObjects);
        }

        if (allObjectJson.isEmpty()) {
            return new ApiResponse(lastStatus, "[]", lastContentType);
        }

        String mergedBody = "[" + String.join(",", allObjectJson) + "]";
        return new ApiResponse(lastStatus, mergedBody, lastContentType);
    }

    private ApiResponse callLeagueExpPageWithRetry(
        String apiKey,
        String urlString,
        int page
    ) throws Exception {
        for (int attempt = 1; attempt <= LEAGUE_EXP_MAX_RETRIES_PER_PAGE; attempt++) {
            ApiResponse response = callLeagueExpPage(apiKey, urlString);
            if (response.statusCode != 429) {
                return response;
            }

            if (attempt == LEAGUE_EXP_MAX_RETRIES_PER_PAGE) {
                return response;
            }

            long waitMs = resolveRetryWaitMs(response, attempt);
            long waitSeconds = Math.max(1L, waitMs / 1000L);
            appendProgress(
                "league-exp page " + page + " 429 제한 -> " + waitSeconds + "초 대기 후 재시도 ("
                    + attempt + "/" + LEAGUE_EXP_MAX_RETRIES_PER_PAGE + ")"
            );
            sleepQuietly(waitMs);
        }
        throw new IOException("league-exp-v4 페이지 " + page + " 재시도 로직이 비정상 종료되었습니다.");
    }

    private long resolveRetryWaitMs(ApiResponse response, int attempt) {
        if (response.retryAfterSeconds > 0) {
            return response.retryAfterSeconds * 1000L;
        }

        long exponential = LEAGUE_EXP_DEFAULT_RETRY_WAIT_MS * (1L << Math.min(attempt - 1, 6));
        return Math.min(exponential, 60_000L);
    }

    private void sleepQuietly(long waitMs) throws IOException {
        try {
            Thread.sleep(waitMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new IOException("league-exp 재시도 대기 중 인터럽트가 발생했습니다.", ie);
        }
    }

    private ApiResponse callLeagueExpPage(String apiKey, String urlString) throws Exception {
        HttpURLConnection connection = null;
        try {
            URL url = URI.create(urlString).toURL();
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(60000);
            connection.setRequestProperty("X-Riot-Token", apiKey);

            int statusCode = connection.getResponseCode();
            InputStream stream = statusCode >= 200 && statusCode < 300
                ? connection.getInputStream()
                : connection.getErrorStream();

            String body = readFully(stream);
            String contentType = connection.getHeaderField("Content-Type");
            int retryAfterSeconds = parseRetryAfterSeconds(connection.getHeaderField("Retry-After"));
            return new ApiResponse(statusCode, body, contentType, retryAfterSeconds);
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
        int playerIndex = 0;

        for (SeedPlayerRepository.SeedPlayerRow seedRow : seedRows) {
            playerIndex++;
            appendProgress("매치 수집 중... 플레이어 " + playerIndex + "/" + seedRows.size());
            List<String> matchIds = callMatchIdsByPuuid(apiKey, seedRow.puuid, MATCH_COUNT_PER_PLAYER);
            requestedMatchCount += matchIds.size();
            appendProgress("PUUID " + playerIndex + " 매치 ID " + matchIds.size() + "건");

            for (String matchId : matchIds) {
                ApiResponse matchResponse = callMatchDetail(apiKey, matchId);
                if (matchResponse.statusCode < 200 || matchResponse.statusCode >= 300) {
                    appendProgress("매치 상세 조회 실패 (" + matchId + ", HTTP " + matchResponse.statusCode + ")");
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
                appendProgress(
                    "매치 저장 진행: MATCH " + savedMatchCount + "건, PARTICIPANT " + savedParticipantCount + "건"
                );
            }
        }

        if (savedParticipantCount > 0) {
            appendProgress("챔피언 통계 집계 시작 (LOL_CHAMPION_STATS)...");
            MatchRepository.ChampionStatsRefreshResult statsResult =
                matchRepository.refreshChampionStatsForSoloRanked();
            appendProgress(statsResult.message);
        } else {
            appendProgress("저장된 PARTICIPANT가 없어 챔피언 통계 집계를 건너뜁니다.");
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
            String line = resolveLine(participantJson);

            if (isBlank(puuid) || championId == null || win == null) {
                continue;
            }

            participants.add(new MatchRepository.MatchParticipantRecord(
                matchId,
                puuid,
                championId,
                line,
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

    private String resolveLine(String participantJson) {
        String teamPosition = normalizeLineValue(extractJsonStringValue(participantJson, "teamPosition"));
        if (!isBlank(teamPosition)) {
            return teamPosition;
        }
        String individualPosition = normalizeLineValue(
            extractJsonStringValue(participantJson, "individualPosition")
        );
        if (!isBlank(individualPosition)) {
            return individualPosition;
        }
        String line = normalizeLineValue(extractJsonStringValue(participantJson, "line"));
        if (!isBlank(line)) {
            return line;
        }
        String lane = normalizeLineValue(extractJsonStringValue(participantJson, "lane"));
        return isBlank(lane) ? "UNKNOWN" : lane;
    }

    private String normalizeLineValue(String raw) {
        if (isBlank(raw)) {
            return "";
        }
        String v = raw.trim().toUpperCase();
        if ("NONE".equals(v) || "INVALID".equals(v)) {
            return "";
        }
        if ("UTILITY".equals(v)) {
            return "SUPPORT";
        }
        return v;
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

    private int parseRetryAfterSeconds(String retryAfterHeader) {
        if (retryAfterHeader == null || retryAfterHeader.isBlank()) {
            return -1;
        }
        try {
            return Integer.parseInt(retryAfterHeader.trim());
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private void appendProgress(String message) {
        String line = "[" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")) + "] " + message;
        lastProgressAtMs.set(System.currentTimeMillis());
        SwingUtilities.invokeLater(() -> responseArea.append(line + "\n"));
    }

    private Thread startHeartbeatThread() {
        Thread heartbeat = new Thread(() -> {
            long startedAt = System.currentTimeMillis();
            while (requestRunning.get()) {
                try {
                    Thread.sleep(5000L);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    return;
                }
                if (!requestRunning.get()) {
                    return;
                }

                long now = System.currentTimeMillis();
                long elapsedSec = (now - startedAt) / 1000L;
                long sinceLastProgressSec = (now - lastProgressAtMs.get()) / 1000L;
                appendProgress(
                    "요청 진행 중... 총 " + elapsedSec + "초 경과 (마지막 진행 로그 " + sinceLastProgressSec + "초 전)"
                );
            }
        });
        heartbeat.setDaemon(true);
        heartbeat.start();
        return heartbeat;
    }

    private static class ApiResponse {
        private final int statusCode;
        private final String body;
        private final String contentType;
        private final int retryAfterSeconds;

        private ApiResponse(int statusCode, String body, String contentType) {
            this(statusCode, body, contentType, -1);
        }

        private ApiResponse(int statusCode, String body, String contentType, int retryAfterSeconds) {
            this.statusCode = statusCode;
            this.body = body;
            this.contentType = contentType;
            this.retryAfterSeconds = retryAfterSeconds;
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
