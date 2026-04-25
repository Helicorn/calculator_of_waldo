# [왈도의 계산기]

> 한 줄 소개: 좋아하는 게임에 대한 정보 개인적으로 검색 및 저장하기 위해 제작

## 프로젝트 개요

- **목적**: 개인 취미 및 취업시 참고용
- **기간**: 2026년 4월~
- **인원**: 1인
- **내 역할**: AI에게 명령하기(실제 코드 작성: cursor, 방향 제시 상담: ChatGPT)
- **배포 URL**: 아직 미배포
- **시연 영상/문서**: 

## 핵심 기능

- [x] **회원·프로필**: 회원가입·로그인·프로필 조회·수정(백엔드 세션·유저 REST API 연동)
- [x] **리그 오브 레전드**: 챔피언 정보·스킨·레벨별 스탯, 소환사명 기준 매치 전적 검색·요약·차트(ECharts)
- [x] **포켓몬**: 도감, 특성·기술 데이터 화면, 데미지 계산기(EV 등 입력 기반 시뮬레이션)
- [x] **구조·환경**: 프론트–백 REST 연동, H2(로컬)·Oracle(운영) 프로필 분리, 게임별 라우팅·공통 레이아웃

## 기술 스택

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ECharts (`echarts`, `echarts-for-react`)
- ESLint

### Backend

- Java 21
- Spring Boot 3.4
- Spring Web (REST API)
- Spring Data JPA
- Maven

### Database

- H2 (개발/테스트)
- Oracle Database (운영 프로필)

### Infra / DevOps

- Git / GitHub
- Node.js (npm)

## 아키텍처

### 시스템 구성도

![architecture](./docs/images/architecture.png)

### 디렉토리 구조

```text
[repo-root]
|- backend/
|- frontend/
|- scripts/
`- README.md
```

## 실행 방법

### Backend 실행 방법

#### 사전 요구 사항

- Java: **JDK 21** (`java -version` 확인). 빌드/테스트는 `backend/mvnw` 사용.
- DB: 기본 프로필은 `dev` + `local`이며, `application-local.yml`이 있으면 그 안의 DB 설정이 적용됩니다. **Oracle 없이** 띄우려면 `SPRING_PROFILES_ACTIVE=dev`(H2). **Oracle**을 쓰려면 인스턴스 준비 후 `oracle` 프로필과 `application-oracle.yml` 등 접속 설정을 맞추세요.

#### 환경 변수 (`backend/src/main/resources/application-*.yml` 또는 환경 변수)

```bash
SPRING_PROFILES_ACTIVE=
SERVER_PORT=
```

#### 로컬 실행

```bash
npm run server
```

> 포트 지정 실행: `npm run server:8081`

#### 테스트 실행

```bash
cd backend
./mvnw test
```

### Frontend 실행 방법

#### 사전 요구 사항

- Node.js: 

#### 환경 변수 (`frontend/.env.local`)

```bash
NEXT_PUBLIC_BACKEND_BASE_URL=
```

#### 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

#### 테스트/검증

```bash
cd frontend
npm run test
npm run test:watch
npm run lint
npm run build
```

## 외부 API 사용 요약

| Provider | Base URL | Endpoint | Method | 인증 방식 | 사용 목적 |
|---|---|---|---|---|---|
| Riot Games API | `https://asia.api.riotgames.com` | `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` | GET | API Key (`X-Riot-Token`) | Riot ID로 PUUID 조회 |
| Riot Games API | `https://asia.api.riotgames.com` | `/lol/match/v5/matches/by-puuid/{puuid}/ids` | GET | API Key (`X-Riot-Token`) | PUUID 기반 최근 매치 ID 목록 조회 |
| Riot Games API | `https://asia.api.riotgames.com` | `/lol/match/v5/matches/{matchId}` | GET | API Key (`X-Riot-Token`) | 단일 매치 상세 정보 조회 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/data/{locale}/champion.json` | GET | 없음 | 챔피언/스킬/이미지 메타데이터 조회 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/api/versions.json` | GET | 없음 | 최신 데이터 버전 조회 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/data/ko_KR/champion/{championId}.json` | GET | 없음 | 단일 챔피언 상세 데이터 조회 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/data/ko_KR/summoner.json` | GET | 없음 | 소환사 주문 메타데이터 조회 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/img/champion/{championId}.png` | GET | 없음 | 챔피언 아이콘 이미지 로드 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/img/spell/{imageFull}` | GET | 없음 | 스펠 이미지 로드 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/img/passive/{imageFull}` | GET | 없음 | 패시브 이미지 로드 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/{version}/img/profileicon/{profileIconId}.png` | GET | 없음 | 프로필 아이콘 이미지 로드 |
| Data Dragon (ddragon) | `https://ddragon.leagueoflegends.com` | `/cdn/img/champion/splash/{championId}_{skinNum}.jpg` | GET | 없음 | 챔피언 스킨 스플래시 이미지 로드 |
| PokeAPI | `https://pokeapi.co/api/v2` | `/pokemon/{id or name}` | GET | 없음 | 포켓몬 기본 정보/스탯 조회 |
| PokeAPI | `https://pokeapi.co/api/v2` | `/ability?limit=100000&offset=0` | GET | 없음 | 특성 전체 목록 동기화(백엔드) |
| PokeAPI | `https://pokeapi.co/api/v2` | `/ability/{abilityId}` | GET | 없음 | 특성 상세/설명 조회(백엔드) |
| PokeAPI | `https://pokeapi.co/api/v2` | `/move?limit=100000&offset=0` | GET | 없음 | 기술 전체 목록 동기화(백엔드) |
| PokeAPI | `https://pokeapi.co/api/v2` | `{item.url}` (list 응답의 상세 URL) | GET | 없음 | 기술 상세 조회(백엔드) |

> 내부 API는 별도 섹션(예: `## 내부 API`)으로 분리하는 것을 권장합니다.

## 데이터 모델

상세 스키마(테이블·컬럼·Oracle DDL): [docs/schema.md](./docs/schema.md)

### 주요 엔티티

- **T_USER**: 회원관리 테이블
- **T_POKEMON_MOVE**: 포켓몬 기술목록 테이블
- **T_POKEMON_ABILITY**: 포켓몬 특성목록 테이블
- **LOL_CHAMPION_STATS**: 리그오브레전드 챔피언 통계 조회 테이블

### ERD

![erd](./docs/images/erd.png)

## 품질 관리

- **테스트 전략**: 백엔드는 `Spring Boot Test` 기반 단위/기본 구동 테스트(`mvn test`), 프론트는 `Vitest` 기반 유틸 단위 테스트(`npm run test`)를 수행합니다. 기능 추가 시 핵심 로직(계산/변환/검증) 중심으로 테스트를 우선 보강합니다.
- **코드 스타일/린트**: 프론트엔드는 `ESLint(Next.js)`로 정적 분석(`npm run lint`)하고, 백엔드는 Maven 빌드/테스트(`./mvnw test`)를 통해 컴파일 및 기본 품질을 점검합니다.
- **CI/CD**: 현재 GitHub Actions 등 자동 CI/CD 파이프라인은 미구성 상태이며, 로컬에서 `frontend lint/test/build` + `backend test`를 수동 검증 후 반영합니다.
- **모니터링/로깅**: Spring Boot 기본 로그를 사용하며, 개발 환경에서는 JPA SQL 로그(`show-sql`, `format_sql`)로 쿼리를 확인합니다. 별도 APM/중앙집중 로깅은 추후 도입 예정입니다.

## 트러블슈팅

### 이슈 1

- **문제**: 
- **원인**: 
- **해결**: 
- **배운 점**: 

### 이슈 2

- **문제**: 
- **원인**: 
- **해결**: 
- **배운 점**: 

## 성능/개선 포인트

- 현재 한계: 
- 개선 아이디어 1: 
- 개선 아이디어 2: 
- 개선 아이디어 3: 

## 회고

- 잘한 점: 리그오브레전드 전적검색, 포켓몬 스펙 등 외부 API로부터 응답값을 잘 불러와 원하는 페이지 구현 및 필요한 정보 출력
- 아쉬운 점: 아쉬운 디자인, 깔끔하지 못한 카테고리 분류
- 다음 프로젝트에 적용할 점: 조금 더 세밀한 기획을 통해 프로젝트가 나아갈 방향성 확실하게 제시

## 라이선스

-
