package com.waldo.games.pokemon;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PokemonAbilityRepository extends JpaRepository<PokemonAbilityEntity, Long> {
}
