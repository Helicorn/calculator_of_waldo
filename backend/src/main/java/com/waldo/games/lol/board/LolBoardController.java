package com.waldo.games.lol.board;

import java.time.LocalDateTime;
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
    public ResponseEntity<Page<BoardSummaryResponse>> list(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<BoardSummaryResponse> page = boardService.listBoards(pageable)
                .map(LolBoardController::toSummary);
        return ResponseEntity.ok(page);
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
        LolBoardEntity saved = boardService.createBoard(user.no(), body.title(), body.content());
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
        LolBoardEntity saved = boardService.updateBoard(boardId, user.no(), body.title(), body.content());
        return ResponseEntity.ok(
                toDetail(saved, boardService.resolveAuthorAccount(saved.getUserNo())));
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> delete(@PathVariable long boardId, HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        boardService.deleteBoard(boardId, user.no());
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
                board.getCreatedAt(),
                board.getUpdatedAt());
    }

    public record BoardNavigationResponse(Long previousBoardId, Long nextBoardId) {
    }

    public record BoardWriteRequest(String title, String content) {
    }

    public record BoardSummaryResponse(
            Long boardId,
            Long userNo,
            String title,
            int viewCnt,
            int commentCnt,
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
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }
}
