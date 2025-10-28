# 단위 테스트 환경 구축 계획

## 개요 (Executive Summary)

### 핵심 결정사항
- **테스트 프레임워크**: Vitest
- **모킹 라이브러리**: Vitest 내장 모킹 + MSW (Mock Service Worker)
- **React 컴포넌트 테스트**: @testing-library/react
- **테스트 커버리지 목표**: 핵심 비즈니스 로직 80% 이상

### 주요 특징
1. **빠른 실행 속도**: Vite 기반으로 Jest 대비 5-10배 빠른 테스트 실행
2. **간편한 설정**: Next.js 15 + React 19 호환성 뛰어남
3. **타입 안전성**: TypeScript 네이티브 지원
4. **통합 개발 경험**: 코드와 동일한 도구체인 사용 (Vite/ESM)

---

## 장점 및 예상 한계점

### 장점
1. **개발 생산성 향상**
   - Hot Module Replacement(HMR) 지원으로 테스트 중 즉각적인 피드백
   - Jest API 호환으로 마이그레이션 비용 최소화
   - 설정 파일 간소화로 유지보수 부담 감소

2. **모던 스택 최적화**
   - ESM 네이티브 지원
   - 최신 React 19 및 Next.js 15와 완벽 호환
   - Hono 프레임워크의 경량 특성에 적합

3. **확장 가능성**
   - 컴포넌트 테스트부터 통합 테스트까지 단일 도구로 커버
   - MSW를 통한 실제 HTTP 요청 인터셉트
   - Supabase, Clerk, Toss Payments 모킹 전략 명확화

### 예상 한계점
1. **생태계 성숙도**
   - Jest 대비 커뮤니티 자료 부족 (해결: 공식 문서 + Jest 호환 API 활용)
   - 일부 써드파티 라이브러리의 Vitest 미지원 (해결: Jest 변환 레이어 제공)

2. **초기 학습 곡선**
   - 팀원의 Jest 경험을 Vitest로 전환 필요 (해결: API 유사도 높아 1-2일 내 적응)

3. **CI/CD 통합**
   - GitHub Actions 등에서 캐싱 전략 최적화 필요 (해결: 표준 설정 템플릿 제공)

---

## 1. 테스트 프레임워크 선정

### 선택: Vitest

#### 선정 이유
1. **Next.js 15 + React 19 완벽 지원**: 최신 React Server Components 및 async context 호환
2. **빠른 실행 속도**: Vite 기반 번들러로 테스트 실행 시간 단축 (Jest 대비 5-10배)
3. **설정 간소화**: `vite.config.ts`와 통합되어 추가 설정 최소화
4. **Jest 호환 API**: 기존 Jest 경험을 그대로 활용 가능 (`describe`, `it`, `expect` 등)
5. **Native ESM 지원**: 프로젝트의 모던 모듈 시스템과 자연스러운 통합

#### 대안 검토
- **Jest**: 성숙한 생태계이나 ESM 지원 불완전, 설정 복잡도 높음
- **Mocha/Chai**: 유연하나 React 컴포넌트 테스트에 추가 설정 필요

---

## 2. 테스트 환경 설정

### 2.1 필수 패키지 설치

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom happy-dom
npm install -D msw
```

### 2.2 디렉토리 구조

```
supernext/
├── src/
│   ├── __tests__/                    # 통합 테스트
│   │   ├── setup.ts                  # 글로벌 테스트 설정
│   │   └── utils/                    # 공통 테스트 유틸
│   │       ├── test-helpers.ts       # 헬퍼 함수
│   │       ├── mock-factories.ts     # 테스트 데이터 생성
│   │       └── mock-handlers.ts      # MSW 핸들러
│   ├── backend/
│   │   ├── hono/
│   │   │   └── app.test.ts           # Hono 앱 테스트
│   │   └── middleware/
│   │       └── supabase.test.ts      # 미들웨어 테스트
│   ├── features/
│   │   └── [feature]/
│   │       ├── backend/
│   │       │   ├── route.test.ts     # 라우트 핸들러 테스트
│   │       │   └── service.test.ts   # 서비스 로직 테스트
│   │       ├── components/
│   │       │   └── ComponentName.test.tsx
│   │       └── hooks/
│   │           └── useHook.test.ts
│   └── lib/
│       └── utils.test.ts             # 유틸리티 함수 테스트
└── vitest.config.ts                  # Vitest 설정
```

### 2.3 Vitest 설정 파일 (`vitest.config.ts`)

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
        '**/mockData',
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

### 2.4 글로벌 테스트 설정 (`src/__tests__/setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 각 테스트 후 자동 클린업
afterEach(() => {
  cleanup();
});

// 환경 변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xxx';
process.env.CLERK_SECRET_KEY = 'sk_test_xxx';

// 전역 모킹
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

// 콘솔 에러 필터링 (예상된 에러 억제)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Warning: ReactDOM.render'))
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

## 3. 모킹 전략

### 3.1 Supabase 클라이언트 모킹

#### 접근 방식
- **서비스 레이어 테스트**: 실제 Supabase 메서드 체이닝 구조 모킹
- **라우트 핸들러 테스트**: 서비스 함수 자체를 모킹하여 격리

#### 구현 (`src/__tests__/utils/mock-supabase.ts`)

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

// 사용 예시: service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getExampleById } from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';

describe('getExampleById', () => {
  it('should return example data when found', async () => {
    const mockClient = createMockSupabaseClient();
    const mockData = {
      id: 'test-id',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(mockClient, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    } as any);

    const result = await getExampleById(mockClient, 'test-id');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe('Test User');
    }
  });

  it('should return error when example not found', async () => {
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
      expect(result.error.code).toBe('EXAMPLE_NOT_FOUND');
    }
  });
});
```

### 3.2 Clerk 인증 모킹

#### 구현 (`src/__tests__/utils/mock-clerk.ts`)

```typescript
import { vi } from 'vitest';

export const createMockClerkClient = () => ({
  users: {
    getUser: vi.fn(),
    getUserList: vi.fn(),
    updateUser: vi.fn(),
  },
  sessions: {
    getSession: vi.fn(),
    revokeSession: vi.fn(),
  },
});

export const createMockAuthContext = (userId = 'test-user-id') => ({
  userId,
  sessionId: 'test-session-id',
  orgId: null,
  getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
});

// Hono 컨텍스트에서 사용
export const mockClerkMiddleware = () => {
  return vi.fn((c, next) => {
    c.set('clerk', createMockAuthContext());
    return next();
  });
};
```

### 3.3 Toss Payments 모킹

#### 구현 (`src/__tests__/utils/mock-toss-payments.ts`)

```typescript
import { vi } from 'vitest';

export const createMockTossPayments = () => ({
  requestPayment: vi.fn().mockResolvedValue({
    paymentKey: 'mock-payment-key',
    orderId: 'mock-order-id',
    amount: 10000,
  }),
  requestBillingAuth: vi.fn(),
});

// 전역 모킹 (setup.ts에 추가)
vi.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: vi.fn(() => Promise.resolve(createMockTossPayments())),
}));
```

### 3.4 Next.js 라우터 모킹

이미 `setup.ts`에서 전역 모킹 구현되어 있음. 개별 테스트에서 커스터마이징 가능:

```typescript
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';

it('should navigate on button click', async () => {
  const pushMock = vi.fn();
  vi.mocked(useRouter).mockReturnValue({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  } as any);

  // 테스트 실행...
  expect(pushMock).toHaveBeenCalledWith('/expected-path');
});
```

---

## 4. 테스트 유틸리티 함수

### 4.1 React 컴포넌트 렌더링 헬퍼 (`src/__tests__/utils/test-helpers.tsx`)

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
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

// Hono 앱 테스트용 헬퍼
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

### 4.2 테스트 데이터 팩토리 (`src/__tests__/utils/mock-factories.ts`)

```typescript
import { faker } from '@faker-js/faker';

export const createMockExample = (overrides = {}) => ({
  id: faker.string.uuid(),
  full_name: faker.person.fullName(),
  avatar_url: faker.image.avatar(),
  bio: faker.lorem.sentence(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

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
```

---

## 5. 테스트 데이터 픽스처 관리

### 전략
1. **팩토리 패턴 사용**: `@faker-js/faker`로 동적 생성
2. **스냅샷 테스팅 지양**: 데이터 변동성 높은 환경에서 유지보수 부담
3. **MSW로 API 응답 모킹**: 네트워크 레벨에서 일관된 응답 제공

### MSW 핸들러 설정 (`src/__tests__/utils/mock-handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw';
import { createMockExample } from './mock-factories';

export const handlers = [
  http.get('/api/example/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      data: createMockExample({ id: id as string }),
    });
  }),

  http.post('/api/payment/verify', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        verified: true,
        orderId: body.orderId,
        amount: 10000,
      },
    });
  }),

  // 에러 시나리오
  http.get('/api/example/error', () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Test error' } },
      { status: 500 }
    );
  }),
];
```

### MSW 서버 설정 (setup.ts에 추가)

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './utils/mock-handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 6. CI/CD 통합

### GitHub Actions 워크플로우 (`.github/workflows/test.yml`)

```yaml
name: Unit Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests

      - name: Archive test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: coverage/
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:unit:related": "vitest related"
  }
}
```

---

## 7. 레이어별 테스트 전략

### 7.1 백엔드 API 테스트 (Hono 라우트)

**목표**: HTTP 요청/응답 검증, 상태 코드, 에러 핸들링

**예시**: `src/features/example/backend/route.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHonoApp } from '@/backend/hono/app';
import { testRequest } from '@/__tests__/utils/test-helpers';
import * as service from './service';

describe('Example Routes', () => {
  let app: ReturnType<typeof createHonoApp>;

  beforeEach(() => {
    app = createHonoApp();
    vi.clearAllMocks();
  });

  describe('GET /api/example/:id', () => {
    it('should return 200 with valid example data', async () => {
      const mockData = {
        id: 'test-id',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(service, 'getExampleById').mockResolvedValue({
        ok: true,
        data: mockData,
      });

      const res = await testRequest(app, '/api/example/test-id');

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(mockData);
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
      const json = await res.json();
      expect(json.error.code).toBe('EXAMPLE_NOT_FOUND');
    });

    it('should return 400 for invalid id format', async () => {
      const res = await testRequest(app, '/api/example/');

      expect(res.status).toBe(404); // Hono 404 for missing param
    });
  });
});
```

### 7.2 서비스 레이어 테스트

**목표**: 비즈니스 로직 검증, Supabase 쿼리 결과 처리, 데이터 변환

**예시**: `src/features/example/backend/service.test.ts` (위 3.1 섹션 참고)

### 7.3 React 컴포넌트 테스트

**목표**: 렌더링 결과, 사용자 상호작용, 조건부 렌더링

**예시**: `src/features/example/components/ExampleCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { ExampleCard } from './ExampleCard';

describe('ExampleCard', () => {
  const mockExample = {
    id: 'test-id',
    fullName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Software Engineer',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('should render example data correctly', () => {
    renderWithProviders(<ExampleCard example={mockExample} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockExample.avatarUrl);
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

  it('should show fallback avatar when avatarUrl is null', () => {
    renderWithProviders(
      <ExampleCard example={{ ...mockExample, avatarUrl: null }} />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('picsum.photos'));
  });
});
```

### 7.4 React Hook 테스트

**목표**: 커스텀 훅 로직, 상태 변화, 부수 효과

**예시**: `src/features/example/hooks/useExamples.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExamples } from './useExamples';
import { server } from '@/__tests__/setup';
import { http, HttpResponse } from 'msw';

describe('useExamples', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch examples successfully', async () => {
    server.use(
      http.get('/api/examples', () => {
        return HttpResponse.json({
          data: [
            { id: '1', fullName: 'User 1', bio: 'Bio 1' },
            { id: '2', fullName: 'User 2', bio: 'Bio 2' },
          ],
        });
      })
    );

    const { result } = renderHook(() => useExamples(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].fullName).toBe('User 1');
  });

  it('should handle fetch error', async () => {
    server.use(
      http.get('/api/examples', () => {
        return HttpResponse.json(
          { error: { code: 'FETCH_ERROR', message: 'Failed to fetch' } },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useExamples(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

### 7.5 유틸리티 함수 테스트

**목표**: 순수 함수 입출력 검증, 엣지 케이스 처리

**예시**: `src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { cn, formatDate, truncateText } from './utils';

describe('cn (class name merger)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    expect(cn('px-4', 'px-6')).toBe('px-6'); // Tailwind 충돌 해결
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
  });
});

describe('formatDate', () => {
  it('should format ISO date string to readable format', () => {
    expect(formatDate('2025-01-15T10:30:00Z')).toBe('2025년 1월 15일');
  });

  it('should handle invalid date gracefully', () => {
    expect(formatDate('invalid-date')).toBe('Invalid Date');
  });
});

describe('truncateText', () => {
  it('should truncate long text with ellipsis', () => {
    expect(truncateText('This is a very long text', 10)).toBe('This is a...');
  });

  it('should not truncate short text', () => {
    expect(truncateText('Short', 10)).toBe('Short');
  });
});
```

---

## 8. 테스트 작성 가이드라인

### 8.1 테스트 네이밍 컨벤션

```typescript
describe('[Component/Function Name]', () => {
  describe('[Method/Feature]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Given (준비)
      // When (실행)
      // Then (검증)
    });
  });
});
```

### 8.2 AAA 패턴 준수

```typescript
it('should calculate total price correctly', () => {
  // Arrange (준비): 테스트 데이터 및 환경 설정
  const items = [
    { price: 1000, quantity: 2 },
    { price: 500, quantity: 3 },
  ];

  // Act (실행): 테스트 대상 함수 실행
  const total = calculateTotal(items);

  // Assert (검증): 결과 확인
  expect(total).toBe(3500);
});
```

### 8.3 테스트 격리 원칙

- 각 테스트는 독립적으로 실행 가능해야 함
- `beforeEach`에서 모킹 초기화 (`vi.clearAllMocks()`)
- 공유 상태 사용 지양

### 8.4 의미 있는 테스트만 작성

**작성하지 말아야 할 테스트**:
- 단순 getter/setter (비즈니스 로직 없음)
- 라이브러리 자체 테스트 (예: React Query의 동작 검증)
- 구현 세부사항에 과도하게 결합된 테스트

**작성해야 할 테스트**:
- 핵심 비즈니스 로직 (결제, 구독, 분석 등)
- 엣지 케이스 및 에러 처리
- 사용자 인터랙션 시나리오 (버튼 클릭, 폼 제출)

---

## 9. 간단한 테스트 예시

### 예시: Hono 앱 초기화 테스트 (`src/backend/hono/app.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { createHonoApp } from './app';
import { testRequest } from '@/__tests__/utils/test-helpers';

describe('Hono App', () => {
  it('should return 404 for unknown routes', async () => {
    const app = createHonoApp();
    const res = await testRequest(app, '/api/unknown-route');

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should include error boundary middleware', async () => {
    const app = createHonoApp();
    // 의도적으로 에러를 발생시키는 라우트 추가 테스트 가능
    // (실제 앱에서는 errorBoundary가 자동으로 처리)
  });
});
```

---

## 10. 마이그레이션 계획

### Phase 1: 기반 구축 (1주)
1. Vitest 설치 및 설정
2. 테스트 유틸리티 함수 작성
3. 모킹 헬퍼 구현
4. CI/CD 파이프라인 통합

### Phase 2: 핵심 로직 테스트 (2주)
1. 서비스 레이어 테스트 작성 (각 feature의 service.ts)
2. Hono 라우트 핸들러 테스트
3. 유틸리티 함수 테스트

### Phase 3: 프론트엔드 테스트 (2주)
1. React Hook 테스트 (React Query 훅 중심)
2. 핵심 UI 컴포넌트 테스트 (결제, 구독 관련)
3. 폼 검증 테스트

### Phase 4: 안정화 (1주)
1. 커버리지 리포트 분석 및 보완
2. CI/CD 성능 최적화
3. 팀 교육 및 문서화

---

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Testing Library 공식 문서](https://testing-library.com/)
- [MSW 공식 문서](https://mswjs.io/)
- [Hono Testing Guide](https://hono.dev/guides/testing)
- [React Query Testing Guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
