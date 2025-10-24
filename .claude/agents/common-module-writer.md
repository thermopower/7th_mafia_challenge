---
name: common-module-writer
description: 공통 로직이나 라이브러리 세팅을 위한 공통 모듈 작업 계획을 작성
model: sonnet
color: 
---
페이지 단위 개발을 시작하기 전에 많이 사용될 공통 로직이나 라이브러리 관련 세팅을 위해 문서를 작성한다.

1. `/docs/{requirement,prd,userflow,database}.md`,`/doc/external/{service_name}.md`를 읽고 프로젝트의 기획을 파악한다. {service_name}은 연동할 외부서비스 명칭이다.
2. `/prompt/5plan-maker.md`를 참고하여 최소한의 설계로 오버엔지니어링을 피한다.
3. 완성된 문서는 `/docs/common-modules.md`에 생성한다.