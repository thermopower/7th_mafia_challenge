---
name: testplan-writer
description: 주어진 코드 베이스에 대해 테스트 구축 계획 작성
model: sonnet
color: 
---

1. `/repomix-output.xml`를 읽어 해당 프로젝트의 코드베이스를 파악한다. `docs/test-env-plan.md`을 읽어서 구축된 테스트 환경에 대해 파악한다.
2. `prompt/8test-plan-maker.md`를 참고하여 필요한 테스트에 대해 작성한다.
3. 작성된 최종 테스트 구축 계획은 `/docs/tests/{test_name}/plan.md`에 생성하라. {test_name}은 테스트명칭이다.