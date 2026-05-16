package com.waldo.games.lol.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
 * LoL 자유게시판 API.
 *
 * <p>예: {@code GET /api/waldo/games/lol/board}
 */
@RestController
@RequestMapping("/api/waldo/games/lol/board")
public class LolBoardController {

    private final LolBoardService boardService;
    private final LoginSessionService loginSessionService;

    public LolBoardController(LolBoardService boardService, LoginSessionService loginSessionService) {
        this.boardService = boardService;
        this.loginSessionService = loginSessionService;
    }

    @GetMapping
    public ResponseEntity<BoardListPageResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        LolBoardService.BoardListPartition partition = boardService.listBoardsForPage(pageable);
        List<BoardSummaryResponse> pinned = partition.pinnedNotices().stream()
                .map(LolBoardController::toSummary)
                .toList();
        Page<BoardSummaryResponse> regularPage = partition.regularPage().map(LolBoardController::toSummary);
        return ResponseEntity.ok(BoardListPageResponse.of(pinned, regularPage));
    }

    /** 게시글 말머리 목록 (글쓰기 셀렉트 등). {@code /heads}는 {@code /{boardId}} 보다 먼저 매칭되도록 선언합니다. */
    @GetMapping("/heads")
    public ResponseEntity<List<BoardHeadResponse>> heads() {
        List<BoardHeadResponse> rows = boardService.listBoardHeads().stream()
                .map(h -> new BoardHeadResponse(h.getHeadId(), h.getLabel(), h.getSortOrder()))
                .toList();
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<BoardDetailResponse> get(@PathVariable long boardId) {
        LolBoardEntity board = boardService.getBoardAndIncrementView(boardId);
        String authorAccount = boardService.resolveAuthorAccount(board.getUserNo());
        return ResponseEntity.ok(toDetail(board, authorAccount));
    }

    @GetMapping("/{boardId}/navigation")
    public ResponseEntity<BoardNavigationResponse> navigation(@PathVariable long boardId) {
        LolBoardService.BoardNavigation navigation = boardService.resolveNavigation(boardId);
        return ResponseEntity.ok(new BoardNavigationResponse(
                navigation.previousBoardId(),
                navigation.nextBoardId()));
    }

    @PostMapping
    public ResponseEntity<BoardDetailResponse> create(
            @RequestBody BoardWriteRequest body,
            HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        if (isBlank(body.title()) || isBlank(body.content())) {
            return ResponseEntity.badRequest().build();
        }
        LolBoardEntity saved = boardService.createBoard(
                user.no(),
                body.title(),
                body.content(),
                Boolean.TRUE.equals(body.noticeYn()),
                body.headId());
        return ResponseEntity.status(HttpStatus.CREATED).body(
                toDetail(saved, boardService.resolveAuthorAccount(saved.getUserNo())));
    }

    @PatchMapping("/{boardId}")
    public ResponseEntity<BoardDetailResponse> update(
            @PathVariable long boardId,
            @RequestBody BoardWriteRequest body,
            HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        if (isBlank(body.title()) || isBlank(body.content())) {
            return ResponseEntity.badRequest().build();
        }
        LolBoardEntity saved = boardService.updateBoard(
                boardId,
                user.no(),
                body.title(),
                body.content(),
                body.noticeYn(),
                body.headId());
        return ResponseEntity.ok(
                toDetail(saved, boardService.resolveAuthorAccount(saved.getUserNo())));
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> delete(@PathVariable long boardId, HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        boardService.deleteBoard(boardId, user);
        return ResponseEntity.noContent().build();
    }

    private LoginUserResponse requireUser(HttpServletRequest request) {
        Optional<LoginUserResponse> current = loginSessionService.getCurrentUser(request);
        return current.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED));
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static BoardSummaryResponse toSummary(LolBoardEntity board) {
        return new BoardSummaryResponse(
                board.getBoardId(),
                board.getUserNo(),
                board.getTitle(),
                board.getViewCnt(),
                board.getCommentCnt(),
                "Y".equals(board.getNoticeYn()),
                headIdOf(board),
                headLabelOf(board),
                board.getCreatedAt(),
                board.getUpdatedAt());
    }

    private static BoardDetailResponse toDetail(LolBoardEntity board, String authorAccount) {
        return new BoardDetailResponse(
                board.getBoardId(),
                board.getUserNo(),
                authorAccount,
                board.getTitle(),
                board.getContent(),
                board.getViewCnt(),
                board.getCommentCnt(),
                "Y".equals(board.getNoticeYn()),
                headIdOf(board),
                headLabelOf(board),
                board.getCreatedAt(),
                board.getUpdatedAt());
    }

    private static Long headIdOf(LolBoardEntity board) {
        return board.getHead() != null ? board.getHead().getHeadId() : null;
    }

    private static String headLabelOf(LolBoardEntity board) {
        return board.getHead() != null ? board.getHead().getLabel() : null;
    }

    public record BoardNavigationResponse(Long previousBoardId, Long nextBoardId) {
    }

    /**
     * {@code pinnedNotices}: 모든 공지(페이지와 무관). {@code content}: 해당 페이지 일반글만.
     */
    public record BoardListPageResponse(
            List<BoardSummaryResponse> pinnedNotices,
            List<BoardSummaryResponse> content,
            long totalElements,
            int totalPages,
            int number,
            int size,
            boolean first,
            boolean last,
            boolean empty) {

        public static BoardListPageResponse of(List<BoardSummaryResponse> pinned, Page<BoardSummaryResponse> page) {
            long totalAll = pinned.size() + page.getTotalElements();
            int totalPages = page.getTotalPages();
            if (totalPages < 1) {
                totalPages = 1;
            }
            boolean entirelyEmpty = pinned.isEmpty() && page.isEmpty();
            return new BoardListPageResponse(
                    pinned,
                    page.getContent(),
                    totalAll,
                    totalPages,
                    page.getNumber(),
                    page.getSize(),
                    page.isFirst(),
                    page.isLast(),
                    entirelyEmpty);
        }
    }

    public record BoardHeadResponse(Long headId, String label, int sortOrder) {
    }

    /** 수정 시 {@code headId} 생략/null은 말머리 없음으로 적용됩니다. 클라이언트는 기존 값을 유지할 때도 명시하는 것을 권장합니다. */
    public record BoardWriteRequest(String title, String content, Boolean noticeYn, Long headId) {
    }

    public record BoardSummaryResponse(
            Long boardId,
            Long userNo,
            String title,
            int viewCnt,
            int commentCnt,
            boolean noticeYn,
            Long headId,
            String headLabel,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record BoardDetailResponse(
            Long boardId,
            Long userNo,
            String authorAccount,
            String title,
            String content,
            int viewCnt,
            int commentCnt,
            boolean noticeYn,
            Long headId,
            String headLabel,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }
}
