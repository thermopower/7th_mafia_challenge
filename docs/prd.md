# PRD: AI 기반 구독형 사주풀이 웹 서비스

> **문서 버전**: 1.0
> **작성일**: 2025-10-24
> **프로젝트 코드명**: SuperNext

---

## 1. 제품 개요

### 1.1 프로젝트 목표
AI 기반의 구독형 사주풀이 웹 서비스를 구현하여, 가입 회원이 AI가 생성한 사주 분석 결과를 조회하고 저장 및 관리할 수 있는 플랫폼을 제공합니다.

### 1.2 핵심 가치 제안
- **AI 기반 정확성**: Google Gemini API를 활용한 고품질 사주 분석
- **구조화된 결과**: JSON 스키마 기반의 일관된 분석 결과 제공
- **유연한 구독 모델**: 무료/Pro 요금제를 통한 차별화된 서비스
- **편리한 관리**: 본인 및 가족/지인의 사주 정보를 프로필로 관리

### 1.3 성공 지표
- 신규 가입자 수
- Pro 구독 전환율
- 월간 활성 사용자(MAU)
- 평균 사용자당 분석 횟수
- 구독 유지율(Retention Rate)

---

## 2. Stakeholders

### 2.1 주요 이해관계자
- **서비스 기획자**: 제품 로드맵 및 기능 우선순위 결정
- **개발팀**: 풀스택 개발 및 외부 서비스 연동
- **마케팅팀**: 사용자 획득 및 전환율 최적화
- **고객지원팀**: 사용자 문의 및 피드백 대응
- **최종 사용자**: 사주풀이 서비스를 이용하는 일반 고객

### 2.2 외부 서비스 제공자
- **Clerk**: 인증 및 회원 관리
- **Supabase**: 데이터베이스 및 백엔드 인프라
- **Google AI (Gemini)**: AI 사주 분석 엔진
- **토스페이먼츠**: 결제 및 구독 관리

---

## 3. 기술 스택

### 3.1 프론트엔드
- **프레임워크**: Next.js (App Router)
- **UI 라이브러리**: React 18+, shadcn-ui, Tailwind CSS
- **아이콘**: lucide-react
- **상태 관리**:
  - Zustand (클라이언트 전역 상태)
  - @tanstack/react-query (서버 상태)
- **폼 관리**: react-hook-form + zod
- **유틸리티**: date-fns, es-toolkit, react-use, ts-pattern

### 3.2 백엔드
- **API 프레임워크**: Hono (Next.js Route Handler 위임)
- **데이터베이스**: Supabase (PostgreSQL)
- **런타임**: Node.js (Next.js API Routes)
- **검증**: Zod
- **스케줄링**: Supabase Cron (정기 결제 트리거)

### 3.3 외부 서비스 연동

#### 3.3.1 Clerk (인증 및 회원 관리)
- **SDK**: `@clerk/nextjs`, `@clerk/localizations`
- **기능**:
  - 소셜 로그인 (구글)
  - 세션 관리 및 라우트 보호 (Middleware)
  - 사용자 메타데이터 관리 (플랜/크레딧)
  - Webhook (`user.created`, `user.updated`, `user.deleted`)
- **환경변수**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (클라이언트)
  - `CLERK_SECRET_KEY` (서버)
  - `CLERK_WEBHOOK_SECRET` (Webhook 검증)

#### 3.3.2 Google Gemini API
- **SDK**: `@google/genai`
- **모델**:
  - 무료 사용자: `gemini-2.5-flash`
  - Pro 사용자: `gemini-2.5-pro`
- **기능**:
  - 구조화 출력 (JSON Schema 기반)
  - 텍스트 생성 및 멀티모달 처리
- **환경변수**:
  - `GEMINI_API_KEY` (서버 전용)

#### 3.3.3 토스페이먼츠
- **SDK**: `@tosspayments/payment-widget-sdk` (선택적)
- **API**: REST API (결제 승인/조회/취소/빌링)
- **Webhook**: 결제 상태 변경 이벤트 수신
- **환경변수**:
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY` (클라이언트)
  - `TOSS_SECRET_KEY` (서버)
  - `TOSS_WEBHOOK_SECRET` (Webhook 검증)

---

## 4. 포함 페이지

### 4.1 페이지 목록

| 페이지명 | 경로 | 인증 필요 | 설명 |
|---------|------|----------|------|
| 홈 (랜딩) | `/` | X | 서비스 소개 및 로그인/회원가입 진입점 |
| 대시보드 (분석 목록) | `/dashboard` | O | 과거 분석 내역 조회 (검색/필터/삭제) |
| 새 분석하기 | `/analyze/new` | O | 사주 정보 입력 및 분석 요청 |
| 분석 상세보기 | `/analyze/[id]` | O | 분석 결과 조회 및 PDF 다운로드/공유 |
| 구독 관리 | `/subscription` | O | 구독 상태 확인 및 Pro 결제/해지 |
| 프로필 관리 | `/profiles` | O | 저장된 대상 인물(프로필) CRUD |
| 결제 성공 | `/payments/success` | O | 결제 승인 처리 후 리다이렉트 |
| 결제 실패 | `/payments/fail` | O | 결제 실패 안내 |
| 마이페이지 | `/my-account` | O | Clerk 기본 UI (정보 수정/로그아웃/탈퇴) |

### 4.2 API 엔드포인트 (Hono)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/webhook` | POST | Clerk Webhook 수신 |
| `/api/profiles` | GET/POST/PUT/DELETE | 대상 인물 CRUD |
| `/api/analyze` | POST | AI 사주 분석 요청 |
| `/api/analyze/[id]` | GET | 특정 분석 결과 조회 |
| `/api/analyze/list` | GET | 사용자 분석 목록 (페이지네이션/필터) |
| `/api/payments/confirm` | POST | 토스페이먼츠 결제 승인 |
| `/api/payments/webhook` | POST | 토스페이먼츠 Webhook 수신 |
| `/api/billing/issue` | POST | 빌링키 발급 |
| `/api/billing/charge` | POST | 정기 결제 과금 |
| `/api/subscription/status` | GET | 구독 상태 조회 |
| `/api/subscription/cancel` | POST | 구독 취소 |

---

## 5. 사용자 여정 (User Journey)

### 5.1 타겟 유저 Segment

#### Segment 1: 무료 사용자 (Free Tier)
- **특징**: 사주풀이에 관심은 있지만 유료 결제 전 체험을 원하는 사용자
- **제공**: 최초 가입 시 3회 무료 분석 (gemini-2.5-flash)
- **목표**: Pro 전환 유도

#### Segment 2: Pro 구독자 (Premium Tier)
- **특징**: 정기적으로 사주풀이를 활용하는 열성 사용자
- **제공**: 월 10회 분석 (gemini-2.5-pro)
- **목표**: 구독 유지 및 재이용 촉진

### 5.2 핵심 사용자 여정

#### Journey 1: 신규 가입 및 첫 분석 (무료 사용자)

```
[홈] → [회원가입(Clerk)] → [대시보드] → [새 분석하기] → [분석 상세보기] → [대시보드]
```

1. **홈 (`/`)**: "시작하기" 버튼 클릭
2. **회원가입**: Clerk 소셜 로그인 (구글)
   - Webhook으로 Supabase에 프로필 생성 (무료 플랜, 3회 크레딧)
3. **대시보드 (`/dashboard`)**: 빈 상태 → "첫 분석하기" CTA
4. **새 분석하기 (`/analyze/new`)**:
   - 탭 선택: "새로 입력하기" / "프로필 불러오기"
   - 정보 입력: 이름, 성별, 생년월일시, 분석 종류 (월간/신년/평생)
   - "분석 시작" 클릭 → 로딩 애니메이션
5. **분석 상세보기 (`/analyze/[id]`)**:
   - AI 결과를 카드 형태로 표시 (총운/재물운/애정운 등)
   - PDF 다운로드 / 카카오톡 공유 버튼
6. **대시보드 복귀**: 분석 내역 1건 표시

#### Journey 2: Pro 구독 전환

```
[대시보드] → [구독 관리] → [결제] → [결제 성공] → [대시보드]
```

1. **대시보드 (`/dashboard`)**: "남은 횟수: 0회" 배너 → "Pro로 업그레이드" 버튼
2. **구독 관리 (`/subscription`)**:
   - 무료 vs Pro 비교표
   - "Pro 구독하기" 버튼 → 토스페이먼츠 결제위젯 렌더링
3. **결제 (`/payments/success?paymentKey=...`)**:
   - 서버에서 `POST /v1/payments/confirm` 승인
   - Supabase 구독 상태 업데이트 (빌링키 저장)
   - Clerk 메타데이터 업데이트 (`publicMetadata.plan = "pro"`)
4. **대시보드 복귀**: "Pro 사용자" 배지 표시, 월 10회 크레딧 부여

#### Journey 3: 정기 사용 (Pro 사용자)

```
[대시보드] → [새 분석하기(프로필)] → [분석 상세보기] → [PDF 저장/공유]
```

1. **대시보드 (`/dashboard`)**:
   - 최근 분석 10건 표시
   - 검색/필터 기능 활용
2. **새 분석하기 (`/analyze/new`)**:
   - "프로필 불러오기" 탭에서 저장된 가족 선택
   - 빠른 입력 → 분석 시작
3. **분석 상세보기 (`/analyze/[id]`)**:
   - 고품질 결과 (gemini-2.5-pro)
   - PDF 다운로드 또는 카카오톡 공유

#### Journey 4: 구독 취소 및 재구독

```
[구독 관리] → [구독 취소] → [취소 예정 상태] → (다음 결제일 도래) → [구독 만료]
```

1. **구독 관리 (`/subscription`)**: "구독 취소" 버튼
2. **취소 예정 상태**: 다음 결제일까지 Pro 혜택 유지, "취소 철회" 옵션 제공
3. **구독 만료**:
   - Supabase Cron → 빌링키 삭제 (`DELETE /v1/billing/{billingKey}`)
   - 무료 플랜으로 다운그레이드 (크레딧 0회)
4. **재구독**: "구독 관리" → 새로운 빌링키 발급 및 결제

---

## 6. Information Architecture (IA)

### 6.1 IA Tree

```
SuperNext (사주풀이 서비스)
│
├── 홈 (/)
│   ├── 서비스 소개
│   ├── 주요 기능
│   ├── 요금제 안내
│   └── 로그인/회원가입 CTA
│
├── 인증 (Clerk)
│   ├── 로그인
│   ├── 회원가입
│   └── 마이페이지 (/my-account)
│       ├── 프로필 정보 수정
│       ├── 로그아웃
│       └── 회원 탈퇴
│
├── 대시보드 (/dashboard) [인증 필요]
│   ├── 분석 내역 목록 (페이지네이션)
│   ├── 검색 (이름)
│   ├── 필터 (분석 종류)
│   ├── 삭제 (개별 항목)
│   └── → 분석 상세보기
│
├── 분석 (/analyze)
│   ├── 새 분석하기 (/analyze/new) [인증 필요]
│   │   ├── [탭] 새로 입력하기
│   │   │   ├── 이름
│   │   │   ├── 성별
│   │   │   ├── 생년월일시 (양력/음력)
│   │   │   └── 분석 종류 (월간/신년/평생)
│   │   ├── [탭] 프로필 불러오기
│   │   │   └── 저장된 프로필 목록 선택
│   │   └── 분석 시작 버튼 → 로딩 → 결과 페이지
│   │
│   └── 분석 상세보기 (/analyze/[id]) [인증 필요]
│       ├── 대상 정보 헤더
│       ├── 분석 결과 카드
│       │   ├── 총운
│       │   ├── 재물운
│       │   ├── 애정운
│       │   ├── 건강운
│       │   └── 직업운
│       ├── PDF 다운로드
│       └── 공유 (카카오톡/링크 복사)
│
├── 프로필 관리 (/profiles) [인증 필요]
│   ├── 프로필 목록
│   ├── 프로필 추가
│   ├── 프로필 수정
│   └── 프로필 삭제
│
├── 구독 관리 (/subscription) [인증 필요]
│   ├── 현재 플랜 정보
│   │   ├── 플랜명 (무료/Pro)
│   │   ├── 월간 제공 횟수
│   │   ├── 남은 횟수
│   │   └── 다음 결제일
│   ├── 요금제 비교
│   │   ├── 무료: 3회 (gemini-2.5-flash)
│   │   └── Pro: 월 10회 (gemini-2.5-pro)
│   ├── Pro 구독하기 (결제위젯)
│   ├── 구독 취소
│   └── 결제 내역
│
└── 결제 (/payments)
    ├── 결제 성공 (/payments/success) [인증 필요]
    │   └── 승인 처리 → 대시보드 리다이렉트
    └── 결제 실패 (/payments/fail) [인증 필요]
        └── 오류 안내 → 재시도 안내
```

### 6.2 데이터베이스 스키마 (Supabase)

```sql
-- 프로필 (Clerk과 동기화)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free', -- 'free' | 'pro'
  credits INT DEFAULT 3,
  billing_key TEXT, -- 토스페이먼츠 빌링키
  subscription_status TEXT DEFAULT 'active', -- 'active' | 'pending_cancel' | 'canceled'
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 대상 인물 (프로필)
CREATE TABLE subject_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL, -- 'male' | 'female'
  birth_date DATE NOT NULL,
  birth_time TIME,
  is_lunar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 분석 내역
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_profile_id UUID REFERENCES subject_profiles(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL, -- 'monthly' | 'yearly' | 'lifetime'
  model_used TEXT NOT NULL, -- 'gemini-2.5-flash' | 'gemini-2.5-pro'
  input_data JSONB NOT NULL, -- 사주팔자 원본 데이터
  result JSONB NOT NULL, -- AI 분석 결과 { general, wealth, love, health, job }
  created_at TIMESTAMP DEFAULT NOW()
);

-- 결제 내역
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_key TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  amount INT NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'done' | 'canceled'
  method TEXT, -- 'card' | 'virtualAccount' | 'billing'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 핵심 기능 명세

### 7.1 AI 사주 분석

#### 7.1.1 입력 정보
- 이름
- 성별 (남/여)
- 생년월일 (양력/음력 선택)
- 태어난 시간 (선택)

#### 7.1.2 사주 데이터 전처리
- 사용자 입력을 사주팔자(만세력) 데이터로 변환
  - 간지 (천간/지지)
  - 십신
  - 대운
- 검증된 데이터를 Gemini API 프롬프트에 포함

#### 7.1.3 분석 종류
- **월간 운세**: 이번 달 운세 (1개월)
- **신년 운세**: 올해 운세 (1년)
- **평생 운세**: 전반적인 삶의 흐름

#### 7.1.4 AI 프롬프트 설계
```typescript
const schema = {
  type: Type.OBJECT,
  properties: {
    general: { type: Type.STRING, description: "총운 (200자 이상)" },
    wealth: { type: Type.STRING, description: "재물운 (200자 이상)" },
    love: { type: Type.STRING, description: "애정운 (200자 이상)" },
    health: { type: Type.STRING, description: "건강운 (200자 이상)" },
    job: { type: Type.STRING, description: "직업운 (200자 이상)" },
  },
  required: ["general", "wealth", "love", "health", "job"],
  propertyOrdering: ["general", "wealth", "love", "health", "job"],
};

const prompt = `
아래 사주팔자 데이터를 바탕으로 ${analysisType} 운세를 분석해주세요.
각 항목은 200자 이상 한국어로 작성하며, 구체적이고 긍정적인 조언을 포함하세요.

사주 데이터:
- 이름: ${name}
- 성별: ${gender}
- 사주팔자: ${sajuData}
- 분석 종류: ${analysisType}

JSON 스키마에 맞춰 결과를 반환하세요.
`;
```

#### 7.1.5 결과 저장
- 분석 성공 시 Supabase `analyses` 테이블에 저장
- 사용자 크레딧 차감 (`profiles.credits - 1`)
- 실패 시 크레딧 차감 없음

### 7.2 구독 정책 및 사용자 등급

#### 7.2.1 무료 사용자 (Free Tier)
| 항목 | 값 |
|------|-----|
| 월간 제공 횟수 | 최초 3회 (충전 없음) |
| AI 모델 | gemini-2.5-flash |
| 결제 | 불필요 |

#### 7.2.2 Pro 요금제
| 항목 | 값 |
|------|-----|
| 월간 제공 횟수 | 10회 |
| AI 모델 | gemini-2.5-pro |
| 월 요금 | ₩10,000 (예시) |
| 결제 방식 | 자동결제 (빌링키) |

#### 7.2.3 사용량 관리
- **차감 시점**: AI 분석 결과 생성 성공 시
- **잔여 횟수 알림**: 3회 이하일 때 팝업 표시
- **크레딧 이월**: 불가 (매월 결제일에 초기화)
- **명시 위치**: 구독 관리 페이지에 고지

### 7.3 구독 및 결제 관리

#### 7.3.1 구독 프로세스
```
[구독 관리] → [결제위젯] → [본인인증/카드 등록] → [빌링키 발급] → [첫 결제] → [Pro 활성화]
```

#### 7.3.2 구독 취소
1. 사용자가 "구독 취소" 버튼 클릭
2. 상태를 `pending_cancel`로 변경
3. 다음 결제일까지 Pro 혜택 유지
4. "취소 철회" 버튼으로 재활성화 가능

#### 7.3.3 구독 만료
1. 다음 결제일에 Supabase Cron 트리거
2. `pending_cancel` 상태인 경우:
   - 빌링키 삭제 (`DELETE /v1/billing/{billingKey}`)
   - 플랜을 `free`로 변경
   - 크레딧 0으로 초기화
3. `active` 상태인 경우:
   - 자동 결제 실행 (`POST /v1/billing/{billingKey}`)
   - 성공 시 크레딧 10으로 충전
   - 실패 시 3회 재시도 후 구독 취소

#### 7.3.4 재구독
- 만료 후 재구독 시 새로운 빌링키 발급 필요
- 기존 분석 내역은 유지

### 7.4 대상 인물 관리 (프로필 기능)

#### 7.4.1 CRUD 기능
- **생성**: 이름, 성별, 생년월일시 입력 후 저장
- **조회**: 사용자별 프로필 목록 표시
- **수정**: 기존 프로필 정보 업데이트
- **삭제**: 프로필 삭제 (연관된 분석 내역은 유지)

#### 7.4.2 활용
- "새 분석하기" 페이지에서 프로필 선택 시 자동 입력
- 가족, 친구 등 자주 보는 사람의 정보를 저장하여 편의성 향상

---

## 8. 페이지별 상세 기능

### 8.1 공통 사항
- 홈(랜딩)을 제외한 모든 페이지는 Clerk 인증 필수
- Clerk 기본 컴포넌트 활용:
  - `<SignIn />`, `<SignUp />`, `<UserButton />`
- 미들웨어로 보호된 경로 자동 리다이렉트

### 8.2 홈 (랜딩 페이지) `/`

#### 8.2.1 디자인
- 토스페이먼츠 웹사이트 스타일 벤치마킹
- 깔끔하고 현대적인 레이아웃
- 반응형 디자인 (모바일 최적화)

#### 8.2.2 헤더 구성
**미로그인 상태**:
- 서비스 로고 (좌측)
- 로그인 / 회원가입 버튼 (우측)

**로그인 상태**:
- 서비스 로고 (좌측)
- 메뉴: 분석 목록 / 새 분석하기 / 구독 관리
- 사용자 프로필 아이콘 (Clerk UserButton)
  - 정보 수정
  - 로그아웃
  - 회원 탈퇴

#### 8.2.3 주요 섹션
- Hero Section: 서비스 핵심 가치 제안
- Features: AI 분석, 구독 모델, 프로필 관리 등
- Pricing: 무료 vs Pro 비교표
- CTA: "무료로 시작하기" 버튼

### 8.3 대시보드 (분석 목록) `/dashboard`

#### 8.3.1 레이아웃
- 헤더: 현재 플랜, 남은 횟수 표시
- 검색바: 대상 이름으로 검색
- 필터: 분석 종류별 (전체/월간/신년/평생)
- 목록: 카드 형태, 페이지당 10개

#### 8.3.2 카드 정보
- 대상 이름
- 분석 종류 (배지)
- 분석 날짜
- 썸네일 이모지
- 삭제 버튼 (휴지통 아이콘)

#### 8.3.3 페이지네이션
- 하단에 페이지 번호 표시
- 이전/다음 버튼

#### 8.3.4 빈 상태
- "아직 분석 내역이 없습니다"
- "첫 분석하기" CTA 버튼

### 8.4 새 분석하기 `/analyze/new`

#### 8.4.1 탭 구조
**탭 1: 새로 입력하기**
- 이름 (텍스트)
- 성별 (라디오 버튼: 남/여)
- 생년월일 (날짜 선택기 + 양력/음력 토글)
- 태어난 시간 (시간 선택기, 선택사항)
- 분석 종류 (드롭다운: 월간/신년/평생)

**탭 2: 프로필 불러오기**
- 저장된 프로필 목록 (카드 형태)
- 선택 시 자동 입력
- "새 프로필 추가" 버튼 → 프로필 관리 페이지

#### 8.4.2 분석 시작 버튼
- 클릭 시 잔여 횟수 확인
  - 0회인 경우: "구독이 필요합니다" 모달 → 구독 관리 페이지
  - 3회 이하인 경우: "남은 횟수: N회" 알림
- 로딩 화면:
  - 애니메이션 (별자리 회전 등)
  - 메시지: "운명을 해석하고 있습니다..."
  - 예상 소요 시간: 10~30초

#### 8.4.3 오류 처리
- AI 생성 실패 시: "잠시 후 다시 시도해주세요" 토스트
- 크레딧 차감 없음
- 재시도 버튼 제공

### 8.5 분석 상세보기 `/analyze/[id]`

#### 8.5.1 헤더
- 대상 이름
- 분석 종류
- 분석 날짜
- 사용 모델 (배지: Flash/Pro)

#### 8.5.2 결과 카드
각 카드는 다음 정보를 포함:
- 제목 + 이모지 (예: 총운 🌟, 재물운 💰, 애정운 💕, 건강운 🏥, 직업운 💼)
- AI 생성 내용 (200자 이상)
- 카드 디자인: shadcn-ui Card 컴포넌트 활용

#### 8.5.3 부가 기능
**PDF 다운로드**:
- 현재 페이지 디자인 그대로 PDF 생성
- 라이브러리: `html2pdf.js` 또는 `jsPDF`

**공유하기**:
- 카카오톡 공유 (Kakao SDK)
- 링크 복사 (클립보드 API)

#### 8.5.4 관련 분석
- 하단에 동일 대상의 다른 분석 내역 표시 (최대 3개)

### 8.6 구독 관리 `/subscription`

#### 8.6.1 현재 플랜 섹션
- 플랜명 (무료/Pro)
- 월간 제공 횟수
- 남은 횟수 (프로그레스 바)
- 다음 결제일 (Pro만 표시)
- 구독 상태 (활성/취소 예정)

#### 8.6.2 요금제 비교표
| 항목 | 무료 | Pro |
|------|------|-----|
| 월간 횟수 | 3회 (최초만) | 10회 |
| AI 모델 | Flash | Pro |
| 월 요금 | ₩0 | ₩10,000 |

#### 8.6.3 구독 액션
**무료 사용자**:
- "Pro로 업그레이드" 버튼 → 결제위젯 렌더링

**Pro 사용자 (활성)**:
- "구독 취소" 버튼 → 확인 모달
  - "다음 결제일까지 혜택이 유지됩니다"
  - "취소 후 언제든 재활성화 가능합니다"

**Pro 사용자 (취소 예정)**:
- "구독 재활성화" 버튼
- 만료 예정일 표시

#### 8.6.4 결제 내역
- 최근 12개월 결제 내역 (테이블)
- 영수증 다운로드 (토스페이먼츠 영수증 API)

### 8.7 프로필 관리 `/profiles`

#### 8.7.1 프로필 목록
- 카드 형태 (이름, 성별, 생년월일)
- 수정/삭제 버튼

#### 8.7.2 프로필 추가
- 모달 또는 인라인 폼
- 필드: 이름, 성별, 생년월일시, 양력/음력

#### 8.7.3 프로필 수정
- 기존 정보 프리로드된 폼

#### 8.7.4 프로필 삭제
- 확인 모달: "연관된 분석 내역은 유지됩니다"

---

## 9. 비기능 요구사항

### 9.1 성능
- **페이지 로드 시간**: 초기 로드 2초 이내 (LCP < 2.5s)
- **AI 분석 응답 시간**: 평균 15초, 최대 30초
- **API 응답 시간**: 95 percentile 500ms 이하
- **동시 사용자**: 1,000명 이상 지원

### 9.2 보안
- **API 키 관리**:
  - 클라이언트: `NEXT_PUBLIC_*` 접두사만 노출
  - 서버: `.env.local` + 환경변수로 관리
- **인증/인가**:
  - Clerk Middleware로 라우트 보호
  - JWT 기반 세션 관리
- **Webhook 검증**:
  - Clerk: `verifyWebhook()` (Svix 서명)
  - 토스페이먼츠: `secret` 일치 확인 + 조회 API 교차검증
- **데이터 보호**:
  - Supabase RLS 비활성화 (서버 전용 접근)
  - 민감 정보 암호화 (빌링키 등)

### 9.3 확장성
- **수평 확장**: Vercel Serverless Functions (자동 스케일링)
- **데이터베이스**: Supabase Connection Pooling
- **캐싱**:
  - React Query로 클라이언트 캐싱 (5분 stale time)
  - CDN 캐싱 (정적 자산)

### 9.4 가용성
- **목표 Uptime**: 99.9% (월 43분 이하 다운타임)
- **모니터링**: Sentry (에러 추적), Vercel Analytics (성능)
- **백업**: Supabase 자동 백업 (일 1회)

### 9.5 접근성
- **WCAG 2.1 AA** 준수
- **키보드 네비게이션** 지원
- **스크린 리더** 호환 (ARIA 속성)
- **색상 대비**: 4.5:1 이상

### 9.6 다국어 지원
- **초기 버전**: 한국어만
- **향후 확장**: Clerk 현지화 + i18n 라이브러리 (next-intl)

---

## 10. 제약사항 및 고려사항

### 10.1 외부 서비스 의존성
- **Clerk 장애 시**: 로그인 불가 → 장애 페이지 표시
- **Gemini API 장애 시**: 분석 실패 → 크레딧 차감 없이 재시도 안내
- **토스페이먼츠 장애 시**: 결제 불가 → 고객센터 안내

### 10.2 AI 결과 품질 관리
- **프롬프트 엔지니어링**: 정기적 리뷰 및 개선
- **모니터링**: 생성 실패율 추적 (목표 < 5%)
- **피드백 수집**: 사용자 만족도 조사 (향후)

### 10.3 법적 고려사항
- **면책 조항**: "사주풀이는 참고용이며, 법적 책임 없음"
- **개인정보 처리방침**: Clerk, Supabase, Gemini, 토스페이먼츠 연동 명시
- **환불 정책**: 구독 취소 시 즉시 환불 불가 (차기 결제일까지 혜택 유지)

### 10.4 기술적 제약
- **Supabase Cron**: 최소 1분 간격 → 정기 결제는 일 1회 실행
- **토스페이먼츠 승인 시간**: 성공 리다이렉트 후 10분 이내 승인 필수
- **Gemini API Rate Limit**: QPM 제한 → 큐잉 시스템 필요 (향후)

### 10.5 운영 고려사항
- **고객 지원**: 이메일 또는 챗봇 (향후)
- **공지사항**: 메인 페이지 배너 또는 모달
- **정기 점검**: 월 1회 새벽 시간대 (사전 공지)

---

## 11. 개발 우선순위 및 로드맵

### Phase 1: MVP (최소 기능 제품)
**목표**: 핵심 기능 동작 검증
**기간**: 4주

- [x] Next.js + Hono 백엔드 구조 세팅
- [ ] Clerk 인증 연동 (회원가입/로그인/Webhook)
- [ ] Supabase 테이블 마이그레이션
- [ ] 새 분석하기 (직접 입력만)
- [ ] Gemini API 연동 (gemini-2.5-flash)
- [ ] 분석 상세보기 (기본 UI)
- [ ] 대시보드 (목록만, 검색/필터 없음)

### Phase 2: 결제 및 구독
**목표**: 수익 모델 구현
**기간**: 3주

- [ ] 토스페이먼츠 연동 (빌링키 발급/자동결제)
- [ ] 구독 관리 페이지
- [ ] Pro 플랜 전환 및 크레딧 시스템
- [ ] Supabase Cron 정기 결제
- [ ] Webhook (결제 상태 변경)

### Phase 3: UX 개선
**목표**: 사용성 향상
**기간**: 2주

- [ ] 프로필 관리 (CRUD)
- [ ] 대시보드 검색/필터/삭제
- [ ] PDF 다운로드
- [ ] 카카오톡 공유
- [ ] 반응형 디자인 최적화

### Phase 4: 고급 기능
**목표**: 차별화 및 리텐션 강화
**기간**: 4주

- [ ] gemini-2.5-pro 모델 적용 (Pro 전용)
- [ ] 분석 결과 비교 (과거 vs 현재)
- [ ] 알림 시스템 (분석 완료/결제 실패 등)
- [ ] 관리자 대시보드 (사용자 통계/매출)

### Phase 5: 최적화 및 모니터링
**목표**: 안정성 및 성능 개선
**기간**: 2주

- [ ] Sentry 에러 추적
- [ ] Vercel Analytics 성능 모니터링
- [ ] React Query 캐싱 최적화
- [ ] SEO 최적화 (메타 태그/sitemap)

---

## 12. 성공 측정 지표 (KPI)

### 12.1 사용자 획득
- **신규 가입자 수**: 월 500명 이상 (목표)
- **가입 전환율**: 랜딩 페이지 방문자 중 10% 이상

### 12.2 활성화
- **첫 분석 완료율**: 가입 후 24시간 이내 80% 이상
- **MAU (월간 활성 사용자)**: 300명 이상

### 12.3 수익
- **Pro 전환율**: 무료 사용자 중 15% 이상
- **MRR (월간 반복 매출)**: ₩500,000 이상
- **ARPU (사용자당 평균 매출)**: ₩1,500 이상

### 12.4 리텐션
- **구독 유지율**: 3개월 후 70% 이상
- **분석 재이용률**: Pro 사용자의 월 평균 분석 횟수 5회 이상

### 12.5 만족도
- **NPS (순추천고객지수)**: 40 이상
- **분석 품질 평가**: 5점 만점 평균 4점 이상

---

## 13. 리스크 및 완화 전략

### 13.1 기술 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| Gemini API 안정성 저하 | 높음 | 재시도 로직 + 대체 모델 준비 (GPT-4o) |
| Clerk 서비스 장애 | 중간 | 장애 페이지 + 자체 인증 백업 (향후) |
| Supabase 응답 지연 | 중간 | 쿼리 최적화 + 인덱스 추가 |

### 13.2 비즈니스 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| 낮은 Pro 전환율 | 높음 | 무료 횟수 제한 + 품질 차별화 강화 |
| 사주풀이 법적 이슈 | 중간 | 면책 조항 + 법률 검토 |
| 경쟁 서비스 등장 | 중간 | 차별화 기능 (프로필 관리, PDF) 강화 |

### 13.3 운영 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| 정기 결제 실패율 증가 | 중간 | 자동 재시도 + 이메일 안내 |
| 고객 지원 폭주 | 낮음 | FAQ 페이지 + 챗봇 (향후) |

---

## 14. 부록

### 14.1 용어 사전
- **사주팔자**: 출생 연월일시를 천간과 지지로 표현한 8자
- **만세력**: 사주팔자를 계산하는 역법 체계
- **십신**: 사주의 오행 관계를 해석하는 10가지 신
- **대운**: 10년 단위로 바뀌는 운의 흐름
- **크레딧**: AI 분석 사용 가능 횟수
- **빌링키**: 자동결제를 위한 카드 정보 토큰

### 14.2 참고 문서
- [Clerk 공식 문서](https://clerk.com/docs)
- [Gemini API 가이드](https://ai.google.dev/gemini-api/docs)
- [토스페이먼츠 개발자센터](https://docs.tosspayments.com)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

### 14.3 변경 이력
| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2025-10-24 | 초안 작성 | Claude |

---

## 문서 승인

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| 제품 책임자 | - | - | - |
| 개발 리드 | - | - | - |
| 디자인 리드 | - | - | - |

---

**문서 끝**
