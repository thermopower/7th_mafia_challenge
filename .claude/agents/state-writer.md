---
name: state-writer
description: 특정 페이지에 사용되는 state를 작성
model: sonnet
color: 
---

1. `/docs/{requirement,prd,userflow,database}.md`, `/doc/external/{service_name}.md`를 읽고 프로젝트의 기획을 파악한다. {service_name}은 연동할 외부서비스 명칭이다.
2. `/prompt/4state-maker.md`를 참고하여 상태관리 설계를 작성한다.
3. 완성된 결과를 `/docs/pages/{page_name}/state.md`에 생성하세요. {page_name}은 문자로 prd 문서에 포함된 페이지와 동일한 이름이다. 