package com.waldo.user;

import java.io.Serial;
import java.io.Serializable;

import com.waldo.TUser;

public record LoginUserResponse(
        Long no,
        String account,
        String name,
        String username,
        String authority,
        String phone)
        implements Serializable {

    @Serial
    private static final long serialVersionUID = 2L;

    public static LoginUserResponse from(TUser user) {
        return new LoginUserResponse(
                user.getNo(),
                user.getAccount(),
                user.getName(),
                user.getUsername(),
                user.getAuthority(),
                user.getPhone());
    }
}
