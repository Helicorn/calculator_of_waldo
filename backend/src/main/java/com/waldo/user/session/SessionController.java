package com.waldo.user.session;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.waldo.user.LoginUserResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class SessionController {

    private final LoginSessionService loginSessionService;

    public SessionController(LoginSessionService loginSessionService) {
        this.loginSessionService = loginSessionService;
    }

    @GetMapping("/me")
    public ResponseEntity<LoginUserResponse> me(HttpServletRequest httpRequest) {
        return loginSessionService.getCurrentUser(httpRequest)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        loginSessionService.invalidateSession(httpRequest);
        return ResponseEntity.noContent().build();
    }
}
