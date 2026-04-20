package com.waldo.user;

/**
 * T_USER 신규 등록 요청 본문 (PASSWORD는 저장 시에만 사용, 응답에는 포함하지 않음).
 */
public record TUserCreateRequest(
        String account,
        String name,
        String password,
        String phone,
        String username,
        String authority,
        String delYn) {}
