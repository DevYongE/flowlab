# FlowLab - Project Management Web App

> **FlowLab**은 프로젝트 등록, 관리, 진행상황 파악을 위한 풀스택 웹 애플리케이션입니다.  
> React, TypeScript, Node.js, Express, Supabase(PostgreSQL)를 기반으로 설계되었습니다.

---

## 📌 주요 기능

- ✅ 프로젝트 등록 (SI, Centric 등 분류별 관리)
- ✅ 공지사항 작성 및 첨부파일 업로드
- ✅ 멤버 등록, 수정, 비활성화
- ✅ 진행상황 표시 (완료/진행중/보류)
- ✅ 날짜별 등록/완료일 필터링
- ✅ 관리자 권한 기능 포함

---

## 🧰 사용 기술

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React + TypeScript + Vite + shadcn/ui + Tailwind CSS |
| 백엔드 | Node.js + Express |
| 데이터베이스 | Supabase (PostgreSQL 기반) |
| 배포 환경 | (예정) Naver Cloud Compute Server |
| 기타 | Prisma (또는 TypeORM), JWT, REST API 구조 |

---

## 🚀 실행 방법

```bash
# 백엔드 실행
cd flowlab/server/
npm install
npm run dev

# 프론트엔드 실행
cd flowlab/client
npm install
npm run dev
```

`.env` 파일 구성 예시 (`backend/.env`)
```
PORT=3000
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=yourSecret
```

---

## 🏗️ 배포

- React 빌드 → `npm run build`  
- Express 서버는 PM2 또는 Docker로 배포 예정  
- Nginx 사용 시 `/api`는 백엔드로, 나머지는 정적 파일로 라우팅

---

## 🙌 기여 & 라이선스

- 개인/팀 학습용 사이드 프로젝트
- 필요한 경우 오픈소스로 전환 가능
