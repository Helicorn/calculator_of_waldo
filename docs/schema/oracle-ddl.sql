-- Oracle 참조 DDL (프로필 oracle, jpa.hibernate.ddl-auto=none 일 때 수동 적용용)
-- 대상 스키마에서 실행하세요. Hibernate default_schema는 ORACLE_SCHEMA 또는 datasource username과 맞추면 됩니다.
-- 엔티티: com.waldo.TUser, PokemonMoveEntity, PokemonAbilityEntity

-- 시퀀스: TUser @SequenceGenerator(sequenceName = "seq_t_user_no")
CREATE SEQUENCE seq_t_user_no
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE TABLE t_user (
    no              NUMBER          NOT NULL,
    account         VARCHAR2(30),
    name            VARCHAR2(30),
    password        VARCHAR2(4000),
    phone           VARCHAR2(30),
    delyn           CHAR(1)         NOT NULL,
    username        VARCHAR2(30),
    authority       VARCHAR2(30),
    reg_dt          TIMESTAMP       NOT NULL,
    upd_dt          TIMESTAMP,
    last_login_dt   TIMESTAMP,
    CONSTRAINT pk_t_user PRIMARY KEY (no)
);

CREATE TABLE t_pokemon_move (
    move_id          NUMBER          NOT NULL,
    move_name_en     VARCHAR2(100)   NOT NULL,
    move_name_ko     VARCHAR2(200),
    type_name        VARCHAR2(30)    NOT NULL,
    damage_class     VARCHAR2(20)    NOT NULL,
    power            NUMBER,
    accuracy         NUMBER,
    pp               NUMBER,
    priority         NUMBER,
    target_name      VARCHAR2(50),
    short_effect_ko  VARCHAR2(1000),
    effect_chance    NUMBER,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP,
    CONSTRAINT pk_t_pokemon_move PRIMARY KEY (move_id)
);

CREATE TABLE t_pokemon_ability (
    ability_id           NUMBER        NOT NULL,
    ability_name_en      VARCHAR2(100),
    effect_en            CLOB,
    ability_name_ko      VARCHAR2(200),
    effect_ko            CLOB,
    translation_status   VARCHAR2(20),
    is_manual_override   CHAR(1),
    last_synced_at       TIMESTAMP,
    updated_at           TIMESTAMP,
    CONSTRAINT pk_t_pokemon_ability PRIMARY KEY (ability_id)
);
