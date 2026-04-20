package com.waldo.user.profile;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.RequestMapping;

import com.waldo.PasswordHasher;
import com.waldo.TUser;
import com.waldo.TUserRepository;
import com.waldo.user.LoginUserResponse;
import com.waldo.user.session.LoginSessionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/user")
public class UserProfileController {

    private final TUserRepository tUserRepository;
    private final LoginSessionService loginSessionService;

    public UserProfileController(TUserRepository tUserRepository, LoginSessionService loginSessionService) {
        this.tUserRepository = tUserRepository;
        this.loginSessionService = loginSessionService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(HttpServletRequest httpRequest) {
        TUser user = requireSessionUser(httpRequest);
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody UserProfileUpdateRequest req, HttpServletRequest httpRequest) {
        TUser user = requireSessionUser(httpRequest);

        String username = trimToNull(req.username());
        String phone = trimToNull(req.phone());
        if (username == null || phone == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nickname(username) and phone are required");
        }

        user.setUsername(username);
        user.setPhone(phone);

        String password = req.password();
        String passwordConfirm = req.passwordConfirm();
        boolean changePassword = password != null && !password.isBlank();
        if (changePassword) {
            if (passwordConfirm == null || !password.equals(passwordConfirm)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password and password confirmation do not match");
            }
            user.setPassword(PasswordHasher.hash(password));
        }

        user.setUpdDt(LocalDateTime.now());
        tUserRepository.save(user);

        loginSessionService.replaceSessionUser(httpRequest, LoginUserResponse.from(user));

        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    private TUser requireSessionUser(HttpServletRequest httpRequest) {
        LoginUserResponse current = loginSessionService.getCurrentUser(httpRequest)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        TUser user = tUserRepository.findById(current.no())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!"N".equalsIgnoreCase(user.getDelYn())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user;
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
