package com.waldo.user.data.pokemon;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PokemonMoveSyncService {

    private static final String POKEAPI_MOVE_LIST_URL =
            "https://pokeapi.co/api/v2/move?limit=100000&offset=0";

    private final PokemonMoveRepository pokemonMoveRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PokemonMoveSyncService(
            PokemonMoveRepository pokemonMoveRepository,
            ObjectMapper objectMapper) {
        this.pokemonMoveRepository = pokemonMoveRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().build();
    }

    @Transactional
    public SyncResult syncAllMoves() {
        try {
            int total = 0;
            int inserted = 0;
            int updated = 0;

            JsonNode listRoot = fetchJson(POKEAPI_MOVE_LIST_URL);
            JsonNode results = listRoot.path("results");
            if (!results.isArray()) {
                return new SyncResult(0, 0, 0);
            }

            for (JsonNode item : results) {
                String moveUrl = item.path("url").asText();
                Long moveId = extractMoveId(moveUrl);
                if (moveId == null) {
                    continue;
                }
                total++;

                Optional<PokemonMoveEntity> existingOpt = pokemonMoveRepository.findById(moveId);
                PokemonMoveEntity entity = existingOpt.orElseGet(PokemonMoveEntity::new);
                boolean exists = entity.getMoveId() != null;

                // "api 내 url" = pokeapi list의 각 item.url로부터 상세 정보를 가져옵니다.
                JsonNode detail = fetchJson(moveUrl);

                String moveNameEn = findLocalizedName(detail.path("names"), "en");
                String moveNameKo = findLocalizedName(detail.path("names"), "ko");

                String typeName = detail.path("type").path("name").asText(null);
                String damageClass = detail.path("damage_class").path("name").asText(null);

                Integer power = parseNullableInt(detail.path("power"));
                Integer accuracy = parseNullableInt(detail.path("accuracy"));
                Integer pp = parseNullableInt(detail.path("pp"));
                Integer priority = parseNullableInt(detail.path("priority"));
                Integer effectChance = parseNullableInt(detail.path("effect_chance"));

                String targetName = detail.path("target").path("name").asText(null);
                String shortEffectKo = findLocalizedShortEffect(detail.path("effect_entries"), "ko");

                entity.setMoveId(moveId);
                entity.setMoveNameEn(trimToNull(moveNameEn));
                entity.setMoveNameKo(trimToNull(moveNameKo));
                entity.setTypeName(trimToNull(typeName));
                entity.setDamageClass(trimToNull(damageClass));
                entity.setPower(power);
                entity.setAccuracy(accuracy);
                entity.setPp(pp);
                entity.setPriority(priority != null ? priority : 0);
                entity.setTargetName(trimToNull(targetName));
                entity.setShortEffectKo(trimToNull(shortEffectKo));
                entity.setEffectChance(effectChance);

                LocalDateTime now = LocalDateTime.now();
                if (!exists && entity.getCreatedAt() == null) {
                    entity.setCreatedAt(now);
                }
                entity.setUpdatedAt(now);

                pokemonMoveRepository.save(entity);

                if (exists) {
                    updated++;
                } else {
                    inserted++;
                }
            }

            return new SyncResult(total, inserted, updated);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Pokemon move sync failed", e);
        } catch (IOException e) {
            throw new RuntimeException("Pokemon move sync failed", e);
        }
    }

    private JsonNode fetchJson(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " from " + url);
        }
        return objectMapper.readTree(response.body());
    }

    private static String findLocalizedName(JsonNode names, String language) {
        if (!names.isArray()) {
            return null;
        }
        Iterator<JsonNode> it = names.elements();
        while (it.hasNext()) {
            JsonNode node = it.next();
            String lang = node.path("language").path("name").asText();
            if (language.equals(lang)) {
                String name = node.path("name").asText(null);
                return cleanText(name);
            }
        }
        return null;
    }

    private static String findLocalizedEffect(JsonNode effects, String language) {
        if (!effects.isArray()) {
            return null;
        }
        Iterator<JsonNode> it = effects.elements();
        while (it.hasNext()) {
            JsonNode node = it.next();
            String lang = node.path("language").path("name").asText();
            if (language.equals(lang)) {
                String effect = node.path("effect").asText(null);
                return cleanText(effect);
            }
        }
        return null;
    }

    private static String findLocalizedShortEffect(JsonNode effects, String language) {
        if (!effects.isArray()) {
            return null;
        }
        Iterator<JsonNode> it = effects.elements();
        while (it.hasNext()) {
            JsonNode node = it.next();
            String lang = node.path("language").path("name").asText();
            if (language.equals(lang)) {
                String shortEffect = node.path("short_effect").asText(null);
                return cleanText(shortEffect);
            }
        }
        return null;
    }

    private static Integer parseNullableInt(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) {
            return null;
        }
        if (!n.isInt() && !n.canConvertToInt()) {
            return null;
        }
        return n.asInt();
    }

    private static String cleanText(String s) {
        if (s == null) {
            return null;
        }
        return s.replace('\n', ' ').replace('\f', ' ').trim();
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static Long extractMoveId(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        int idx = trimmed.lastIndexOf('/');
        if (idx < 0 || idx + 1 >= trimmed.length()) {
            return null;
        }
        try {
            return Long.parseLong(trimmed.substring(idx + 1));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public record SyncResult(int total, int inserted, int updated) {
    }
}

