package com.waldo;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

/**
 * Oracle T_USER 테이블 매핑 (컬럼 정의는 DB 스키마와 동일).
 * <p>NO는 시퀀스 {@code seq_t_user_no}로 채번합니다. DB에 없으면 생성하거나 {@code sequenceName}을 수정하세요.
 */
@Entity
@Table(name = "T_USER")
public class TUser {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "t_user_no_seq")
    @SequenceGenerator(name = "t_user_no_seq", sequenceName = "seq_t_user_no", allocationSize = 1)
    @Column(name = "NO", nullable = false)
    private Long no;

    @Column(name = "ACCOUNT", length = 30)
    private String account;

    @Column(name = "NAME", length = 30)
    private String name;

    @JsonIgnore
    @Column(name = "PASSWORD", length = 4000)
    private String password;

    @Column(name = "PHONE", length = 30)
    private String phone;

    @Column(name = "DELYN", length = 1, nullable = false)
    private String delYn;

    @Column(name = "USERNAME", length = 30)
    private String username;

    @Column(name = "AUTHORITY", length = 30)
    private String authority;

    @Column(name = "REG_DT", nullable = false)
    private LocalDateTime regDt;

    @Column(name = "UPD_DT")
    private LocalDateTime updDt;

    @Column(name = "LAST_LOGIN_DT")
    private LocalDateTime lastLoginDt;

    public Long getNo() {
        return no;
    }

    public void setNo(Long no) {
        this.no = no;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDelYn() {
        return delYn;
    }

    public void setDelYn(String delYn) {
        this.delYn = delYn;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAuthority() {
        return authority;
    }

    public void setAuthority(String authority) {
        this.authority = authority;
    }

    public LocalDateTime getRegDt() {
        return regDt;
    }

    public void setRegDt(LocalDateTime regDt) {
        this.regDt = regDt;
    }

    public LocalDateTime getUpdDt() {
        return updDt;
    }

    public void setUpdDt(LocalDateTime updDt) {
        this.updDt = updDt;
    }

    public LocalDateTime getLastLoginDt() {
        return lastLoginDt;
    }

    public void setLastLoginDt(LocalDateTime lastLoginDt) {
        this.lastLoginDt = lastLoginDt;
    }
}
