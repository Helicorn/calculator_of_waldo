package com.waldo.user.profile;

/**
 * 회원정보 수정 요청. 비밀번호를 바꾸지 않으면 {@code password}, {@code passwordConfirm} 은 비우거나 null.
 */
public record UserProfileUpdateRequest(
        String username,
        String phone,
        String password,
        String passwordConfirm) {
}
