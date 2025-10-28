# Supernext 프로젝트 테스트 환경 구축 계획서

> **작성일**: 2025-10-28
> **목적**: AI 코딩 에이전트를 위한 구현 지침 제공
> **적용 대상**: Next.js 15 + React 19 + Hono 기반 풀스택 애플리케이션

---

## 📋 문서 개요

본 문서는 Supernext 프로젝트에 **단위 테스트(Unit Test)**와 **E2E 테스트(End-to-End Test)** 환경을 구축하기 위한 종합 가이드입니다. 실제 구현에 필요한 모든 설정, 코드 예시, 모범 사례를 포함하며, AI 에이전트가 단계별로 따라할 수 있도록 명확한 지침을 제공합니다.

### 핵심 목표
1. **신뢰성 확보**: 코드 변경 시 자동으로 검증하여 버그 유입 방지
2. **빠른 피드백**: 로컬 및 CI 환경에서 5분 이내 테스트 완료
3. **유지보수성**: 코드 변경 시 테스트 수정 범위 최소화
4. **실용성**: 100% 커버리지보다 핵심 비즈니스 로직 집중

---

## 🎯 테스트 전략 요약

| 구분 | 단위 테스트 | E2E 테스트 |
|------|------------|------------|
| **도구** | Vitest + Testing Library | Playwright |
| **실행 환경** | Node.js (jsdom) | 실제 브라우저 (Chromium/Firefox/WebKit) |
| **실행 속도** | 매우 빠름 (1-2분) | 느림 (5-10분) |
| **커버리지 목표** | 핵심 로직 80% | 주요 사용자 시나리오 100% |
| **실행 시점** | 매 커밋, PR | PR 병합 전, 배포 전 |
| **주요 테스트 대상** | 서비스 로직, 유틸 함수, React 훅 | 인증, 결제, PDF 분석 전체 플로우 |

---

## 📦 필수 패키지 설치

### 1단계: 단위 테스트 패키지

```bash
# Vitest 및 테스팅 라이브러리
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
npm install -D msw @faker-js/faker
```

### 2단계: E2E 테스트 패키지

```bash
# Playwright
npm install -D @playwright/test

# 브라우저 드라이버 설치
npx playwright install --with-deps
```

### 3단계: package.json 스크립트 추가

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chromium": "playwright test --project=chromium"
  }
}
```

---

## 🏗️ 프로젝트 구조

```
supernext/
├── src/
│   ├── __tests__/                     # 단위 테스트 공통 설정
│   │   ├── setup.ts                   # 전역 설정
│   │   └── utils/
│   │       ├── test-helpers.tsx       # React 렌더링 헬퍼
│   │       ├── mock-factories.ts      # 테스트 데이터 생성
│   │       ├── mock-supabase.ts       # Supabase 모킹
│   │       ├── mock-clerk.ts          # Clerk 모킹
│   │       └── mock-handlers.ts       # MSW 핸들러
│   ├── backend/
│   │   └── **/
│   │       └── *.test.ts              # 백엔드 로직 단위 테스트
│   ├── features/
│   │   └── [feature]/
│   │       ├── backend/
│   │       │   ├── route.test.ts
│   │       │   └── service.test.ts
│   │       ├── components/
│   │       │   └── *.test.tsx
│   │       └── hooks/
│   │           └── *.test.ts
│   └── lib/
│       └── utils.test.ts
├── e2e/                               # E2E 테스트
│   ├── fixtures/
│   │   ├── auth.fixture.ts            # 인증 상태 관리
│   │   └── test-data.ts
│   ├── pages/                         # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── PaymentPage.ts
│   ├── specs/                         # 테스트 시나리오
│   │   ├── auth/
│   │   ├── analysis/
│   │   ├── payment/
│   │   └── smoke/
│   └── utils/
│       └── db-helpers.ts
├── vitest.config.ts
├── playwright.config.ts
└── .env.e2e                           # E2E 전용 환경변수
```

---

## ⚙️ 단위 테스트 환경 설정

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/app/**', // Next.js 라우팅 파일 제외
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### src/__tests__/setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './utils/mock-handlers';

// MSW 서버 설정
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// 환경 변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xxx';
process.env.CLERK_SECRET_KEY = 'sk_test_xxx';

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Toss Payments 모킹
vi.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: vi.fn(() =>
    Promise.resolve({
      requestPayment: vi.fn().mockResolvedValue({
        paymentKey: 'mock-payment-key',
        orderId: 'mock-order-id',
        amount: 10000,
      }),
    })
  ),
}));

// 콘솔 에러 필터링
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
```

---

## 🧪 모킹 전략

### 1. Supabase 클라이언트 모킹

#### src/__tests__/utils/mock-supabase.ts

```typescript
import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createMockSupabaseClient = (): SupabaseClient => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    from: vi.fn(() => mockQuery),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
  } as unknown as SupabaseClient;
};

// 사용 예시
export const mockSuccessQuery = (mockClient: SupabaseClient, data: any) => {
  vi.spyOn(mockClient, 'from').mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  } as any);
};

export const mockErrorQuery = (mockClient: SupabaseClient, error: string) => {
  vi.spyOn(mockClient, 'from').mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: error },
        }),
      }),
    }),
  } as any);
};
```

### 2. Clerk 인증 모킹

#### src/__tests__/utils/mock-clerk.ts

```typescript
import { vi } from 'vitest';

export const createMockAuthContext = (userId = 'test-user-id') => ({
  userId,
  sessionId: 'test-session-id',
  orgId: null,
  getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
});

// Hono 컨텍스트에서 사용
export const mockClerkAuth = (userId?: string) => {
  return createMockAuthContext(userId);
};
```

### 3. React 테스트 헬퍼

#### src/__tests__/utils/test-helpers.tsx

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactNode,
  { queryClient = createTestQueryClient(), ...options }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Hono 앱 테스트 헬퍼
export const testRequest = async (
  app: any,
  path: string,
  options: RequestInit = {}
) => {
  const url = new URL(path, 'http://localhost:3000');
  const request = new Request(url, options);
  return app.fetch(request);
};
```

### 4. 테스트 데이터 팩토리

#### src/__tests__/utils/mock-factories.ts

```typescript
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  clerk_id: `user_${faker.string.alphanumeric(16)}`,
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

export const createMockAnalysis = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  pdf_url: faker.internet.url(),
  status: 'completed' as const,
  result: {
    summary: faker.lorem.paragraph(),
    keywords: [faker.lorem.word(), faker.lorem.word()],
  },
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockSubscription = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  plan: 'premium' as const,
  status: 'active' as const,
  billing_key: faker.string.alphanumeric(32),
  started_at: faker.date.past().toISOString(),
  expires_at: faker.date.future().toISOString(),
  ...overrides,
});
```

---

## 📝 단위 테스트 작성 예시

### 1. 서비스 레이어 테스트

#### src/features/example/backend/service.test.ts

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getExampleById } from './service';
import { createMockSupabaseClient, mockSuccessQuery } from '@/__tests__/utils/mock-supabase';
import { createMockUser } from '@/__tests__/utils/mock-factories';

describe('getExampleById', () => {
  it('should return example data when found', async () => {
    const mockClient = createMockSupabaseClient();
    const mockData = createMockUser({ id: 'test-id', full_name: 'Test User' });

    mockSuccessQuery(mockClient, mockData);

    const result = await getExampleById(mockClient, 'test-id');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe('Test User');
    }
  });

  it('should return 404 when example not found', async () => {
    const mockClient = createMockSupabaseClient();

    vi.spyOn(mockClient, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any);

    const result = await getExampleById(mockClient, 'non-existent');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(404);
      expect(result.error.code).toContain('NOT_FOUND');
    }
  });

  it('should handle database error gracefully', async () => {
    const mockClient = createMockSupabaseClient();

    vi.spyOn(mockClient, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      }),
    } as any);

    const result = await getExampleById(mockClient, 'test-id');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(500);
    }
  });
});
```

### 2. Hono 라우트 테스트

#### src/features/example/backend/route.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHonoApp } from '@/backend/hono/app';
import { testRequest } from '@/__tests__/utils/test-helpers';
import * as service from './service';
import { createMockUser } from '@/__tests__/utils/mock-factories';

describe('Example Routes', () => {
  let app: ReturnType<typeof createHonoApp>;

  beforeEach(() => {
    app = createHonoApp();
    vi.clearAllMocks();
  });

  describe('GET /api/example/:id', () => {
    it('should return 200 with valid example data', async () => {
      const mockData = createMockUser({ id: 'test-id' });

      vi.spyOn(service, 'getExampleById').mockResolvedValue({
        ok: true,
        data: {
          id: mockData.id,
          fullName: mockData.full_name,
          avatarUrl: mockData.avatar_url,
          bio: mockData.bio,
          updatedAt: mockData.updated_at,
        },
      });

      const res = await testRequest(app, '/api/example/test-id');

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe('test-id');
    });

    it('should return 404 when example not found', async () => {
      vi.spyOn(service, 'getExampleById').mockResolvedValue({
        ok: false,
        error: {
          status: 404,
          code: 'EXAMPLE_NOT_FOUND',
          message: 'Example not found',
        },
      });

      const res = await testRequest(app, '/api/example/non-existent');

      expect(res.status).toBe(404);
    });
  });
});
```

### 3. React 컴포넌트 테스트

#### src/features/example/components/ExampleCard.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { ExampleCard } from './ExampleCard';
import { createMockUser } from '@/__tests__/utils/mock-factories';

describe('ExampleCard', () => {
  const mockExample = createMockUser();

  it('should render example data correctly', () => {
    renderWithProviders(<ExampleCard example={mockExample} />);

    expect(screen.getByText(mockExample.full_name)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockExample.avatar_url);
  });

  it('should call onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    renderWithProviders(
      <ExampleCard example={mockExample} onClick={onClickMock} />
    );

    await user.click(screen.getByRole('button'));

    expect(onClickMock).toHaveBeenCalledWith(mockExample.id);
  });
});
```

---

## 🌐 E2E 테스트 환경 설정

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

### .env.e2e

```env
E2E_BASE_URL=http://localhost:3000

# Supabase (테스트 전용 프로젝트 사용 권장)
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# Clerk (테스트 모드)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
E2E_TEST_USER_EMAIL=e2e-test@example.com
E2E_TEST_USER_PASSWORD=E2ETestPassword123!

# Toss Payments (테스트 모드)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx
```

---

## 🎭 E2E 테스트 작성 예시

### 1. Page Object Model

#### e2e/pages/LoginPage.ts

```typescript
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  private selectors = {
    emailInput: 'input[name="identifier"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
  };

  async goto() {
    await this.page.goto('/sign-in');
    await expect(this.page.locator(this.selectors.emailInput)).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.click(this.selectors.submitButton);
    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.submitButton);
  }

  async expectError(message: string) {
    await expect(
      this.page.locator(this.selectors.errorMessage)
    ).toContainText(message);
  }
}
```

### 2. 인증 Fixture

#### e2e/fixtures/auth.fixture.ts

```typescript
import { test as base } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page }, use) => {
    try {
      const cookies = JSON.parse(
        require('fs').readFileSync(authFile, 'utf-8')
      );
      await page.context().addCookies(cookies);
    } catch (error) {
      // 세션 파일이 없으면 로그인 수행
      await page.goto('/sign-in');
      await page.fill('input[name="identifier"]', process.env.E2E_TEST_USER_EMAIL!);
      await page.click('button[type="submit"]');
      await page.fill('input[name="password"]', process.env.E2E_TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      await page.context().storageState({ path: authFile });
    }

    await page.goto('/dashboard');
    await use(page);
  },
});
```

### 3. 크리티컬 패스 테스트

#### e2e/specs/smoke/critical-path.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Critical User Journey', () => {
  test('should complete end-to-end workflow', async ({ page }) => {
    // 1. 로그인
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.E2E_TEST_USER_EMAIL!,
      process.env.E2E_TEST_USER_PASSWORD!
    );

    await expect(page).toHaveURL(/\/dashboard/);

    // 2. PDF 분석 시작
    await page.click('text=새 분석 시작');
    await expect(page).toHaveURL(/\/analysis\/new/);

    // 3. 프로필 확인
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('text=내 프로필')).toBeVisible();

    // 4. 로그아웃
    await page.click('text=로그아웃');
    await expect(page).toHaveURL('/');
  });
});
```

---

## 🚀 CI/CD 통합

### .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [chromium, firefox]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.project }}

      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.project }}
        env:
          E2E_BASE_URL: ${{ secrets.STAGING_URL }}
          E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
```

---

## ✅ 테스트 작성 체크리스트

### 단위 테스트
- [ ] 서비스 레이어의 모든 공개 함수 테스트 작성
- [ ] 성공 케이스 + 실패 케이스 + 엣지 케이스 커버
- [ ] Supabase 쿼리 에러 처리 검증
- [ ] Zod 스키마 검증 실패 시나리오 테스트
- [ ] 모든 테스트가 독립적으로 실행 가능
- [ ] 테스트 실행 시간 2분 이내 유지

### E2E 테스트
- [ ] 회원가입/로그인 플로우 테스트
- [ ] PDF 분석 핵심 시나리오 테스트
- [ ] 결제 및 구독 플로우 테스트 (테스트 카드 사용)
- [ ] 에러 상태 UI 검증
- [ ] 모바일 뷰포트 테스트 (선택)
- [ ] 시각적 회귀 테스트 (선택)

---

## 📚 구현 우선순위

### Phase 1: 기반 구축 (Week 1)
1. Vitest 및 Playwright 설치
2. 설정 파일 작성 (`vitest.config.ts`, `playwright.config.ts`)
3. 공통 테스트 유틸리티 구현 (`mock-supabase.ts`, `test-helpers.tsx` 등)
4. 간단한 예제 테스트 작성하여 환경 검증

### Phase 2: 핵심 로직 테스트 (Week 2-3)
1. 서비스 레이어 테스트 (각 feature의 `service.ts`)
2. Hono 라우트 핸들러 테스트
3. 유틸리티 함수 테스트

### Phase 3: E2E 크리티컬 패스 (Week 4)
1. 인증 플로우 E2E
2. PDF 분석 플로우 E2E
3. 결제 플로우 E2E (테스트 모드)

### Phase 4: CI/CD 통합 (Week 5)
1. GitHub Actions 워크플로우 작성
2. 커버리지 리포트 연동
3. 테스트 실패 알림 설정

---

## 🔧 문제 해결 가이드

### 문제 1: Vitest에서 Next.js alias 인식 실패
**증상**: `Cannot find module '@/...'` 에러

**해결**:
```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### 문제 2: Playwright에서 로그인 상태 유지 안됨
**증상**: 매 테스트마다 로그인 필요

**해결**: `storageState`를 사용하여 세션 저장
```typescript
await page.context().storageState({ path: 'auth.json' });
```

### 문제 3: MSW 핸들러가 작동하지 않음
**증상**: 실제 API 호출 발생

**해결**: `setup.ts`에서 `server.listen()` 호출 확인
```typescript
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
```

---

## 📖 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Testing Library 공식 문서](https://testing-library.com/)
- [Playwright 공식 문서](https://playwright.dev/)
- [MSW 공식 문서](https://mswjs.io/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

---

**이 문서는 실제 구현 시 지속적으로 업데이트됩니다.**
