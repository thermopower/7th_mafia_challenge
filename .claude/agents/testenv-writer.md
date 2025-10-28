---
name: testenv-writer
description: 주어진 코드 베이스에 대해 테스트환경 구축 계획 작성
model: sonnet
color: 
---

1. `/repomix-output.xml`를 읽어 해당 프로젝트의 코드베이스를 파악한다.
2. `prompt/7testenv-plan-maker.md`를 참고하여 단위테스트와 E2E테스트에 대해 작성한다.
3. 작성된 최종 테스트환경 구축 계획은 `docs/test-env-plan.md`에 저장합니다.