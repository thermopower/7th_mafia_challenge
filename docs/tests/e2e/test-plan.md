# E2E 테스트 환경 구축 계획

## 개요 (Executive Summary)

### 핵심 결정사항
- **테스트 프레임워크**: Playwright
- **테스트 실행 전략**: Headless 브라우저 + 병렬 실행
- **환경 구성**: 로컬 개발 서버 + Staging 환경
- **커버리지 목표**: 핵심 사용자 시나리오 100% (회원가입, 로그인, 결제, PDF 분석)

### 주요 특징
1. **크로스 브라우저 지원**: Chromium, Firefox, WebKit (Safari) 자동 테스트
2. **시각적 회귀 테스트**: 스크린샷 비교로 UI 변경 감지
3. **네트워크 제어**: 오프라인 모드, 느린 연결 시뮬레이션
4. **실제 사용자 시나리오**: Clerk 인증, Toss Payments 결제 플로우 전체 검증

---

## 장점 및 예상 한계점

### 장점
1. **높은 신뢰성**
   - 실제 브라우저에서 실행되어 실환경과 동일한 조건 검증
   - Auto-wait 기능으로 flaky test 최소화
   - 네트워크 요청 자동 대기 (XHR, Fetch)

2. **강력한 디버깅**
   - 실패 시 자동 스크린샷 + 비디오 녹화
   - Trace Viewer로 타임라인 기반 디버깅
   - 브라우저 DevTools 통합

3. **유지보수 효율성**
   - CodeGen으로 테스트 코드 자동 생성
   - Page Object Model 패턴 적용 가능
   - TypeScript 네이티브 지원

4. **CI/CD 최적화**
   - Docker 컨테이너에서 안정적으로 실행
   - 병렬 실행으로 전체 테스트 시간 단축 (10분 → 3분)
   - GitHub Actions와 긴밀한 통합

### 예상 한계점
1. **실행 속도**
   - 단위 테스트 대비 느림 (평균 5-10초/테스트)
   - 해결: 병렬 실행 + 핵심 시나리오만 선별

2. **외부 서비스 의존성**
   - Clerk, Toss Payments의 실제 API 사용 필요
   - 해결: Staging 환경에서 테스트 모드 활성화

3. **초기 설정 복잡도**
   - 브라우저 드라이버 설치, 환경 변수 관리
   - 해결: Docker 기반 표준 환경 제공

4. **테스트 데이터 관리**
   - 매 실행마다 DB 상태 초기화 필요
   - 해결: Supabase 테스트 프로젝트 분리 + 트랜잭션 롤백

---

## 1. 테스트 프레임워크 선정

### 선택: Playwright

#### 선정 이유
1. **Microsoft 공식 지원**: Next.js와 완벽한 호환성, 지속적인 업데이트
2. **멀티 브라우저 지원**: Chromium, Firefox, WebKit을 단일 API로 제어
3. **자동 대기**: 네트워크 요청, DOM 변경을 자동 감지하여 안정성 향상
4. **강력한 셀렉터**: CSS, XPath, Text, Accessibility 셀렉터 조합 가능
5. **추적 기능**: 실패 시 전체 실행 과정을 시각적으로 재생 가능

#### 대안 검토
- **Cypress**: 프론트엔드 중심이나 API 모킹 복잡, 멀티탭 지원 제한
- **Selenium**: 구형 아키텍처, 설정 복잡도 높음
- **Puppeteer**: Chromium 전용, 타 브라우저 미지원

---

## 2. 테스트 환경 설정

### 2.1 필수 패키지 설치

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

### 2.2 디렉토리 구조

```
supernext/
├── e2e/
│   ├── fixtures/                    # 테스트 데이터 및 헬퍼
│   │   ├── auth.fixture.ts          # 인증 상태 설정
│   │   ├── payment.fixture.ts       # 결제 모킹
│   │   └── test-data.ts             # 공통 테스트 데이터
│   ├── pages/                       # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── AnalysisPage.ts
│   │   └── PaymentPage.ts
│   ├── specs/                       # 실제 테스트 시나리오
│   │   ├── auth/
│   │   │   ├── signup.spec.ts
│   │   │   └── login.spec.ts
│   │   ├── analysis/
│   │   │   ├── upload-pdf.spec.ts
│   │   │   └── view-results.spec.ts
│   │   ├── payment/
│   │   │   ├── subscription.spec.ts
│   │   │   └── one-time-payment.spec.ts
│   │   └── smoke/
│   │       └── critical-path.spec.ts
│   └── utils/
│       ├── db-helpers.ts            # DB 초기화/정리
│       ├── screenshot-helpers.ts    # 스크린샷 비교
│       └── wait-helpers.ts          # 커스텀 대기 로직
├── playwright.config.ts             # Playwright 설정
└── .env.e2e                         # E2E 전용 환경 변수
```

### 2.3 Playwright 설정 파일 (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// E2E 전용 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

export default defineConfig({
  testDir: './e2e/specs',

  // 테스트 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list'],
  ],

  // 전역 설정
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 브라우저 컨텍스트 설정
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 타임아웃 설정
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 프로젝트별 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 모바일 테스트
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // 웹 서버 자동 실행 (로컬에서만)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },

  // 전역 Setup/Teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
```

### 2.4 환경 변수 설정 (`.env.e2e`)

```env
# 테스트 환경 URL
E2E_BASE_URL=http://localhost:3000

# Supabase (테스트 전용 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...test-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...test-service-role-key

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

## 3. 모킹 및 외부 서비스 처리 전략

### 3.1 인증 (Clerk) 처리

#### 접근 방식
- **테스트 계정 사전 생성**: Clerk Dashboard에서 E2E 전용 계정 등록
- **세션 재사용**: 로그인 상태를 파일로 저장하여 매 테스트마다 재로그인 방지

#### 구현 (`e2e/fixtures/auth.fixture.ts`)

```typescript
import { test as base, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

export const test = base.extend<{
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    // 저장된 세션 로드
    await page.context().addCookies(
      JSON.parse(require('fs').readFileSync(authFile, 'utf-8'))
    );

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();

    await use(page);
  },
});

// 세션 생성 스크립트 (global-setup.ts에서 실행)
export async function setupAuth() {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Clerk 로그인
  await page.goto(process.env.E2E_BASE_URL + '/sign-in');
  await page.fill('input[name="identifier"]', process.env.E2E_TEST_USER_EMAIL!);
  await page.click('button[type="submit"]');

  await page.fill('input[name="password"]', process.env.E2E_TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');

  // 쿠키 저장
  await page.context().storageState({ path: authFile });
  await browser.close();
}
```

### 3.2 결제 (Toss Payments) 처리

#### 접근 방식
- **테스트 모드 활성화**: Toss Payments의 `clientKey`를 테스트 키로 설정
- **성공/실패 시나리오 분리**: 특정 카드 번호로 결과 제어

#### 구현 (`e2e/specs/payment/subscription.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { PaymentPage } from '../../pages/PaymentPage';

test.describe('Subscription Payment', () => {
  test('should complete subscription payment successfully', async ({ page }) => {
    const paymentPage = new PaymentPage(page);

    await page.goto('/subscription/plans');
    await page.click('[data-plan="premium"]');

    // Toss Payments 위젯 대기
    await paymentPage.waitForPaymentWidget();

    // 테스트 카드 정보 입력 (Toss 테스트 카드)
    await paymentPage.fillCardInfo({
      cardNumber: '5123-4567-8901-2346',
      expiry: '12/25',
      birthDate: '900101',
      password: '12',
    });

    await paymentPage.clickPayButton();

    // 결제 성공 페이지 확인
    await expect(page).toHaveURL(/\/subscription\/success/);
    await expect(page.locator('text=결제가 완료되었습니다')).toBeVisible();

    // DB 검증 (선택사항)
    const subscription = await getSubscriptionFromDB(
      process.env.E2E_TEST_USER_EMAIL!
    );
    expect(subscription.status).toBe('active');
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    const paymentPage = new PaymentPage(page);

    await page.goto('/subscription/plans');
    await page.click('[data-plan="premium"]');

    await paymentPage.waitForPaymentWidget();

    // 실패 테스트 카드 (Toss에서 제공)
    await paymentPage.fillCardInfo({
      cardNumber: '5123-4567-8901-2347', // 잔액 부족 카드
      expiry: '12/25',
      birthDate: '900101',
      password: '12',
    });

    await paymentPage.clickPayButton();

    // 에러 메시지 확인
    await expect(
      page.locator('text=결제에 실패했습니다')
    ).toBeVisible();
  });
});
```

### 3.3 Supabase 데이터 관리

#### 전략: 테스트 전용 프로젝트 + 트랜잭션 롤백

```typescript
// e2e/utils/db-helpers.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cleanupTestData(userId: string) {
  // 테스트 데이터 삭제
  await supabase.from('analysis_results').delete().eq('user_id', userId);
  await supabase.from('subscriptions').delete().eq('user_id', userId);
  await supabase.from('payment_history').delete().eq('user_id', userId);
}

export async function seedTestData(userId: string) {
  // 테스트에 필요한 초기 데이터 삽입
  await supabase.from('user_profiles').upsert({
    id: userId,
    full_name: 'E2E Test User',
    email: process.env.E2E_TEST_USER_EMAIL,
  });
}

// global-setup.ts에서 사용
export async function setupDatabase() {
  const testUserId = 'e2e-test-user-id';
  await cleanupTestData(testUserId);
  await seedTestData(testUserId);
}
```

### 3.4 네트워크 요청 인터셉트

```typescript
// e2e/specs/analysis/upload-pdf.spec.ts
import { test, expect } from '@playwright/test';

test('should show loading state during PDF upload', async ({ page }) => {
  // 네트워크 속도 제한
  await page.route('**/api/analyze/upload', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 지연
    await route.continue();
  });

  await page.goto('/analysis/new');
  await page.setInputFiles('input[type="file"]', './fixtures/sample.pdf');
  await page.click('button[type="submit"]');

  // 로딩 스피너 확인
  await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

  // 완료 후 결과 확인
  await expect(page.locator('text=분석 완료')).toBeVisible({ timeout: 10000 });
});
```

---

## 4. Page Object Model (POM) 패턴

### 구현 예시 (`e2e/pages/LoginPage.ts`)

```typescript
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // 셀렉터 정의
  private selectors = {
    emailInput: 'input[name="identifier"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
  };

  // 액션 메서드
  async goto() {
    await this.page.goto('/sign-in');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.click(this.selectors.submitButton);

    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.submitButton);
  }

  async waitForPageLoad() {
    await expect(this.page.locator(this.selectors.emailInput)).toBeVisible();
  }

  async expectError(message: string) {
    await expect(
      this.page.locator(this.selectors.errorMessage)
    ).toContainText(message);
  }
}

// 사용 예시
test('should login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(
    process.env.E2E_TEST_USER_EMAIL!,
    process.env.E2E_TEST_USER_PASSWORD!
  );

  await expect(page).toHaveURL(/\/dashboard/);
});
```

---

## 5. 핵심 사용자 시나리오 테스트

### 5.1 인증 플로우

#### 회원가입 (`e2e/specs/auth/signup.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('User Signup', () => {
  test('should create new account successfully', async ({ page }) => {
    const testEmail = faker.internet.email();
    const testPassword = 'Test1234!@#$';

    await page.goto('/sign-up');

    await page.fill('input[name="emailAddress"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 이메일 인증 안내 확인
    await expect(page.locator('text=이메일을 확인해주세요')).toBeVisible();

    // 실제 환경에서는 Clerk의 이메일 인증 링크 클릭 시뮬레이션 필요
    // (테스트 환경에서는 자동 승인 설정 가능)
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/sign-up');

    // 이미 존재하는 이메일 사용
    await page.fill('input[name="emailAddress"]', process.env.E2E_TEST_USER_EMAIL!);
    await page.fill('input[name="password"]', 'Test1234!@#$');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=이미 사용 중인 이메일입니다')
    ).toBeVisible();
  });
});
```

### 5.2 PDF 분석 플로우

#### 파일 업로드 및 분석 (`e2e/specs/analysis/upload-pdf.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';
import { test as authTest } from '../../fixtures/auth.fixture';

authTest.describe('PDF Analysis', () => {
  authTest('should upload PDF and receive analysis', async ({ authenticatedPage: page }) => {
    await page.goto('/analysis/new');

    // PDF 파일 업로드
    const filePath = path.join(__dirname, '../../fixtures/sample-research-paper.pdf');
    await page.setInputFiles('input[type="file"]', filePath);

    // 분석 옵션 선택
    await page.check('input[value="summary"]');
    await page.check('input[value="keywords"]');

    await page.click('button[type="submit"]');

    // 분석 진행 중 상태 확인
    await expect(page.locator('text=AI가 문서를 분석하고 있습니다')).toBeVisible();

    // 분석 완료 대기 (최대 60초)
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible({
      timeout: 60000,
    });

    // 결과 검증
    const summary = page.locator('[data-testid="summary-section"]');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/[^\s]{10,}/); // 최소 10자 이상

    // 스크린샷 저장 (시각적 회귀 테스트)
    await page.screenshot({ path: 'e2e-screenshots/analysis-result.png', fullPage: true });
  });

  authTest('should handle invalid file type', async ({ authenticatedPage: page }) => {
    await page.goto('/analysis/new');

    // 이미지 파일 업로드 시도
    await page.setInputFiles('input[type="file"]', './fixtures/invalid-image.jpg');

    await expect(
      page.locator('text=PDF 파일만 업로드 가능합니다')
    ).toBeVisible();
  });
});
```

### 5.3 구독 결제 플로우

위 3.2 섹션 참고

### 5.4 크리티컬 패스 스모크 테스트

```typescript
// e2e/specs/smoke/critical-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Journey', () => {
  test('should complete end-to-end workflow', async ({ page }) => {
    // 1. 로그인
    await page.goto('/sign-in');
    await page.fill('input[name="identifier"]', process.env.E2E_TEST_USER_EMAIL!);
    await page.click('button[type="submit"]');
    await page.fill('input[name="password"]', process.env.E2E_TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    // 2. PDF 분석 시작
    await page.click('text=새 분석 시작');
    await page.setInputFiles('input[type="file"]', './fixtures/sample.pdf');
    await page.click('button:has-text("분석 시작")');

    // 3. 결과 확인
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible({
      timeout: 60000,
    });

    // 4. 구독 페이지 이동
    await page.click('text=프리미엄으로 업그레이드');
    await expect(page).toHaveURL(/\/subscription\/plans/);

    // 5. 로그아웃
    await page.click('[data-testid="user-menu"]');
    await page.click('text=로그아웃');
    await expect(page).toHaveURL('/');
  });
});
```

---

## 6. CI/CD 통합

### GitHub Actions 워크플로우 (`.github/workflows/e2e.yml`)

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # 매일 오전 2시 실행

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.project }}

      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.project }}
        env:
          E2E_BASE_URL: ${{ secrets.STAGING_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
          E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
          retention-days: 7

      - name: Upload Test Videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-videos-${{ matrix.project }}
          path: test-results/
          retention-days: 7
```

### Docker를 활용한 로컬 CI 환경

```dockerfile
# Dockerfile.e2e
FROM mcr.microsoft.com/playwright:v1.41.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
```

```bash
# 로컬에서 CI 환경과 동일하게 테스트 실행
docker build -t supernext-e2e -f Dockerfile.e2e .
docker run --rm \
  -e E2E_BASE_URL=http://host.docker.internal:3000 \
  supernext-e2e
```

---

## 7. 시각적 회귀 테스트

### Playwright의 스크린샷 비교 활용

```typescript
// e2e/specs/visual/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';

authTest('dashboard should match visual snapshot', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard');

  // 동적 콘텐츠 마스킹 (날짜, 시간 등)
  await page.addStyleTag({
    content: `
      [data-testid="current-time"],
      [data-testid="user-avatar"] {
        visibility: hidden;
      }
    `,
  });

  // 스크린샷 비교
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    maxDiffPixels: 100, // 허용 오차
  });
});
```

---

## 8. 디버깅 도구 활용

### Trace Viewer 사용

```bash
# 실패한 테스트의 트레이스 확인
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Codegen으로 테스트 자동 생성

```bash
# 브라우저에서 액션을 녹화하여 테스트 코드 생성
npx playwright codegen http://localhost:3000
```

### UI Mode로 인터랙티브 디버깅

```bash
# 테스트를 단계별로 실행하며 디버깅
npx playwright test --ui
```

---

## 9. 성능 테스트 통합 (선택사항)

### Lighthouse CI 연동

```typescript
// e2e/specs/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test('should meet performance benchmarks', async ({ page }) => {
  await page.goto('/dashboard');

  await playAudit({
    page,
    thresholds: {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    },
    port: 9222,
  });
});
```

---

## 10. package.json 스크립트 추가

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:report": "playwright show-report",
    "test:e2e:codegen": "playwright codegen http://localhost:3000"
  }
}
```

---

## 11. 마이그레이션 계획

### Phase 1: 기반 구축 (1주)
1. Playwright 설치 및 설정
2. 테스트 전용 Supabase 프로젝트 생성
3. Clerk 테스트 계정 설정
4. CI/CD 파이프라인 통합

### Phase 2: 크리티컬 패스 테스트 (2주)
1. 인증 플로우 (회원가입, 로그인, 로그아웃)
2. PDF 분석 핵심 시나리오
3. 결제 및 구독 플로우
4. 스모크 테스트 작성

### Phase 3: 확장 및 안정화 (2주)
1. 모든 주요 기능 커버리지 확보
2. 시각적 회귀 테스트 추가
3. 성능 벤치마크 설정
4. 플레이키 테스트 제거

### Phase 4: 모니터링 및 최적화 (지속)
1. 테스트 실행 시간 최적화
2. 실패율 모니터링 및 개선
3. 정기 유지보수 (브라우저 업데이트 대응)

---

## 12. 모범 사례 가이드라인

### DO
- ✅ 사용자 관점에서 테스트 작성 (ID보다 텍스트 셀렉터 우선)
- ✅ Page Object Model로 중복 제거
- ✅ 각 테스트를 독립적으로 실행 가능하게 유지
- ✅ 실패 시 스크린샷 + 비디오로 디버깅
- ✅ data-testid 속성으로 안정적인 셀렉터 확보

### DON'T
- ❌ 하드코딩된 `sleep()` 대신 `waitForSelector()` 사용
- ❌ 프로덕션 DB 직접 테스트 금지
- ❌ 테스트 간 데이터 공유 금지
- ❌ 너무 세밀한 단위까지 E2E로 테스트 (단위 테스트 영역)
- ❌ 외부 서비스 실패 시 테스트 실패 처리 (재시도 로직 추가)

---

## 13. 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Clerk Testing Guide](https://clerk.com/docs/testing/overview)
- [Toss Payments Test Guide](https://docs.tosspayments.com/guides/test)
- [Next.js E2E Testing](https://nextjs.org/docs/testing#playwright)
