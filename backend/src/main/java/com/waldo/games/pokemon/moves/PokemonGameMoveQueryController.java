package com.waldo.games.pokemon.moves;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.waldo.user.data.pokemon.PokemonMoveEntity;
import com.waldo.user.data.pokemon.PokemonMoveRepository;

/**
 * {@code T_POKEMON_MOVE} 조회 API.
 *
 * <p>예: {@code GET /api/waldo/games/pokemon/moves}
 */
@RestController
@RequestMapping("/api/waldo/games/pokemon/moves")
public class PokemonGameMoveQueryController {

    private final PokemonMoveRepository pokemonMoveRepository;

    public PokemonGameMoveQueryController(PokemonMoveRepository pokemonMoveRepository) {
        this.pokemonMoveRepository = pokemonMoveRepository;
    }

    @GetMapping
    public ResponseEntity<List<PokemonMoveRowResponse>> listMoves() {
        List<PokemonMoveRowResponse> rows = pokemonMoveRepository.findAll().stream()
                .sorted(Comparator.comparing(PokemonMoveEntity::getMoveId))
                .map(e -> new PokemonMoveRowResponse(
                        e.getMoveId(),
                        e.getMoveNameKo(),
                        e.getMoveNameEn(),
                        e.getTypeName(),
                        e.getPower(),
                        e.getDamageClass(),
                        e.getAccuracy()))
                .toList();
        return ResponseEntity.ok(rows);
    }

    public record PokemonMoveRowResponse(
            Long id,
            String nameKo,
            String nameEn,
            String typeName,
            Integer power,
            String damageClass,
            Integer accuracy) {
    }
}
