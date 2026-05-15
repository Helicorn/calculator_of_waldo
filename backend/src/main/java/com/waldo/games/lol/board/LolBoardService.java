package com.waldo.games.lol.board;

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

@Service
public class LolBoardService {

    private static final String NOT_DELETED = "N";

    private final LolBoardRepository boardRepository;
    private final LolBoardCommentRepository commentRepository;
    private final TUserRepository userRepository;

    public LolBoardService(
            LolBoardRepository boardRepository,
            LolBoardCommentRepository commentRepository,
            TUserRepository userRepository) {
        this.boardRepository = boardRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public String resolveAuthorAccount(long userNo) {
        return userRepository.findById(userNo)
                .map(this::pickAuthorLabel)
                .orElse("탈퇴회원");
    }

    private String pickAuthorLabel(TUser user) {
        String account = user.getAccount();
        if (account != null && !account.isBlank()) {
            return account.trim();
        }
        String username = user.getUsername();
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        return "회원" + user.getNo();
    }

    @Transactional(readOnly = true)
    public Page<LolBoardEntity> listBoards(Pageable pageable) {
        return boardRepository.findByDelYnOrderByCreatedAtDesc(NOT_DELETED, pageable);
    }

    @Transactional
    public LolBoardEntity getBoardAndIncrementView(long boardId) {
        LolBoardEntity board = requireActiveBoard(boardId);
        board.setViewCnt(board.getViewCnt() + 1);
        return boardRepository.save(board);
    }

    @Transactional
    public LolBoardEntity createBoard(long userNo, String title, String content) {
        LolBoardEntity entity = new LolBoardEntity();
        entity.setUserNo(userNo);
        entity.setTitle(title.trim());
        entity.setContent(content);
        entity.setViewCnt(0);
        entity.setCommentCnt(0);
        entity.setDelYn(NOT_DELETED);
        return boardRepository.save(entity);
    }

    @Transactional
    public LolBoardEntity updateBoard(long boardId, long userNo, String title, String content) {
        LolBoardEntity board = requireActiveBoard(boardId);
        if (!board.getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        board.setTitle(title.trim());
        board.setContent(content);
        return boardRepository.save(board);
    }

    @Transactional
    public void deleteBoard(long boardId, long userNo) {
        LolBoardEntity board = requireActiveBoard(boardId);
        if (!board.getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        board.setDelYn("Y");
        boardRepository.save(board);
    }

    @Transactional(readOnly = true)
    public List<LolBoardCommentEntity> listComments(long boardId) {
        requireActiveBoard(boardId);
        return commentRepository.findByBoardIdAndDelYnOrderByCreatedAtAsc(boardId, NOT_DELETED);
    }

    @Transactional
    public LolBoardCommentEntity createComment(
            long boardId,
            long userNo,
            String content,
            Long parentCommentId) {
        LolBoardEntity board = requireActiveBoard(boardId);
        if (parentCommentId != null) {
            LolBoardCommentEntity parent = commentRepository
                    .findByCommentIdAndDelYn(parentCommentId, NOT_DELETED)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
            if (!parent.getBoardId().equals(boardId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            }
        }

        LolBoardCommentEntity comment = new LolBoardCommentEntity();
        comment.setBoardId(boardId);
        comment.setUserNo(userNo);
        comment.setParentCommentId(parentCommentId);
        comment.setContent(content.trim());
        comment.setDelYn(NOT_DELETED);
        LolBoardCommentEntity saved = commentRepository.save(comment);

        board.setCommentCnt(board.getCommentCnt() + 1);
        boardRepository.save(board);
        return saved;
    }

    @Transactional
    public void deleteComment(long commentId, long userNo) {
        LolBoardCommentEntity comment = commentRepository
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
        LolBoardEntity current = requireActiveBoard(boardId);
        Long previousBoardId = boardRepository
                .findOlderNeighbor(current.getCreatedAt(), current.getBoardId())
                .map(LolBoardEntity::getBoardId)
                .orElse(null);
        Long nextBoardId = boardRepository
                .findNewerNeighbor(current.getCreatedAt(), current.getBoardId())
                .map(LolBoardEntity::getBoardId)
                .orElse(null);
        return new BoardNavigation(previousBoardId, nextBoardId);
    }

    private LolBoardEntity requireActiveBoard(long boardId) {
        Optional<LolBoardEntity> board = boardRepository.findByBoardIdAndDelYn(boardId, NOT_DELETED);
        return board.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public record BoardNavigation(Long previousBoardId, Long nextBoardId) {
    }
}
