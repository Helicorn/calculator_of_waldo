package com.waldo.games.overwatch.board;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.waldo.user.LoginUserResponse;
import com.waldo.user.session.LoginSessionService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Overwatch 자유게시판 댓글 API.
 *
 * <p>예: {@code GET /api/waldo/games/overwatch/board/{boardId}/comments}
 */
@RestController
@RequestMapping("/api/waldo/games/overwatch/board/{boardId}/comments")
public class OverwatchBoardCommentController {

    private final OverwatchBoardService boardService;
    private final LoginSessionService loginSessionService;

    public OverwatchBoardCommentController(
            OverwatchBoardService boardService,
            LoginSessionService loginSessionService) {
        this.boardService = boardService;
        this.loginSessionService = loginSessionService;
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> list(@PathVariable long boardId) {
        List<CommentResponse> rows = boardService.listComments(boardId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    public ResponseEntity<CommentResponse> create(
            @PathVariable long boardId,
            @RequestBody CommentWriteRequest body,
            HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        if (body.content() == null || body.content().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        OverwatchBoardCommentEntity saved = boardService.createComment(
                boardId,
                user.no(),
                body.content(),
                body.parentCommentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable long boardId,
            @PathVariable long commentId,
            HttpServletRequest request) {
        LoginUserResponse user = requireUser(request);
        boardService.deleteComment(commentId, user.no());
        return ResponseEntity.noContent().build();
    }

    private LoginUserResponse requireUser(HttpServletRequest request) {
        Optional<LoginUserResponse> current = loginSessionService.getCurrentUser(request);
        return current.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED));
    }

    private CommentResponse toResponse(OverwatchBoardCommentEntity comment) {
        return new CommentResponse(
                comment.getCommentId(),
                comment.getBoardId(),
                comment.getUserNo(),
                boardService.resolveAuthorAccount(comment.getUserNo()),
                comment.getParentCommentId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }

    public record CommentWriteRequest(String content, Long parentCommentId) {
    }

    public record CommentResponse(
            Long commentId,
            Long boardId,
            Long userNo,
            String authorAccount,
            Long parentCommentId,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }
}
