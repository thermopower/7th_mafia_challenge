1. 테스트 구축걔획 작성

주어진 코드베이스에 대해서, `docs/rules/tdd.md` 문서에 명시된 테스트 주도 개발(TDD) 프로세스를 철저히 준수하여 테스트를 구축할 것입니다. `docs/test-env-plan.md`을 읽어서 구축된 테스트 환경에 대해 파악하고 TDD 원칙에 입각한 기술 스택, 라이브러리, 그리고 상세한 구현 계획을 응답하세요.

이번 작업의 목표는 테스트 구축입니다. 테스트 커버리지 80% 이상 달성을 목표로 합니다.


반드시 지켜야할 규칙:
- `docs/test-env-plan.md`을 읽어서 구축된 테스트 환경에 대해 파악하고, `docs/rules/tdd.md`를 반드시 지켜야합니다.
- 먼저 상급자에게 보고하기위한 간략한 개요를 응답하세요. 이 내용만으로도 대략적 평가가 가능해야합니다.
- 도출된 결론의 장점, 예상되는 한계점을 함께 응답하세요.
- 이후 자세한 내용을 응답하세요. 모든 결정에는 `docs/rules/tdd.md`에 근거한 명확한 이유를 포함해야 합니다.
- 계획 수립 시, `docs/rules/tdd.md`의 "Common Anti-patterns to Avoid"에 명시된 안티-패턴을 반드시 회피해야 합니다.
- 해당 내용을 다각도로 피드백하기위한 AI 프롬프트를 작성하세요. 평가할 AI의 역할 및 임무를 자세하게 작성해야합니다.

사용할 기술스택, 라이브러리, 구현계획은 `docs/tests/{test_name}/test-implement-plan.md`로 저장합니다.

피드백 AI 프롬프트는 `docs/tests/{test_name}/test-feedback.md`으로 저장합니다. {test_name}은 해당 테스트 이름입니다.


---
<답변 페르소나>
`docs/persona.md`

---
<코드베이스>
`./repomix-output.xml`


2.  자체 피드백 및 반영

피드백 프롬프트를 사용하여 테스트 구축 계획을 개선하세요. 최종 보고서는 AI 코딩 에이전트에게 지침으로서 입력될 것입니다. 간결하게, 프롬프트 엔지니어링 기법을 적용해서 작성해주세요. 개선된 최종 보고서는 해당 테스트에 `docs/tests/{test_name}/test-plan.md`에 저장합니다.

반드시 지켜야할 규칙:
- `docs/test-env-plan.md`을 읽어서 구축된 테스트 환경에 대해 파악하고, `docs/rules/tdd.md`를 반드시 지켜야합니다.

**<TDD 관점의 평가 기준>**
* TDD 프로세스 준수: "Red-Green-Refactor" 사이클이 계획에 명확하고 구체적으로 반영되었는가?
* 테스트 품질(FIRST): 계획된 테스트가 Fast, Independent, Repeatable, Self-validating, Timely 원칙을 만족시키는가? 구체적인 방안이 있는가?
* 테스트 피라미드: 단위, 통합, 인수 테스트의 비율과 역할이 합리적으로 분배되었는가?
* 안티-패턴 회피: 구현 세부 사항 테스트 등 `docs/rules/tdd.md`에서 경고하는 안티-패턴을 효과적으로 방지하고 있는가?
* 실행 가능성: 계획이 실용적이며, 개발자가 명확하게 따라할 수 있는가?


---
<피드백 프롬프트>
`docs/tests/{test_name}/test-feedback.md`

---
<테스트 구축 제안서>
`docs/tests/{test_name}/test-implement-plan.md`

---
<답변 페르소나>
`docs/persona.md`

---
<코드베이스>
`/repomix-output.xml`