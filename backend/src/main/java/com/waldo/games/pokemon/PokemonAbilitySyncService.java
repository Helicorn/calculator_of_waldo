package com.waldo.games.pokemon;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PokemonAbilitySyncService {

    private static final String POKEAPI_ABILITY_LIST_URL = "https://pokeapi.co/api/v2/ability?limit=100000&offset=0";
    private static final String POKEAPI_ABILITY_DETAIL_BASE_URL = "https://pokeapi.co/api/v2/ability/";

    private final PokemonAbilityRepository pokemonAbilityRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PokemonAbilitySyncService(
            PokemonAbilityRepository pokemonAbilityRepository,
            ObjectMapper objectMapper) {
        this.pokemonAbilityRepository = pokemonAbilityRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().build();
    }

    @Transactional
    public SyncResult syncAllAbilities() {
        try {
            int total = 0;
            int inserted = 0;
            int updated = 0;
            int skippedManual = 0;

            JsonNode listRoot = fetchJson(POKEAPI_ABILITY_LIST_URL);
            JsonNode results = listRoot.path("results");
            if (!results.isArray()) {
                return new SyncResult(0, 0, 0, 0);
            }

            for (JsonNode item : results) {
                String abilityUrl = item.path("url").asText();
                Long abilityId = extractAbilityId(abilityUrl);
                if (abilityId == null) {
                    continue;
                }
                total++;

                Optional<PokemonAbilityEntity> existingOpt = pokemonAbilityRepository.findById(abilityId);
                if (existingOpt.isPresent()
                        && !isReviewNeeded(existingOpt.get().getTranslationStatus())) {
                    continue;
                }

                JsonNode detail = fetchJson(POKEAPI_ABILITY_DETAIL_BASE_URL + abilityId);
                String abilityNameEn = findLocalizedName(detail.path("names"), "en");
                String abilityNameKoFromApi = findLocalizedName(detail.path("names"), "ko");
                String effectEn = findLocalizedEffect(detail.path("effect_entries"), "en");
                String effectKoFromApi = findLocalizedEffect(detail.path("effect_entries"), "ko");

                PokemonAbilityEntity entity = existingOpt.orElseGet(PokemonAbilityEntity::new);

                boolean exists = entity.getAbilityId() != null;
                String prevNameEn = entity.getAbilityNameEn();
                String prevEffectEn = entity.getEffectEn();
                String newNameEn = trimToNull(abilityNameEn);
                String newEffectEn = trimToNull(effectEn);
                boolean enChanged = exists
                        && (!Objects.equals(trimToNull(prevNameEn), newNameEn)
                                || !Objects.equals(trimToNull(prevEffectEn), newEffectEn));

                boolean manualOverride = "Y".equalsIgnoreCase(entity.getIsManualOverride());

                entity.setAbilityId(abilityId);
                entity.setAbilityNameEn(newNameEn);
                entity.setEffectEn(newEffectEn);

                if (!manualOverride) {
                    entity.setAbilityNameKo(trimToNull(abilityNameKoFromApi));
                    entity.setEffectKo(trimToNull(effectKoFromApi));
                    if (enChanged) {
                        entity.setTranslationStatus("REVIEW_NEEDED");
                    } else {
                        entity.setTranslationStatus(resolveTranslationStatus(entity));
                    }
                } else {
                    skippedManual++;
                    if (enChanged) {
                        entity.setTranslationStatus("REVIEW_NEEDED");
                    } else if (entity.getTranslationStatus() == null || entity.getTranslationStatus().isBlank()) {
                        entity.setTranslationStatus("MANUAL");
                    }
                }

                if (entity.getIsManualOverride() == null || entity.getIsManualOverride().isBlank()) {
                    entity.setIsManualOverride("N");
                }

                LocalDateTime now = LocalDateTime.now();
                entity.setLastSyncedAt(now);
                entity.setUpdatedAt(now);
                pokemonAbilityRepository.save(entity);

                if (exists) {
                    updated++;
                } else {
                    inserted++;
                }
            }

            return new SyncResult(total, inserted, updated, skippedManual);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Pokemon ability sync failed", e);
        } catch (IOException e) {
            throw new RuntimeException("Pokemon ability sync failed", e);
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

    private static boolean isReviewNeeded(String translationStatus) {
        return translationStatus != null
                && "REVIEW_NEEDED".equalsIgnoreCase(translationStatus.trim());
    }

    private static String resolveTranslationStatus(PokemonAbilityEntity entity) {
        boolean hasKoName = entity.getAbilityNameKo() != null && !entity.getAbilityNameKo().isBlank();
        boolean hasKoEffect = entity.getEffectKo() != null && !entity.getEffectKo().isBlank();
        if (hasKoName && hasKoEffect) {
            return "COMPLETE";
        }
        return "MISSING_KO";
    }

    private static String findLocalizedName(JsonNode names, String language) {
        if (!names.isArray()) {
            return null;
        }
        Iterator<JsonNode> it = names.elements();
        while (it.hasNext()) {
            JsonNode node = it.next();
            if (language.equals(node.path("language").path("name").asText())) {
                return cleanText(node.path("name").asText(null));
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
            if (language.equals(node.path("language").path("name").asText())) {
                return cleanText(node.path("effect").asText(null));
            }
        }
        return null;
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

    private static Long extractAbilityId(String url) {
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

    public record SyncResult(
            int total,
            int inserted,
            int updated,
            int skippedManualOverride) {
    }
}
