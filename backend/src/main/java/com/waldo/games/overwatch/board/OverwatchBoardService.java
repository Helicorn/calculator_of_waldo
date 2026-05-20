package com.waldo.games.overwatch.board;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.waldo.TUser;
import com.waldo.TUserRepository;
import com.waldo.user.LoginUserResponse;

@Service
public class OverwatchBoardService {

    private static final String NOT_DELETED = "N";

    private final OverwatchBoardRepository boardRepository;
    private final OverwatchBoardCommentRepository commentRepository;
    private final OverwatchBoardHeadRepository boardHeadRepository;
    private final TUserRepository userRepository;

    public OverwatchBoardService(
            OverwatchBoardRepository boardRepository,
            OverwatchBoardCommentRepository commentRepository,
            OverwatchBoardHeadRepository boardHeadRepository,
            TUserRepository userRepository) {
        this.boardRepository = boardRepository;
        this.commentRepository = commentRepository;
        this.boardHeadRepository = boardHeadRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<OverwatchBoardHeadEntity> listBoardHeads() {
        return boardHeadRepository.findAllByOrderBySortOrderAscHeadIdAsc();
    }

    @Transactional(readOnly = true)
    public String resolveAuthorAccount(long userNo) {
        return userRepository.findById(userNo)
                .map(this::pickAuthorLabel)
                .orElse("탈퇴회원");
    }

    private String pickAuthorLabel(TUser user) {
        String username = user.getUsername();
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        String account = user.getAccount();
        if (account != null && !account.isBlank()) {
            return account.trim();
        }
        return "회원" + user.getNo();
    }

    @Transactional(readOnly = true)
    public BoardListPartition listBoardsForPage(Pageable pageable) {
        List<OverwatchBoardEntity> pinned =
                boardRepository.findByDelYnAndNoticeYnOrderByCreatedAtDesc(NOT_DELETED, "Y");
        Page<OverwatchBoardEntity> regular =
                boardRepository.findByDelYnAndNoticeYnOrderByCreatedAtDesc(
                        NOT_DELETED,
                        "N",
                        pageable);
        return new BoardListPartition(pinned, regular);
    }

    @Transactional
    public OverwatchBoardEntity getBoardAndIncrementView(long boardId) {
        OverwatchBoardEntity board = requireActiveBoard(boardId);
        board.setViewCnt(board.getViewCnt() + 1);
        return boardRepository.save(board);
    }

    @Transactional
    public OverwatchBoardEntity createBoard(
            long userNo,
            String title,
            String content,
            boolean noticeYn,
            Long headId) {
        OverwatchBoardEntity entity = new OverwatchBoardEntity();
        entity.setUserNo(userNo);
        entity.setTitle(title.trim());
        entity.setContent(content);
        entity.setViewCnt(0);
        entity.setCommentCnt(0);
        entity.setNoticeYn(noticeYn ? "Y" : "N");
        entity.setHead(resolveHead(headId));
        entity.setDelYn(NOT_DELETED);
        return boardRepository.save(entity);
    }

    @Transactional
    public OverwatchBoardEntity updateBoard(
            long boardId,
            long userNo,
            String title,
            String content,
            Boolean noticeYn,
            Long headId) {
        OverwatchBoardEntity board = requireActiveBoard(boardId);
        if (!board.getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        board.setTitle(title.trim());
        board.setContent(content);
        if (noticeYn != null) {
            board.setNoticeYn(noticeYn ? "Y" : "N");
        }
        board.setHead(resolveHead(headId));
        return boardRepository.save(board);
    }

    @Transactional
    public void deleteBoard(long boardId, LoginUserResponse user) {
        OverwatchBoardEntity board = requireActiveBoard(boardId);
        if (!isAuthorityZero(user.authority()) && !board.getUserNo().equals(user.no())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        board.setDelYn("Y");
        boardRepository.save(board);
    }

    private static boolean isAuthorityZero(String authority) {
        return authority != null && "0".equals(authority.trim());
    }

    @Transactional(readOnly = true)
    public List<OverwatchBoardCommentEntity> listComments(long boardId) {
        requireActiveBoard(boardId);
        return commentRepository.findByBoardIdAndDelYnOrderByCreatedAtAsc(boardId, NOT_DELETED);
    }

    @Transactional
    public OverwatchBoardCommentEntity createComment(
            long boardId,
            long userNo,
            String content,
            Long parentCommentId) {
        OverwatchBoardEntity board = requireActiveBoard(boardId);
        if (parentCommentId != null) {
            OverwatchBoardCommentEntity parent = commentRepository
                    .findByCommentIdAndDelYn(parentCommentId, NOT_DELETED)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
            if (!parent.getBoardId().equals(boardId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            }
        }

        OverwatchBoardCommentEntity comment = new OverwatchBoardCommentEntity();
        comment.setBoardId(boardId);
        comment.setUserNo(userNo);
        comment.setParentCommentId(parentCommentId);
        comment.setContent(content.trim());
        comment.setDelYn(NOT_DELETED);
        OverwatchBoardCommentEntity saved = commentRepository.save(comment);

        board.setCommentCnt(board.getCommentCnt() + 1);
        boardRepository.save(board);
        return saved;
    }

    @Transactional
    public void deleteComment(long commentId, long userNo) {
        OverwatchBoardCommentEntity comment = commentRepository
                .findByCommentIdAndDelYn(commentId, NOT_DELETED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!comment.getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        comment.setDelYn("Y");
        commentRepository.save(comment);

        boardRepository.findByBoardIdAndDelYn(comment.getBoardId(), NOT_DELETED).ifPresent(board -> {
            board.setCommentCnt(Math.max(0, board.getCommentCnt() - 1));
            boardRepository.save(board);
        });
    }

    @Transactional(readOnly = true)
    public BoardNavigation resolveNavigation(long boardId) {
        OverwatchBoardEntity current = requireActiveBoard(boardId);
        Long previousBoardId = boardRepository
                .findOlderNeighbor(current.getCreatedAt(), current.getBoardId())
                .map(OverwatchBoardEntity::getBoardId)
                .orElse(null);
        Long nextBoardId = boardRepository
                .findNewerNeighbor(current.getCreatedAt(), current.getBoardId())
                .map(OverwatchBoardEntity::getBoardId)
                .orElse(null);
        return new BoardNavigation(previousBoardId, nextBoardId);
    }

    private OverwatchBoardEntity requireActiveBoard(long boardId) {
        Optional<OverwatchBoardEntity> board =
                boardRepository.findByBoardIdAndDelYn(boardId, NOT_DELETED);
        return board.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private OverwatchBoardHeadEntity resolveHead(Long headId) {
        if (headId == null) {
            return null;
        }
        return boardHeadRepository.findById(headId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
    }

    public record BoardNavigation(Long previousBoardId, Long nextBoardId) {
    }

    public record BoardListPartition(
            List<OverwatchBoardEntity> pinnedNotices,
            Page<OverwatchBoardEntity> regularPage) {
    }
}
