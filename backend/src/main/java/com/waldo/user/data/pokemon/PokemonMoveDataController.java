package com.waldo.user.data.pokemon;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.waldo.user.LoginUserResponse;
import com.waldo.user.session.LoginSessionService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 포켓몬 기술(move) 목록 동기화(데이터 관리용).
 *
 * - 호출: POST `/api/user/data/pokemon/moves`
 * - 소스: PokeAPI `/api/v2/move` 및 각 item의 url
 * - 저장: `T_POKEMON_MOVE`
 */
@RestController
@RequestMapping("/api/user/data/pokemon")
public class PokemonMoveDataController {

    private final PokemonMoveSyncService pokemonMoveSyncService;
    private final PokemonMoveRepository pokemonMoveRepository;
    private final LoginSessionService loginSessionService;

    public PokemonMoveDataController(
            PokemonMoveSyncService pokemonMoveSyncService,
            PokemonMoveRepository pokemonMoveRepository,
            LoginSessionService loginSessionService) {
        this.pokemonMoveSyncService = pokemonMoveSyncService;
        this.pokemonMoveRepository = pokemonMoveRepository;
        this.loginSessionService = loginSessionService;
    }

    /**
     * DB에 저장된 기술(move) 목록. 로그인 세션 필요.
     */
    @GetMapping("/moves")
    public ResponseEntity<List<MoveRowResponse>> listMoves(HttpServletRequest httpRequest) {
        LoginUserResponse current = requireSessionUser(httpRequest);
        current.no();
        List<MoveRowResponse> rows = pokemonMoveRepository.findAll().stream()
                .sorted(Comparator.comparing(PokemonMoveEntity::getMoveId))
                .map(e -> new MoveRowResponse(
                        e.getMoveId(),
                        e.getMoveNameKo(),
                        e.getMoveNameEn(),
                        e.getTypeName(),
                        e.getDamageClass(),
                        e.getPower(),
                        e.getPp(),
                        e.getShortEffectKo()))
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/moves")
    public ResponseEntity<Map<String, Object>> syncMoves(HttpServletRequest httpRequest) {
        LoginUserResponse current = requireSessionUser(httpRequest);
        // 사용자 정보는 현재는 권한 체크 용도로만 사용합니다.
        // 필요 시 authority 기반으로 추가 제한을 걸 수 있습니다.
        current.no();

        PokemonMoveSyncService.SyncResult result = pokemonMoveSyncService.syncAllMoves();
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "total", result.total(),
                "inserted", result.inserted(),
                "updated", result.updated(),
                "syncedAt", LocalDateTime.now().toString()));
    }

    private LoginUserResponse requireSessionUser(HttpServletRequest httpRequest) {
        return loginSessionService.getCurrentUser(httpRequest)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public record MoveRowResponse(
            Long id,
            String nameKo,
            String nameEn,
            String typeName,
            String damageClass,
            Integer power,
            Integer pp,
            String descKo) {
    }
}

