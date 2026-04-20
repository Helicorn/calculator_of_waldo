# [프로젝트 이름]

> 한 줄 소개: 이 프로젝트가 어떤 문제를 해결하는지 간단히 작성

## 프로젝트 개요

- **목적**: 
- **기간**: 
- **인원**: 
- **내 역할**: 
- **배포 URL**: 
- **시연 영상/문서**: 

## 핵심 기능

- [ ] 기능 1: 
- [ ] 기능 2: 
- [ ] 기능 3: 
- [ ] 기능 4: 

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

- Java: 
- DB: 

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

- **Entity 1**: 
- **Entity 2**: 
- **Entity 3**: 

### ERD

![erd](./docs/images/erd.png)

## 품질 관리

- **테스트 전략**: 
- **코드 스타일/린트**: 
- **CI/CD**: 
- **모니터링/로깅**: 

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
