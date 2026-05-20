package com.waldo.games.overwatch.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OverwatchBoardRepository extends JpaRepository<OverwatchBoardEntity, Long> {

    @EntityGraph(attributePaths = {"head"})
    List<OverwatchBoardEntity> findByDelYnAndNoticeYnOrderByCreatedAtDesc(String delYn, String noticeYn);

    @EntityGraph(attributePaths = {"head"})
    Page<OverwatchBoardEntity> findByDelYnAndNoticeYnOrderByCreatedAtDesc(
            String delYn,
            String noticeYn,
            Pageable pageable);

    Optional<OverwatchBoardEntity> findByBoardIdAndDelYn(Long boardId, String delYn);

    @Query("""
            SELECT b FROM OverwatchBoardEntity b
            WHERE b.delYn = 'N'
              AND (b.createdAt < :createdAt
                   OR (b.createdAt = :createdAt AND b.boardId < :boardId))
            ORDER BY b.createdAt DESC, b.boardId DESC
            LIMIT 1
            """)
    Optional<OverwatchBoardEntity> findOlderNeighbor(
            @Param("createdAt") LocalDateTime createdAt,
            @Param("boardId") Long boardId);

    @Query("""
            SELECT b FROM OverwatchBoardEntity b
            WHERE b.delYn = 'N'
              AND (b.createdAt > :createdAt
                   OR (b.createdAt = :createdAt AND b.boardId > :boardId))
            ORDER BY b.createdAt ASC, b.boardId ASC
            LIMIT 1
            """)
    Optional<OverwatchBoardEntity> findNewerNeighbor(
            @Param("createdAt") LocalDateTime createdAt,
            @Param("boardId") Long boardId);
}
