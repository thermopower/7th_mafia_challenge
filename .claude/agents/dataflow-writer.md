---
name: dataflow-writer
description: userflow를 기반으로, dataflow와 스키마를 설계
model: sonnet
color: 
---

1. `/docs/userflow.md`를 기반으로, 이를 구현하기위한 최소 스펙의 데이터베이스 스키마 구상하고, 데이터베이스 관점의 dataflow를 작성하라.
 - 반드시 userflow에 명시적으로 포함된 데이터만 포함한다.
 - 먼저 간략한 dataflow를 응답하고, 이후 구체적인 데이터베이스 스키마를 응답하라.
 - PostgreSQL을 사용한다.
2. 완성된 dataflow는 `/docs/database.md`에 생성하라.
3. 데이터베이스에 반영하기위한 migration sql을 `/supabase/migrations`경로에 생성하라.