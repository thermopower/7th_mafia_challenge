아래는 2025-10-24 기준 공식 문서로 교차 검증해 정리한 **최종 연동 문서**입니다. 본 문서는 **SDK / REST API / Webhook(자체 엔드포인트)** 세 가지 수단을 모두 포함합니다. 각 섹션마다 **사용 기능, 설치·세팅, 인증정보 관리, 호출 방법**을 명확히 분리했고, 최신 권장사항(모델/구조화 출력/실시간 API 등)을 반영했습니다.

---

# 1) SDK 연동 — **Google Gen AI SDK (`@google/genai`)**

## 사용할 기능

* **텍스트/멀티모달 생성**: `models.generateContent` 표준/스트리밍 호출. ([Google AI for Developers][1])
* **구조화 출력(강제 JSON)**: `responseMimeType` + `responseSchema`로 **엄격한 JSON 스키마 준수**. ([Google AI for Developers][2])
* **최신 모델 명명 규칙**: `gemini-2.5-flash`(stable) 등 **2.5 세대 및 버전 정책**. ([Google AI for Developers][3])
* **(선택) 실시간 상호작용**: Live API(저지연 음성/텍스트) — WebSocket 사용, SDK 샘플 및 데모 제공. ([Google AI for Developers][4])

## 설치/세팅 방법

```bash
npm install @google/genai
```

* SDK GitHub와 공식 SDK 개요에서 `@google/genai`가 **권장 JS/TS SDK**임을 확인. ([GitHub][5])

## 인증정보 관리 방법

* **API 키 발급**: Google **AI Studio의 API Keys 페이지**에서 생성/관리. ([Google AI for Developers][6])
* **환경변수**: 서버 환경에 `GEMINI_API_KEY`로 설정 시 SDK가 **자동 인식**(언어별 퀵스타트 공통 권장). Next.js에서는 `.env.local`에 저장하고 **`NEXT_PUBLIC_` 접두사 사용 금지**(클라이언트 번들 노출). ([Google AI for Developers][7])

예) `.env.local`

```
GEMINI_API_KEY="발급받은_API_키"
```

## 호출 방법 (Node.js/Next.js 서버)

```ts
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({}); // GEMINI_API_KEY 자동 인식

const schema = {
  type: Type.OBJECT,
  properties: {
    general: { type: Type.STRING },
    wealth:  { type: Type.STRING },
    love:    { type: Type.STRING },
    health:  { type: Type.STRING },
    job:     { type: Type.STRING },
  },
  required: ["general", "wealth", "love", "health", "job"],
  propertyOrdering: ["general","wealth","love","health","job"],
};

const res = await ai.models.generateContent({
  model: "gemini-2.5-flash", // 안정(stable) 문자열 고정 권장
  contents: "사주 분석 JSON을 생성해줘…",
  config: {
    responseMimeType: "application/json",
    responseSchema: schema, // 스키마로 JSON 엄격 보장
  },
});
const data = JSON.parse(res.text);
```

* `generateContent` 표준 호출과 **구조화 출력** 가이드 준수. ([Google AI for Developers][1])
* **모델 표기**는 최신 규칙(Stable/Preview/Latest/Experimental)을 따른 **2.5 세대** 사용. ([Google AI for Developers][3])

---

# 2) REST API 연동 — **표준/스트리밍/실시간(웹소켓) 엔드포인트**

## 사용할 기능

* **표준 생성(단발성)**: `models.generateContent` REST 엔드포인트. ([Google AI for Developers][1])
* **스트리밍 생성**: 서버전송/청크 기반 응답으로 지연 최소화. (문서 및 예제 다수) ([Google AI for Developers][8])
* **실시간(Realtime/Live API)**: **WebSocket**으로 양방향(음성/텍스트/영상) 상호작용. ([Google AI for Developers][4])

## 설치/세팅 방법

* 별도 설치 불필요(HTTP 클라이언트 사용).
* **필수 사전 준비**: AI Studio에서 **API 키 발급**. ([Google AI for Developers][6])

## 인증정보 관리 방법

* 서버 환경변수로 `GEMINI_API_KEY` 저장(빌드/런타임 비노출).
* 요청 시 `Authorization: Bearer <GEMINI_API_KEY>` 헤더 사용(언어 무관). ([Google AI for Developers][8])

## 호출 방법

### (A) 표준 REST — `curl`

```bash
curl -s -X POST \
  -H "Authorization: Bearer $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -d '{
    "contents":[{"parts":[{"text":"JSON만 반환하도록, 다음 스키마에 맞춰..."}]}],
    "generationConfig":{
      "responseMimeType":"application/json"
    }
  }'
```

* 표준 엔드포인트/요청 구조는 API 레퍼런스와 일치. ([Google AI for Developers][1])

### (B) 스트리밍 REST

* `:streamGenerateContent` 변형 엔드포인트/클라이언트에서 청크 수신. (예제·도구 참고) ([gemini-api.apidog.io][9])

### (C) **Live API (WebSocket)**

* **지연이 낮은 음성/텍스트 상호작용**, 세션/도구 호출/에페메럴 토큰 지원. WebSocket 프로토콜 스펙과 샘플 제공. ([Google AI for Developers][4])
* **레퍼런스/튜토리얼**: Vertex AI 및 GitHub 웹소켓 데모 앱. ([Google Cloud][10])

---

# 3) Webhook 연동 — **자체 HTTP 엔드포인트(수신자) + 내부에서 SDK/REST 호출**

> **중요**: Gemini API는 **일반적인 “서드파티 호출을 자동으로 푸시해주는 1st-party Webhook 트리거**를 제공하지 않습니다. Webhook은 **우리 서비스 쪽에서 만드는 HTTP 수신 엔드포인트**를 뜻하며, 거기로 외부 시스템(결제 완료, 폼 제출, Zapier/Make 등)이 이벤트를 **POST**하면, **서버에서 SDK/REST로 Gemini를 호출**하는 패턴이 권장됩니다. (공식 문서에는 Webhook 트리거가 아닌 **Live API(WebSocket)**, **표준/스트리밍 REST**를 제공합니다.) ([Google AI for Developers][8])

## 사용할 기능

* **외부 이벤트 기반 처리**: 예) 결제 성공 → Webhook 수신 → 사주 분석 요청을 Gemini에 전달 → 구조화 JSON 저장/응답.
* **신뢰성/보안**: 서명 검증, 재시도, idempotency 키 등 일반 Webhook 모범 사례 적용.

## 설치/세팅 방법

* 별도 라이브러리 필수 아님. Next.js App Router 기준 **API Route**(예: `app/api/webhook/route.ts`)로 수신.
* 필요 시 Zapier/Make 같은 **자동화 툴**을 중간에 둘 수 있으나(트리거→Webhook→우리 서버), 이는 선택 사항입니다. (참고: 여러 상용 자동화 서비스에서 Gemini/웹훅 커넥터 제공) ([Zapier][11])

## 인증정보 관리 방법

* **수신 인증**: Webhook 시크릿(헤더 서명) 검증 및 원격 IP/리트라이 제어.
* **Gemini 호출 인증**: 서버에서 `GEMINI_API_KEY` 사용(환경변수, .env / 시크릿 매니저). 키는 **절대 브라우저로 전달 금지**. ([Google AI for Developers][6])

## 호출 방법 (예시: Next.js Webhook → SDK)

```ts
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: NextRequest) {
  // 1) (권장) 서명 검증 로직 삽입 후, 바디 파싱
  const event = await req.json();

  // 2) 이벤트 유형별 분기
  if (event.type !== "analysis.requested") {
    return NextResponse.json({ ok: true });
  }

  const ai = new GoogleGenAI({}); // GEMINI_API_KEY 자동 인식
  const schema = {
    type: Type.OBJECT,
    properties: {
      general: { type: Type.STRING },
      wealth:  { type: Type.STRING },
      love:    { type: Type.STRING },
      health:  { type: Type.STRING },
      job:     { type: Type.STRING },
    },
    required: ["general","wealth","love","health","job"],
  };

  const prompt = `아래 사주 데이터를 바탕으로 각 항목을 200자 이상 한국어 JSON으로만 출력:
${JSON.stringify(event.payload?.sajuData)}`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const json = JSON.parse(res.text);
  // 3) 결과를 내부 DB 저장 or 콜백 URL로 POST
  return NextResponse.json({ ok: true, result: json });
}
```

* SDK 호출 방식과 구조화 출력은 **공식 가이드**와 일치. ([Google AI for Developers][2])

---

## 부록 A. 모델 선택 가이드(요약)

* **기본 권장**: `gemini-2.5-flash` (안정/빠른 추론, 긴 컨텍스트). ([Google AI for Developers][12])
* **경량/고빈도**: `gemini-2.5-flash-lite` (GA, 비용 효율). ([Android Central][13])
* **고난도 추론**: `gemini-2.5-pro` (안정 Pro 라인업 발표). ([The Economic Times][14])
* **실시간 음성/영상 대화**: **Live API** (WebSocket). ([Google AI for Developers][4])
* **모델 네이밍/버전 정책**: Stable/Preview/Latest/Experimental — **프로덕션은 Stable 고정 권장**. ([Google AI for Developers][3])

## 부록 B. 구조화(JSON) 출력 모범 사례

* `responseMimeType: "application/json"` **+** `responseSchema` 동시 지정으로 **엄격 보장**.
* `propertyOrdering`로 키 순서 고정(지원되는 필드). ([Google AI for Developers][2])

## 부록 C. 실시간(Live API) 채택 시 체크리스트

* **WebSocket 세션 관리, VAD(음성 활동 감지), 도구 호출, 에페메럴 토큰** 지원. ([Google AI for Developers][4])
* 클라이언트 직접 인증 시 **에페메럴 토큰**으로 키 노출 방지. (Live API 가이드) ([Google AI for Developers][4])
* 공식 레퍼런스/데모로 시작: **WebSockets API reference**, **Vertex 튜토리얼/GitHub 데모**. ([Google AI for Developers][15])

---

## 참고 문서(주요 출처)

* **API 키 발급/관리** — *Using Gemini API keys* (AI Studio) ([Google AI for Developers][6])
* **모델/버전 정책** — *Gemini Models* (AI for Developers) ([Google AI for Developers][3])
* **표준 생성 엔드포인트** — *Generating content (API Reference)* ([Google AI for Developers][1])
* **API 전체 개요/레퍼런스** — *Gemini API docs & reference* ([Google AI for Developers][12])
* **JS/TS SDK** — *Google Gen AI SDK (`@google/genai`)* (GitHub & Cloud 문서) ([GitHub][5])
* **구조화 출력(스키마)** — *Structured output (Gemini API)*, *(Vertex AI 가이드)* ([Google AI for Developers][2])
* **실시간(Live API)** — *Get started with Live API*, *WebSockets API reference*, *Vertex Live API ref*, *데모* ([Google AI for Developers][4])
* **모델 라인업(맥락 정보)** — 2.5 Flash/Pro 안정화 및 Flash-Lite GA 보도/기사(참고용) ([The Economic Times][14])

---

### 결론

* **SDK 연동**: `@google/genai` + `GEMINI_API_KEY` 자동 인식, **`gemini-2.5-flash` 안정 모델**과 **구조화 출력** 권장.
* **REST API**: 표준/스트리밍/실시간(웹소켓) 모두 제공 — 서버에서 Bearer 토큰 사용.
* **Webhook**: **1st-party 트리거는 없음** → **자체 Webhook 엔드포인트**를 두고 내부에서 SDK/REST 호출(또는 Zapier/Make 등과 연동).
  위 구성은 **보안(키 비노출)·안정성(Stable 모델 고정)·일관성(JSON 스키마)**을 모두 충족하는 **최신 권장 아키텍처**입니다.

[1]: https://ai.google.dev/api/generate-content?utm_source=chatgpt.com "Generating content | Gemini API | Google AI for Developers"
[2]: https://ai.google.dev/gemini-api/docs/structured-output?utm_source=chatgpt.com "Structured output - Gemini API | Google AI for Developers"
[3]: https://ai.google.dev/gemini-api/docs/models?utm_source=chatgpt.com "Gemini Models | Gemini API | Google AI for Developers"
[4]: https://ai.google.dev/gemini-api/docs/live?utm_source=chatgpt.com "Get started with Live API | Gemini API | Google AI for Developers"
[5]: https://github.com/googleapis/js-genai?utm_source=chatgpt.com "Google Gen AI SDK for TypeScript and JavaScript - GitHub"
[6]: https://ai.google.dev/gemini-api/docs/api-key?utm_source=chatgpt.com "Using Gemini API keys - Google AI for Developers"
[7]: https://ai.google.dev/gemini-api/docs/quickstart?hl=ko&utm_source=chatgpt.com "Gemini API 빠른 시작 - Google AI for Developers"
[8]: https://ai.google.dev/api?utm_source=chatgpt.com "Gemini API reference - Google AI for Developers"
[9]: https://gemini-api.apidog.io/api-16240702?utm_source=chatgpt.com "Streaming output - Google Gemini API"
[10]: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live?utm_source=chatgpt.com "Live API reference | Generative AI on Vertex AI | Google Cloud"
[11]: https://zapier.com/apps/webhook/integrations/google-ai-studio?utm_source=chatgpt.com "Webhooks by Zapier Google AI Studio (Gemini) Integration - Quick Connect - Zapier"
[12]: https://ai.google.dev/gemini-api/docs?utm_source=chatgpt.com "Gemini API | Google AI for Developers"
[13]: https://www.androidcentral.com/apps-software/ai/gemini-2-5-flash-lite-generally-available-fastest-cost-efficient-series-version?utm_source=chatgpt.com "Gemini 2.5 Flash-Lite now 'generally available' following Google's month-long preview"
[14]: https://economictimes.indiatimes.com/tech/artificial-intelligence/google-introduces-stable-gemini-2-5-flash-and-pro-previews-gemini-2-5-flash-lite/articleshow/121915736.cms?utm_source=chatgpt.com "Google introduces stable Gemini 2.5 Flash and Pro, previews Gemini 2.5 Flash-Lite"
[15]: https://ai.google.dev/api/live?utm_source=chatgpt.com "Live API - WebSockets API reference | Gemini API | Google AI for Developers"
