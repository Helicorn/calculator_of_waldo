package com.waldo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TUserRepository extends JpaRepository<TUser, Long> {

    Optional<TUser> findByAccount(String account);
}
