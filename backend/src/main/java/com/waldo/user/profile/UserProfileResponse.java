package com.waldo.user.profile;

import com.waldo.TUser;

public record UserProfileResponse(
        Long no, String account, String name, String username, String phone, String authority) {

    public static UserProfileResponse from(TUser user) {
        return new UserProfileResponse(
                user.getNo(),
                user.getAccount(),
                user.getName(),
                user.getUsername(),
                user.getPhone(),
                user.getAuthority());
    }
}
