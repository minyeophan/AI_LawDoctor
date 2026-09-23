## ▪️ 전문가 검토 데이터 활용

AI 법률닥터는 관련 법령과 전문가 검토 사례를 검색하여
계약서 분석의 근거를 보완하도록 구성했습니다.

전문가 검토 데이터는 다음과 같은 형태로 재구성하여
RAG 검색 데이터로 활용했습니다.

**💜1번/2번 둘중에 더 괜찮은걸로 그래프 만들어주세욤**

<br>

**1번**
계약 조항
   +
기존 AI 의견
   +
전문가 검토 의견
   ↓
Correction / Addition
   ↓
전문가 검토 사례 DB
   ↓
RAG 검색에 활용

**2번**
[사용자 계약서 업로드]

↓

[텍스트 파싱 및 개인정보 마스킹]

↓

[Qdrant 벡터 DB: 법령/전문가 검토 사례 유사도 검색] → [유사한 전문가 교정 패턴 및 법적 근거 추출]

↓

(Context 주입)

↓

[Gemini 2.5 Flash 분석 엔진]

↓

[위험도 평가 및 대응 가이드 생성]


* **Correction:** 기존 AI 분석 내용을 수정하거나 보완한 사례
* **Addition:** 기존 AI 분석에서 누락된 내용을 전문가가 추가한 사례

이렇게 구축된 사례는 관련 법령 데이터와 함께 검색되어
Gemini 분석 Context에 반영됩니다.

<br>

## ▪️RAG 적용 결과

<p align="center">
  <img src="..." width="800">
</p>

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

**Frontend**

<img width="165.447216890595" height="94" alt="react-logo" src=docs/image/react.png> <img width="209.30666666666667" height="94" alt="axios-logo" src=docs/image/axios.png> <img width="124.7680412371134" height="94" alt="figma-logo" src=docs/image/figma.png>


**backend**

<img width="223.8095238095238" height="94" alt="nodejs+express-logo" src=docs/image/nodejs.png> <img width="188" height="94" alt="multer-log" src=docs/image/multer.png> <img width="94" height="94" alt="dotenv-logo" src=docs/image/dotenv.png>


**AI 분석**

<img width="167.38795180722892" height="94" alt="gemini2.5flash" src=docs/image/gemini2.5flash.jpg> <img width="94" height="94" alt="genai-logo" src=docs/image/genai.png> <img width="379.671875" height="94" alt="jsonrepair-logo" src=docs/image/jsonrepair.png> <img width="94" height="94" alt="pytesseract-logo" src=docs/image/pytesseract.png> <img width="106.29230769230769" height="94" alt="pdfplumber-logo" src="docs/image/pdfplumber.png">


**RAG**

<img width="156.03458213256485" height="94" alt="mongodb-logo" src=docs/image/mongodb.jpeg> <img width="188" height="94" alt="qdrant-logo" src=docs/image/qdrant.jpeg> <img width="94" height="94" alt="fastembed-logo" src=docs/image/fastembed.png>


**DB**

<img width="156.03458213256485" height="94" alt="mongodb-logo" src=docs/image/mongodb.jpeg> <img width="167.23582089552238" height="94" alt="mongoose-logo" src=docs/image/mongoose.png>


**기타 도구**

<img width="167.34353268428373" height="94" alt="gitandgithub-logo" src=docs/image/gitandgithub.png> <img width="124.7680412371134" height="94" width="94" alt="swagger-logo" src=docs/image/swagger.jpg> <img width="94" height="94" alt="postman-logo" src=docs/image/postman.png>

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
