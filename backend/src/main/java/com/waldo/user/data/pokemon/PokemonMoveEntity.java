package com.waldo.user.data.pokemon;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * 포켓몬 기술(move) 테이블 매핑.
 */
@Entity
@Table(name = "T_POKEMON_MOVE")
public class PokemonMoveEntity {

    @Id
    @Column(name = "MOVE_ID", nullable = false)
    private Long moveId;

    @Column(name = "MOVE_NAME_EN", nullable = false, length = 100)
    private String moveNameEn;

    @Column(name = "MOVE_NAME_KO", length = 200)
    private String moveNameKo;

    @Column(name = "TYPE_NAME", nullable = false, length = 30)
    private String typeName;

    @Column(name = "DAMAGE_CLASS", nullable = false, length = 20)
    private String damageClass;

    @Column(name = "POWER")
    private Integer power;

    @Column(name = "ACCURACY")
    private Integer accuracy;

    @Column(name = "PP")
    private Integer pp;

    @Column(name = "PRIORITY")
    private Integer priority;

    @Column(name = "TARGET_NAME", length = 50)
    private String targetName;

    @Column(name = "SHORT_EFFECT_KO", length = 1000)
    private String shortEffectKo;

    @Column(name = "EFFECT_CHANCE")
    private Integer effectChance;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    public Long getMoveId() {
        return moveId;
    }

    public void setMoveId(Long moveId) {
        this.moveId = moveId;
    }

    public String getMoveNameEn() {
        return moveNameEn;
    }

    public void setMoveNameEn(String moveNameEn) {
        this.moveNameEn = moveNameEn;
    }

    public String getMoveNameKo() {
        return moveNameKo;
    }

    public void setMoveNameKo(String moveNameKo) {
        this.moveNameKo = moveNameKo;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public String getDamageClass() {
        return damageClass;
    }

    public void setDamageClass(String damageClass) {
        this.damageClass = damageClass;
    }

    public Integer getPower() {
        return power;
    }

    public void setPower(Integer power) {
        this.power = power;
    }

    public Integer getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Integer accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getPp() {
        return pp;
    }

    public void setPp(Integer pp) {
        this.pp = pp;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public String getShortEffectKo() {
        return shortEffectKo;
    }

    public void setShortEffectKo(String shortEffectKo) {
        this.shortEffectKo = shortEffectKo;
    }

    public Integer getEffectChance() {
        return effectChance;
    }

    public void setEffectChance(Integer effectChance) {
        this.effectChance = effectChance;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

