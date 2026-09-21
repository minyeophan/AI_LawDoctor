<div align="center">

# ⚖️ AI법률닥터
<img width="500" height="500" alt="KakaoTalk_20260420_214930315_01" src="https://github.com/user-attachments/assets/e003577b-c1c3-48e6-b8b8-5c3cbbd5af54" />

**AI & OCR 기반 계약서 독소조항 분석 및 법률 자문 서비스**

</div>

<br>

## 🔍 프로젝트 소개
**AI법률닥터**는 일상 및 비즈니스에서 마주하는 복잡한 계약서를 AI와 OCR 기술을 활용해 쉽고 빠르게 분석해 주는 서비스입니다. 
사용자가 불리한 계약 조건이나 독소조항을 놓치지 않고 사전에 파악할 수 있도록 돕습니다.

<br>

## 🛠️ 기술 스택 (Tech Stack)
**Frontend**

<img width="133" height="94" alt="react-logo" src="https://github.com/user-attachments/assets/88ad13d5-d409-45de-9b68-3057ce08d543" />

**Backend**

<img width="152" height="94" alt="nodejs" src="https://github.com/user-attachments/assets/999517c6-2de9-4d0b-8aff-1200e43f31d4" />

**AI & API**

<img width="121" height="94" alt="01_프로그래밍언어" src="https://github.com/user-attachments/assets/81df18e7-3a9d-486a-9cce-10282da932e6" /> <img width="124" height="94" alt="images" src="https://github.com/user-attachments/assets/4ddb5f6d-1449-4aa9-bd0c-59b4601d1625" style="background-color: white;" /> <img width="141" height="94" alt="134520149 1" src="https://github.com/user-attachments/assets/d8e4ccb9-4564-488d-a6d6-b98952708aed" />

**DB**

<img width="117" height="94" alt="images (1)" src="https://github.com/user-attachments/assets/b43a21bd-def2-4d11-88e5-3cb75474d31d" /> <img width="145" height="94" alt="6589ab8c-bfc9-47f5-bead-4a509ebae6dc" src="https://github.com/user-attachments/assets/f4255a9c-355c-4563-98fe-b73eae5f330b" />

<br>

## ✨ 주요 기능 (Key Features)

<img width="2461" height="1244" alt="image" src="https://github.com/user-attachments/assets/4f7fa56d-f794-4a01-ad87-3ada6b00e24a" />

📄 **계약서 이미지/파일 업로드 (OCR):** 계약서 문서 및 이미지를 간편하게 업로드하여 텍스트 자동 추출

<img width="2461" height="1244" alt="image (1)" src="https://github.com/user-attachments/assets/cd97879c-8c94-4829-91ae-3525472fe130" />

🤖 **AI 독소조항 분석:** Gemini API를 활용해 사용자에게 불리하거나 위험한 조항 정밀 진단

<img width="2461" height="1244" alt="image (2)" src="https://github.com/user-attachments/assets/16cc8256-9cb8-49b6-bed8-5c90342ebce6" />

📊 **분석 리포트 제공:** 발견된 문제점과 수정 가이드를 알기 쉽게 요약하여 리포트 시각화

<br>

## 아키텍처

**CI/CD 파이프라인**

<img width="805" height="532" alt="스크린샷 2026-09-21 181156" src="https://github.com/user-attachments/assets/90ed95c8-654c-4ac0-a00c-42aaf025fda2" />

**ERD**

<img width="1279" height="672" alt="스크린샷 2025-12-12 231109" src="https://github.com/user-attachments/assets/836e2096-2ca5-4c30-a027-c3cca36f4db7" />

<br>

## 👥 팀원 소개 (Team Members)

| 역할 | 이름 |
| :---: | :--- |
| **팀장 및 AI** | 한민엽 |
| **AI** | 하승훈 |
| **백엔드** | 권도연 |
| **백엔드** | 이서윤 |
| **프론트엔드** | 전지우 |

<br>

## 📜 그라운드 룰 및 컨벤션 (Ground Rules)

### 💬 소통 규칙
- 모르는 점이나 막히는 부분이 있다면 **혼자 끙끙 앓지 말고 즉시 공유**하기
- 건설적인 피드백은 언제나 환영하며, 감정보다는 **근거 중심**으로 소통하기
- 데일리 스크럼을 통해 오늘의 진행 상황과 이슈 공유하기

### 💻 깃 및 커밋 컨벤션
- 커밋 메시지는 직관적이고 명확하게 작성하기
  - `Feat`: 새로운 기능 추가
  - `Fix`: 버그 수정
  - `Refactor`: 코드 리팩토링
  - `Docs`: 문서 수정
- 브랜치 전략: `main` ➔ `feature/기능이름` 브랜치 파서 작업 후 PR 날리기

<br>

## 📂 프로젝트 구조 (Project Structure)
```text
AI_LawDoctor/
├── AI/
│   ├── ai_api.py              # FastAPI 서버 진입점 (포트 8000)
│   ├── analysis/
│   │   └── ai_example.py      # Gemini API 계약서 분석 모듈
│   ├── ocr/
│   │   └── ocr_example.py     # PDF/이미지 텍스트 추출 모듈
│   ├── requirements.txt       # Python 패키지 목록
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── controllers/       # 요청 처리 로직
│   │   ├── routes/            # 라우터 모음
│   │   ├── schemas/           # Mongoose 스키마
│   │   ├── service/           # AI 서버 연동 서비스
│   │   └── app.js             # Express 서버 진입점 (포트 3001)
│   ├── uploads/               # 업로드된 파일 저장
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── components/        # 재사용 UI 컴포넌트
│   │   ├── api/               # API 요청 모듈
│   │   ├── context/           # React Context
│   │   ├── mock/              # 목업 데이터
│   │   └── types/             # TypeScript 타입 정의
│   ├── .env                   # 환경 변수 (VITE_API_BASE_URL, VITE_API_URL)
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── api_spec.md            # API 명세
│   ├── data_spec.md           # 데이터 스펙
│   └── dev_guide.md           # 개발자 가이드
│
├── samples/                   # 테스트용 샘플 계약서
├── docker-compose.yml
└── README.md
```
