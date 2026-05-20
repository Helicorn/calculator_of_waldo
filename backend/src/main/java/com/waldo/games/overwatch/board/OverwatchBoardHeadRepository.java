package com.waldo.games.overwatch.board;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OverwatchBoardHeadRepository extends JpaRepository<OverwatchBoardHeadEntity, Long> {

    List<OverwatchBoardHeadEntity> findAllByOrderBySortOrderAscHeadIdAsc();
}
