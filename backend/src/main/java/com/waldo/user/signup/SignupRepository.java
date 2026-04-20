package com.waldo.user.signup;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.waldo.PasswordHasher;
import com.waldo.TUser;
import com.waldo.TUserRepository;

@Repository
public class SignupRepository {

    private final TUserRepository tUserRepository;

    public SignupRepository(TUserRepository tUserRepository) {
        this.tUserRepository = tUserRepository;
    }

    /**
     * 신규 회원을 저장합니다. 동일 account가 이미 있으면 저장하지 않고 {@link Optional#empty()}를 반환합니다.
     */
    @Transactional
    public Optional<TUser> registerNewUser(
            String account,
            String plainPassword,
            String name,
            String phone,
            String username) {
        if (tUserRepository.findByAccount(account).isPresent()) {
            return Optional.empty();
        }
        TUser user = new TUser();
        user.setAccount(account);
        user.setPassword(PasswordHasher.hash(plainPassword));
        user.setName(name);
        user.setPhone(phone);
        user.setUsername(username);
        user.setAuthority("2");
        user.setDelYn("N");
        user.setRegDt(LocalDateTime.now());
        user.setUpdDt(null);
        user.setLastLoginDt(null);
        return Optional.of(tUserRepository.save(user));
    }
}
