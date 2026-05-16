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
import com.waldo.user.LoginUserResponse;

@Service
public class LolBoardService {

    private static final String NOT_DELETED = "N";

    private final LolBoardRepository boardRepository;
    private final LolBoardCommentRepository commentRepository;
    private final LolBoardHeadRepository boardHeadRepository;
    private final TUserRepository userRepository;

    public LolBoardService(
            LolBoardRepository boardRepository,
            LolBoardCommentRepository commentRepository,
            LolBoardHeadRepository boardHeadRepository,
            TUserRepository userRepository) {
        this.boardRepository = boardRepository;
        this.commentRepository = commentRepository;
        this.boardHeadRepository = boardHeadRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LolBoardHeadEntity> listBoardHeads() {
        return boardHeadRepository.findAllByOrderBySortOrderAscHeadIdAsc();
    }

    @Transactional(readOnly = true)
    public String resolveAuthorAccount(long userNo) {
        return userRepository.findById(userNo)
                .map(this::pickAuthorLabel)
                .orElse("탈퇴회원");
    }

    /** 표시용 작성자명: 닉네임({@code USERNAME}) → 계정 → 회원번호 */
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

    /**
     * 목록: 공지는 전부 상단에 두고, 페이지 슬라이스는 일반글만 적용합니다.
     */
    @Transactional(readOnly = true)
    public BoardListPartition listBoardsForPage(Pageable pageable) {
        List<LolBoardEntity> pinned = boardRepository.findByDelYnAndNoticeYnOrderByCreatedAtDesc(NOT_DELETED, "Y");
        Page<LolBoardEntity> regular = boardRepository.findByDelYnAndNoticeYnOrderByCreatedAtDesc(
                NOT_DELETED,
                "N",
                pageable);
        return new BoardListPartition(pinned, regular);
    }

    @Transactional
    public LolBoardEntity getBoardAndIncrementView(long boardId) {
        LolBoardEntity board = requireActiveBoard(boardId);
        board.setViewCnt(board.getViewCnt() + 1);
        return boardRepository.save(board);
    }

    @Transactional
    public LolBoardEntity createBoard(long userNo, String title, String content, boolean noticeYn, Long headId) {
        LolBoardEntity entity = new LolBoardEntity();
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
    public LolBoardEntity updateBoard(
            long boardId,
            long userNo,
            String title,
            String content,
            Boolean noticeYn,
            Long headId) {
        LolBoardEntity board = requireActiveBoard(boardId);
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
        LolBoardEntity board = requireActiveBoard(boardId);
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

    /**
     * {@code headId == null} 이면 말머리 없음.
     */
    private LolBoardHeadEntity resolveHead(Long headId) {
        if (headId == null) {
            return null;
        }
        return boardHeadRepository.findById(headId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
    }

    public record BoardNavigation(Long previousBoardId, Long nextBoardId) {
    }

    public record BoardListPartition(List<LolBoardEntity> pinnedNotices, Page<LolBoardEntity> regularPage) {
    }
}
