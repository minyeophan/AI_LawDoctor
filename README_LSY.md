## ▪️ 전문가 검토 데이터 활용

AI 법률닥터는 관련 법령과 전문가 검토 사례를 검색하여
계약서 분석의 근거를 보완하도록 구성했습니다.

전문가 검토 데이터는 다음과 같은 형태로 재구성하여
RAG 검색 데이터로 활용했습니다.

![전문가검토데이터](docs/image/전문가검토데이터.png)



* **Correction:** 기존 AI 분석 내용을 수정하거나 보완한 사례
* **Addition:** 기존 AI 분석에서 누락된 내용을 전문가가 추가한 사례

이렇게 구축된 사례는 관련 법령 데이터와 함께 검색되어
Gemini 분석 Context에 반영됩니다.

<br>

## ▪️RAG 적용 결과

| 유형                         | RAG 적용 전 | RAG 적용 후 |
| :--------------------------- | :---------: | :---------: |
| 원룸(반려동물)               |   33.3%     |   **66.7%** |
| 단독주택(선순위 임대차)      |    0.0%     |    0.0%     |
| 상가건물(업종 제한)          |    0.0%     |   **66.7%** |
| 전체                         |   14.3%     |   **57.1%** |


전문가 검토 의견을 기준으로 RAG 적용 전후의 분석 결과를 비교했습니다.

**전문가 의견 평균 반영률: 46.8% → 78.6%**
평가 항목은 위험 조항 탐지, 위험 수준 판단, 법적 근거,
대응 방법, 개선 조항의 반영 정도를 기준으로 구성했습니다.

> 해당 수치는 법률 판단의 절대 정확도가 아니라,
> 전문가 검토 의견이 AI 분석 결과에 어느 정도 반영되었는지를 비교한
> 프로젝트 내부 평가 결과입니다.

<br>


## ▪️System Architecture
![CI/CD 파이프라인](docs/image/655642279-90ed95c8-654c-4ac0-a00c-42aaf025fda2.png)

<br>


## ▪️Tech Stack


### Frontend

React · JavaScript · Axios



### Backend

Node.js · Express · MongoDB · Mongoose



### AI

Python · FastAPI · Gemini 2.5 Flash · Qdrant



### Infra

AWS · NGINX



### Collaboration

Git · GitHub



### Key Technologies



- **Hybrid RAG** — Dense Search + BM25 + RRF

- **Document Processing** — hwp5html + BeautifulSoup + OCR

- **Authentication** — JWT + Google OAuth + Kakao OAuth

- **External Integration** — Google Calendar API 


<br>


## ▪️Team

| 한민엽 | 하승훈 | 권도연 | 이서윤 | 전지우 |
| :---: | :---: | :---: | :---: | :---: |
| AI | AI | Backend | Backend | Frontend |

<br>


## ▪️Ground Rules

- 정기 회의를 통해 파트별 진행 상황과 이슈를 공유합니다.
- API 및 DB 구조 변경 사항은 관련 담당자에게 공유합니다.
- GitHub를 기반으로 소스코드와 변경 사항을 관리합니다.
- 기능 구현 후 파트별 테스트와 통합 테스트를 진행합니다.
- 주요 오류는 관련 파트 담당자가 함께 원인을 확인합니다.
- 발표 및 배포 전 실제 서비스 환경에서 주요 기능을 재검수합니다.
