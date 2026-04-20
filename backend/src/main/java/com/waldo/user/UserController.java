package com.waldo.user;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

import com.waldo.PasswordHasher;
import com.waldo.TUser;
import com.waldo.TUserRepository;
import com.waldo.user.session.LoginSessionService;
import com.waldo.user.signup.SignupRepository;
import com.waldo.user.signup.SignupRequest;

@RestController
@RequestMapping("/api")
public class UserController {

    private final TUserRepository tUserRepository;
    private final SignupRepository signupRepository;
    private final LoginSessionService loginSessionService;

    public UserController(
            TUserRepository tUserRepository,
            SignupRepository signupRepository,
            LoginSessionService loginSessionService) {
        this.tUserRepository = tUserRepository;
        this.signupRepository = signupRepository;
        this.loginSessionService = loginSessionService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@RequestBody SignupRequest request) {
        String account = trimToNull(request.account());
        String password = request.password();
        String name = trimToNull(request.name());
        String phone = trimToNull(request.phone());
        String username = trimToNull(request.username());

        if (account == null || password == null || password.isBlank() || name == null || name.isBlank() || phone == null || phone.isBlank() || username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "account, password, name, phone, and username are required");
        }

        if (signupRepository.registerNewUser(account, password, name, phone, username).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already exists");
        }
        return ResponseEntity.ok(null);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginUserResponse> login(
            @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String account = trimToNull(request.account());
        String password = request.password();

        if (account == null || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "account and password are required");
        }

        Optional<TUser> found = tUserRepository.findByAccount(account);
        if (found.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid account or password");
        }

        TUser user = found.get();
        if (!"N".equalsIgnoreCase(user.getDelYn())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid account or password");
        }

        String stored = user.getPassword();
        if (!PasswordHasher.matches(password, stored)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid account or password");
        }

        if (PasswordHasher.needsUpgrade(stored)) {
            user.setPassword(PasswordHasher.hash(password));
        }
        user.setLastLoginDt(LocalDateTime.now());
        tUserRepository.save(user);

        LoginUserResponse body = LoginUserResponse.from(user);
        loginSessionService.establishSession(httpRequest, body);

        return ResponseEntity.ok(body);
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
