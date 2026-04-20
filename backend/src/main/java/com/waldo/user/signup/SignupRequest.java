package com.waldo.user.signup;

public record SignupRequest(String account, String password, String name, String phone, String username) {}