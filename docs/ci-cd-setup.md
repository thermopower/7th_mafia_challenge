# CI/CD 설정 가이드

> **작성일**: 2025-10-29
> **목적**: GitHub Actions CI/CD 환경 구축을 위한 설정 가이드

---

## 📋 개요

이 프로젝트는 GitHub Actions를 통해 자동화된 테스트 및 빌드 검증을 수행합니다. 이 문서는 CI/CD 파이프라인을 설정하는 방법을 설명합니다.

---

## 🔐 필수 GitHub Secrets 설정

GitHub 리포지토리의 **Settings > Secrets and variables > Actions**에서 다음 Secrets를 추가해야 합니다.

### 1. Supabase 관련

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Clerk 인증 관련

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 3. Toss Payments 관련

```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx
```

### 4. Gemini API 관련

```
GEMINI_API_KEY=your-gemini-api-key
```

### 5. E2E 테스트 사용자 계정

```
E2E_TEST_USER_EMAIL=test-e2e@example.com
E2E_TEST_USER_PASSWORD=your-secure-password
```

**⚠️ 중요**: E2E 테스트 사용자는 실제 Clerk에 등록된 테스트 전용 계정이어야 합니다.

### 6. Codecov 토큰 (선택)

커버리지 리포트를 Codecov에 업로드하려면:

```
CODECOV_TOKEN=your-codecov-token
```

Codecov 토큰은 [codecov.io](https://codecov.io)에서 리포지토리를 추가한 후 얻을 수 있습니다.

---

## 🚀 워크플로우 구성

### 1. 테스트 워크플로우 (`.github/workflows/test.yml`)

다음 작업을 수행합니다:

- **Unit Tests**: Vitest로 단위 테스트 실행 및 커버리지 수집
- **E2E Tests**: Playwright로 Chromium, Firefox 브라우저 테스트
- **Type Check**: TypeScript 타입 검사
- **Lint**: ESLint 코드 스타일 검사
- **Build**: Next.js 프로덕션 빌드

### 2. PR 체크 워크플로우 (`.github/workflows/pr-checks.yml`)

Pull Request에 대해:

- 변경된 파일 기반 자동 라벨링
- PR 크기 라벨 추가 (XS, S, M, L, XL)
- 테스트 상태 코멘트 자동 추가

---

## 📊 CI/CD 파이프라인 흐름

```
┌─────────────────────────────────────────────────────────┐
│  Push / Pull Request to main or develop                │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │  Unit  │     │  E2E   │     │  Type  │
    │  Tests │     │  Tests │     │  Check │
    └────────┘     └────────┘     └────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │  Lint  │     │  Build │     │ Upload │
    │        │     │        │     │Coverage│
    └────────┘     └────────┘     └────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  All Checks Pass │
              └──────────────────┘
```

---

## 🛠️ 로컬에서 CI 환경 재현

CI에서 실행되는 것과 동일한 테스트를 로컬에서 실행할 수 있습니다:

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 린트
npm run lint

# 3. 단위 테스트 (커버리지 포함)
npm run test:unit:coverage

# 4. E2E 테스트
npm run test:e2e

# 5. 빌드
npm run build
```

---

## 🔍 트러블슈팅

### E2E 테스트 실패

**문제**: E2E 테스트가 CI에서 실패하지만 로컬에서는 성공

**해결**:
1. GitHub Secrets에 `E2E_TEST_USER_EMAIL`과 `E2E_TEST_USER_PASSWORD`가 올바르게 설정되어 있는지 확인
2. 테스트 계정이 Clerk에 실제로 등록되어 있는지 확인
3. Actions 탭에서 상세 로그 확인

### 빌드 실패

**문제**: 환경 변수 관련 빌드 에러

**해결**:
1. 모든 `NEXT_PUBLIC_*` 환경 변수가 GitHub Secrets에 설정되어 있는지 확인
2. Secrets 이름이 정확한지 확인 (대소문자 구분)

### 커버리지 업로드 실패

**문제**: Codecov 업로드 실패

**해결**:
1. `CODECOV_TOKEN`이 올바르게 설정되어 있는지 확인
2. Codecov에서 리포지토리가 활성화되어 있는지 확인
3. 토큰이 선택 사항이므로 없어도 CI는 통과됨

---

## 📈 배지 추가

README.md에 다음 배지를 추가하여 CI 상태를 표시할 수 있습니다:

```markdown
![Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
```

`YOUR_USERNAME`과 `YOUR_REPO`를 실제 값으로 교체하세요.

---

## 🎯 권장 사항

### PR 병합 조건

리포지토리 설정에서 다음 보호 규칙을 추가하는 것을 권장합니다:

1. **Settings > Branches > Branch protection rules**
2. **main** 브랜치에 대해:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Unit Tests
     - E2E Tests (chromium)
     - E2E Tests (firefox)
     - Type Check
     - Lint
     - Build
   - ✅ Require branches to be up to date before merging

### 성능 최적화

- **캐싱**: GitHub Actions는 `node_modules` 캐싱을 자동으로 수행
- **병렬 실행**: E2E 테스트는 Chromium과 Firefox를 병렬로 실행
- **실패 빠른 감지**: `fail-fast: false`로 설정하여 한 브라우저 실패 시에도 다른 브라우저 테스트 계속

---

## 📚 추가 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Playwright CI 가이드](https://playwright.dev/docs/ci)
- [Vitest CI 가이드](https://vitest.dev/guide/ci.html)
- [Codecov 가이드](https://docs.codecov.com/docs)

---

**이 문서는 프로젝트의 CI/CD 환경 변화에 따라 지속적으로 업데이트됩니다.**
