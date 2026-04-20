package com.waldo.games.pokemon;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/**
 * 포켓몬 특성 번역/동기화 테이블 매핑.
 * 테이블명은 환경에 맞게 수정해 사용하세요.
 */
@Entity
@Table(name = "T_POKEMON_ABILITY")
public class PokemonAbilityEntity {

    @Id
    @Column(name = "ABILITY_ID", nullable = false)
    private Long abilityId;

    @Column(name = "ABILITY_NAME_EN", length = 100)
    private String abilityNameEn;

    @Lob
    @Column(name = "EFFECT_EN", columnDefinition = "CLOB")
    private String effectEn;

    @Column(name = "ABILITY_NAME_KO", length = 200)
    private String abilityNameKo;

    @Lob
    @Column(name = "EFFECT_KO", columnDefinition = "CLOB")
    private String effectKo;

    @Column(name = "TRANSLATION_STATUS", length = 20)
    private String translationStatus;

    @Column(name = "IS_MANUAL_OVERRIDE", length = 1)
    private String isManualOverride;

    @Column(name = "LAST_SYNCED_AT")
    private LocalDateTime lastSyncedAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    public Long getAbilityId() {
        return abilityId;
    }

    public void setAbilityId(Long abilityId) {
        this.abilityId = abilityId;
    }

    public String getAbilityNameEn() {
        return abilityNameEn;
    }

    public void setAbilityNameEn(String abilityNameEn) {
        this.abilityNameEn = abilityNameEn;
    }

    public String getEffectEn() {
        return effectEn;
    }

    public void setEffectEn(String effectEn) {
        this.effectEn = effectEn;
    }

    public String getAbilityNameKo() {
        return abilityNameKo;
    }

    public void setAbilityNameKo(String abilityNameKo) {
        this.abilityNameKo = abilityNameKo;
    }

    public String getEffectKo() {
        return effectKo;
    }

    public void setEffectKo(String effectKo) {
        this.effectKo = effectKo;
    }

    public String getTranslationStatus() {
        return translationStatus;
    }

    public void setTranslationStatus(String translationStatus) {
        this.translationStatus = translationStatus;
    }

    public String getIsManualOverride() {
        return isManualOverride;
    }

    public void setIsManualOverride(String isManualOverride) {
        this.isManualOverride = isManualOverride;
    }

    public LocalDateTime getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(LocalDateTime lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
