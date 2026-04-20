package com.waldo.games.pokemon;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.waldo.user.LoginUserResponse;
import com.waldo.user.session.LoginSessionService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 포켓몬 게임 관련 API. 프론트 갱신 버튼은 {@code POST /api/waldo/games/pokemon} 로 연결.
 */
@RestController
@RequestMapping("/api/waldo/games/pokemon")
public class PokemonGamesController {

    private final PokemonAbilitySyncService pokemonAbilitySyncService;
    private final PokemonAbilityRepository pokemonAbilityRepository;
    private final LoginSessionService loginSessionService;

    public PokemonGamesController(
            PokemonAbilitySyncService pokemonAbilitySyncService,
            PokemonAbilityRepository pokemonAbilityRepository,
            LoginSessionService loginSessionService) {
        this.pokemonAbilitySyncService = pokemonAbilitySyncService;
        this.pokemonAbilityRepository = pokemonAbilityRepository;
        this.loginSessionService = loginSessionService;
    }

    @GetMapping("/abilities")
    public ResponseEntity<List<AbilityRowResponse>> listAbilities() {
        List<AbilityRowResponse> rows = pokemonAbilityRepository.findAll().stream()
                .sorted(Comparator.comparing(PokemonAbilityEntity::getAbilityId))
                .map(a -> new AbilityRowResponse(
                        a.getAbilityId(),
                        a.getAbilityNameKo(),
                        a.getAbilityNameEn(),
                        a.getEffectKo()))
                .toList();
        return ResponseEntity.ok(rows);
    }

    /**
     * {@code t_user.authority == "0"} 인 로그인 사용자만 한글명·설명을 수정할 수 있습니다.
     * 설명은 {@code EFFECT_KO}에 저장되며, 값이 있으면 {@code TRANSLATION_STATUS}를 {@code DONE}으로 둡니다.
     * 동기화가 덮어쓰지 않도록 {@code IS_MANUAL_OVERRIDE}는 {@code Y}로 둡니다.
     */
    @PatchMapping("/abilities/{abilityId}")
    public ResponseEntity<AbilityRowResponse> updateAbility(
            @PathVariable Long abilityId,
            @RequestBody AbilityUpdateRequest body,
            HttpServletRequest request) {
        Optional<LoginUserResponse> current = loginSessionService.getCurrentUser(request);
        if (current.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String auth = current.get().authority();
        if (auth == null || !"0".equals(auth.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Optional<PokemonAbilityEntity> opt = pokemonAbilityRepository.findById(abilityId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PokemonAbilityEntity entity = opt.get();
        if (body.nameKo() != null) {
            entity.setAbilityNameKo(trimToNull(body.nameKo()));
        }
        if (body.descKo() != null) {
            entity.setEffectKo(trimToNull(body.descKo()));
        }
        entity.setIsManualOverride("Y");
        String effectKo = entity.getEffectKo();
        boolean hasDescKo = effectKo != null && !effectKo.isBlank();
        entity.setTranslationStatus(hasDescKo ? "DONE" : "MANUAL");
        entity.setUpdatedAt(LocalDateTime.now());
        pokemonAbilityRepository.save(entity);
        return ResponseEntity.ok(new AbilityRowResponse(
                entity.getAbilityId(),
                entity.getAbilityNameKo(),
                entity.getAbilityNameEn(),
                entity.getEffectKo()));
    }

    public record AbilityUpdateRequest(String nameKo, String descKo) {
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> refresh() {
        PokemonAbilitySyncService.SyncResult result = pokemonAbilitySyncService.syncAllAbilities();
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "total", result.total(),
                "inserted", result.inserted(),
                "updated", result.updated(),
                "skippedManualOverride", result.skippedManualOverride()));
    }

    public record AbilityRowResponse(
            Long id,
            String nameKo,
            String nameEn,
            String descKo) {
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
