package com.waldo.user.session;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.waldo.user.LoginUserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Service
public class LoginSessionService {

    public void establishSession(HttpServletRequest request, LoginUserResponse user) {
        HttpSession old = request.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SessionAttributeKeys.LOGIN_USER, user);
    }

    public Optional<LoginUserResponse> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        Object attr = session.getAttribute(SessionAttributeKeys.LOGIN_USER);
        if (attr instanceof LoginUserResponse loginUser) {
            return Optional.of(loginUser);
        }
        return Optional.empty();
    }

    public void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    /** 로그인 세션에 저장된 사용자 정보를 갱신합니다(프로필 수정 후 등). */
    public void replaceSessionUser(HttpServletRequest request, LoginUserResponse user) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.setAttribute(SessionAttributeKeys.LOGIN_USER, user);
        }
    }
}
