package com.waldo.games.lol.board;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LolBoardCommentRepository extends JpaRepository<LolBoardCommentEntity, Long> {

    List<LolBoardCommentEntity> findByBoardIdAndDelYnOrderByCreatedAtAsc(Long boardId, String delYn);

    Optional<LolBoardCommentEntity> findByCommentIdAndDelYn(Long commentId, String delYn);
}
