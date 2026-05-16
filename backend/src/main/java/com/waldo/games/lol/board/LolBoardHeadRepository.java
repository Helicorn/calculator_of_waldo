package com.waldo.games.lol.board;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LolBoardHeadRepository extends JpaRepository<LolBoardHeadEntity, Long> {

    List<LolBoardHeadEntity> findAllByOrderBySortOrderAscHeadIdAsc();
}
