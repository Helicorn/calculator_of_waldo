package com.waldo;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 비밀번호 해시 유틸리티.
 * 신규 저장은 BCrypt를 사용하고, 기존 SHA-256 저장값은 로그인 시 호환 검증 후 점진적으로 교체합니다.
 */
public final class PasswordHasher {

    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder(12);

    private PasswordHasher() {}

    public static String hash(String rawPassword) {
        return BCRYPT.encode(rawPassword);
    }

    public static boolean matches(String rawPassword, String storedHash) {
        if (storedHash == null || storedHash.isBlank()) {
            return false;
        }
        if (isBcryptHash(storedHash)) {
            return BCRYPT.matches(rawPassword, storedHash);
        }
        return sha256Hex(rawPassword).equalsIgnoreCase(storedHash);
    }

    public static boolean needsUpgrade(String storedHash) {
        return storedHash != null && !storedHash.isBlank() && !isBcryptHash(storedHash);
    }

    private static boolean isBcryptHash(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }

    private static String sha256Hex(String rawPassword) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
