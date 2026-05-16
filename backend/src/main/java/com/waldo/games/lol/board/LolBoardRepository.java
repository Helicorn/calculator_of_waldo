package com.waldo.games.lol.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LolBoardRepository extends JpaRepository<LolBoardEntity, Long> {

    /** 목록 상단 고정용 공지(미삭제 전체). */
    @EntityGraph(attributePaths = {"head"})
    List<LolBoardEntity> findByDelYnAndNoticeYnOrderByCreatedAtDesc(String delYn, String noticeYn);

    /** 일반글만 페이지네이션(공지 제외). */
    @EntityGraph(attributePaths = {"head"})
    Page<LolBoardEntity> findByDelYnAndNoticeYnOrderByCreatedAtDesc(
            String delYn,
            String noticeYn,
            Pageable pageable);

    Optional<LolBoardEntity> findByBoardIdAndDelYn(Long boardId, String delYn);

    /** 목록(최신순) 기준 이전글: 더 예전에 작성된 글 */
    @Query("""
            SELECT b FROM LolBoardEntity b
            WHERE b.delYn = 'N'
              AND (b.createdAt < :createdAt
                   OR (b.createdAt = :createdAt AND b.boardId < :boardId))
            ORDER BY b.createdAt DESC, b.boardId DESC
            LIMIT 1
            """)
    Optional<LolBoardEntity> findOlderNeighbor(
            @Param("createdAt") LocalDateTime createdAt,
            @Param("boardId") Long boardId);

    /** 목록(최신순) 기준 다음글: 더 최근에 작성된 글 */
    @Query("""
            SELECT b FROM LolBoardEntity b
            WHERE b.delYn = 'N'
              AND (b.createdAt > :createdAt
                   OR (b.createdAt = :createdAt AND b.boardId > :boardId))
            ORDER BY b.createdAt ASC, b.boardId ASC
            LIMIT 1
            """)
    Optional<LolBoardEntity> findNewerNeighbor(
            @Param("createdAt") LocalDateTime createdAt,
            @Param("boardId") Long boardId);
}
