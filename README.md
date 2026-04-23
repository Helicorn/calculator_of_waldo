# [왈도의 계산기]

> 한 줄 소개: 좋아하는 게임에 대한 정보 개인적으로 검색 및 저장하기 위해 제작

## 프로젝트 개요

- **목적**: 개인 취미 및 취업시 참고용
- **기간**: 
- **인원**: 1인
- **내 역할**: AI에게 명령하기(실제 코드 작성: cursor, 방향 제시 상담: ChatGPT)
- **배포 URL**: https://github.com/Helicorn/calculator_of_waldo
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

## API 요약

| Method | Endpoint | 설명 | 인증 필요 |
|---|---|---|---|
| GET | `/api/...` |  | Y/N |
| POST | `/api/...` |  | Y/N |
| PATCH | `/api/...` |  | Y/N |

> 상세 API 문서(OpenAPI/Swagger 등): 

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

- 잘한 점: 
- 아쉬운 점: 
- 다음 프로젝트에 적용할 점: 

## 라이선스

-
