package com.waldo.games.overwatch.board;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OverwatchBoardCommentRepository
        extends JpaRepository<OverwatchBoardCommentEntity, Long> {

    List<OverwatchBoardCommentEntity> findByBoardIdAndDelYnOrderByCreatedAtAsc(
            Long boardId,
            String delYn);

    Optional<OverwatchBoardCommentEntity> findByCommentIdAndDelYn(Long commentId, String delYn);
}
