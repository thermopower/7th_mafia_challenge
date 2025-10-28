이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 사용해 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

![Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)

## Getting Started

개발 서버를 실행합니다.<br/>
환경에 따른 명령어를 사용해주세요.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하여 페이지를 편집할 수 있습니다. 파일을 수정하면 자동으로 페이지가 업데이트됩니다.

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 테스트

이 프로젝트는 포괄적인 테스트 환경을 갖추고 있습니다.

### 단위 테스트 (Vitest)

```bash
# 단위 테스트 실행
npm run test:unit

# Watch 모드로 실행
npm run test:unit:watch

# UI 모드로 실행
npm run test:unit:ui

# 커버리지 리포트 생성
npm run test:unit:coverage
```

### E2E 테스트 (Playwright)

```bash
# E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# Headed 모드 (브라우저 보이기)
npm run test:e2e:headed

# 특정 브라우저만 실행
npm run test:e2e:chromium
```

### 모든 테스트 실행

```bash
npm test
```

### E2E 테스트 환경 설정

E2E 테스트를 실행하려면 `.env.e2e` 파일에 다음 항목을 설정해야 합니다:

```env
E2E_BASE_URL=http://localhost:3000
E2E_TEST_USER_EMAIL=your-test-email@example.com
E2E_TEST_USER_PASSWORD=your-test-password
```

### CI/CD

이 프로젝트는 GitHub Actions를 통해 자동화된 테스트를 실행합니다:

- ✅ 단위 테스트 (커버리지 리포트 포함)
- ✅ E2E 테스트 (Chromium, Firefox)
- ✅ TypeScript 타입 체크
- ✅ ESLint 린트 체크
- ✅ Next.js 빌드 검증

모든 PR은 위 체크를 통과해야 병합할 수 있습니다.

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```
