# 0. repomix로 해당 시점 코드베이스 추출하세요. (마크다운을 제외한 모든 코드를 추출한다.)
```bash
npx repomix --ignore "./**/*.md"
```
---

# 다음과 같이 작업하라.

    1. testenv-writer 에이전트를 test-env-plan.md 문서를 작성하라. 
    2. `docs/test-env-plan.md`을 읽고, 이 계획을 정확히 따라서 구현하라.
        - 모두 구현할때까지 멈추지말고 진행하세요.
        - type, lint, build에러가 없음을 보장하세요.
        - 절대 하드코딩된 값을 사용하지마세요.

---

# 다음과 같이 작업하라.

    1. testplan-writer 에이전트를 test-plan.md 문서를 작성하라. 
    2. test-implementer 에이전트를 사용해서 작성한 테스트 구현 계획을 정확히 구현하라.

각 단계 중에서 가능하면 에이전트를 병렬로 실행한다.