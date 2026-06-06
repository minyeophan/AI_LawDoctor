"""
전문가 일치율 평가 스크립트

PDF 계약서를 RAG 분석 후, 전문가 교정 txt와 비교하여 일치율을 측정.
Gemini LLM-as-judge 방식으로 의미적 일치 여부를 판정.

실행 방법:
  docker-compose run ai python eval_expert_match.py
"""

import os
import sys
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

sys.path.append(os.path.dirname(__file__))
load_dotenv()

from ocr.pdf_extractor import extract_text_from_pdf
from analysis.contract_analyzer import analyze_contract

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

CORRECTIONS_BASE = Path(__file__).parent / "분析결과"
EVAL_DIR = Path(__file__).parent / "eval_data"
EVAL_DIR.mkdir(exist_ok=True)

# PDF는 eval_data/(ASCII명), txt는 분析결과/(한글명)
PAIRS = [
    {
        "id": "원룸_반려동물",
        "pdf": EVAL_DIR / "oneroom.pdf",
        "txt": EVAL_DIR / "oneroom.txt",
    },
    {
        "id": "단독주택_선순위",
        "pdf": EVAL_DIR / "standalone.pdf",
        "txt": EVAL_DIR / "standalone.txt",
    },
    {
        "id": "상가건물_업종제한",
        "pdf": EVAL_DIR / "commercial.pdf",
        "txt": EVAL_DIR / "commercial.txt",
    },
]

_AI_MARKER = re.compile(r'(?im)^ai\s*의견\s*[:：]')
_EXPERT_MARKER = re.compile(
    r'(?im)^(ai와\s*다른\s*전문가\s*의견|ai\s*의견에\s*추가한.*?전문가\s*의견|전문가\s*수정\s*의견|전문가\s*추가\s*의견)\s*[:：]'
)


def parse_expert_corrections(txt_path: Path) -> list[dict]:
    """txt 파일에서 전문가 교정 블록 추출 (upsert_expert_corrections.py 로직 재사용)"""
    text = txt_path.read_text(encoding="utf-8")
    ai_matches = list(_AI_MARKER.finditer(text))
    expert_matches = list(_EXPERT_MARKER.finditer(text))

    blocks = []
    expert_ptr = 0
    prev_end = 0

    for i, ai_match in enumerate(ai_matches):
        ai_start = ai_match.start()
        ai_content_start = ai_match.end()
        next_ai_start = ai_matches[i + 1].start() if i + 1 < len(ai_matches) else len(text)

        raw_before = text[prev_end:ai_start].strip()
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', raw_before) if p.strip()]
        clause_text = paragraphs[-1] if paragraphs else ""
        clause_text = re.sub(r'(?is)^분석[한할]\s*조항\s*[:：]\s*', '', clause_text).strip()

        expert_match = None
        while expert_ptr < len(expert_matches):
            em = expert_matches[expert_ptr]
            if ai_content_start <= em.start() < next_ai_start:
                expert_match = em
                expert_ptr += 1
                break
            if em.start() >= next_ai_start:
                break
            expert_ptr += 1

        if expert_match is None:
            prev_end = ai_content_start
            continue

        ai_opinion = text[ai_content_start:expert_match.start()].strip()
        raw_expert = text[expert_match.end():next_ai_start].strip()
        if i + 1 < len(ai_matches):
            next_clause_marker = next(
                (
                    m for m in re.finditer(r'(?im)^\s*분석[한할]\s*조항\s*[:：]', raw_expert)
                    if m.start() > 0
                ),
                None,
            )
            if next_clause_marker:
                expert_opinion = raw_expert[:next_clause_marker.start()].strip()
            else:
                ep = [p.strip() for p in re.split(r'\n\s*\n', raw_expert) if p.strip()]
                expert_opinion = "\n\n".join(ep[:-1]) if len(ep) > 1 else raw_expert
        else:
            expert_opinion = raw_expert

        marker_text = expert_match.group(1)
        correction_type = "correction" if ("다른" in marker_text or "수정" in marker_text) else "addition"
        prev_end = expert_match.end()

        if clause_text and expert_opinion:
            blocks.append({
                "clause_text": clause_text,
                "ai_opinion": ai_opinion,
                "expert_opinion": expert_opinion,
                "correction_type": correction_type,
            })

    return blocks


def judge_match(clause_text: str, expert_opinion: str, ai_result: dict) -> dict:
    """
    Gemini LLM-as-judge:
    전문가 의견의 핵심이 AI 분석 결과(riskItems)에 반영되어 있는지 판정.
    반환: {"matched": bool, "reason": str}
    """
    risk_items_text = "\n".join(
        f"- [{item.get('riskLevel','')}] {item.get('clauseText','')[:100]}\n  이유: {item.get('reason','')[:200]}"
        for item in ai_result.get("riskItems", [])
    )

    prompt = f"""다음은 계약서 조항에 대한 전문가 의견과 AI 분석 결과입니다.

[계약 조항]
{clause_text[:300]}

[전문가 핵심 의견]
{expert_opinion[:400]}

[AI 분석 결과 (riskItems)]
{risk_items_text}

판단 기준:
- "matched": 전문가 의견의 핵심 포인트(법적 근거, 위험 판단, 실무 조언 등)가 AI 분석에 반영되어 있으면 true
- correction(AI 오류 교정)인 경우: AI가 잘못된 판단을 하지 않았거나 수정된 관점을 반영하면 true
- addition(보완 의견)인 경우: AI가 해당 추가 포인트를 언급하면 true
- "reason": 판단 이유를 한 줄로

JSON만 반환: {{"matched": true/false, "reason": "..."}}"""

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    try:
        return json.loads(response.text.strip())
    except Exception:
        return {"matched": False, "reason": "판정 실패"}


def evaluate_pair(pair: dict) -> dict:
    print(f"\n{'='*60}")
    print(f"[{pair['id']}] 평가 시작")

    # 1. PDF 텍스트 추출
    print("  PDF 텍스트 추출 중...")
    contract_text = extract_text_from_pdf(str(pair["pdf"]))
    print(f"  추출 완료: {len(contract_text)}자")

    # 2. RAG 분석 실행
    print("  RAG 분석 실행 중...")
    ai_result = analyze_contract(contract_text)
    risk_count = len(ai_result.get("riskItems", []))
    expert_corr_count = len(ai_result.get("expertCorrectionRefs", []))
    print(f"  분석 완료: 위험항목 {risk_count}개, 참조된 전문가교정 {expert_corr_count}개")

    # 3. 전문가 교정 파싱
    corrections = parse_expert_corrections(pair["txt"])
    print(f"  전문가 교정 블록: {len(corrections)}개")

    if not corrections:
        return {"id": pair["id"], "total": 0, "matched": 0, "match_rate": None, "details": []}

    # 4. 각 교정 블록에 대해 LLM-as-judge 판정
    details = []
    matched_count = 0

    for i, corr in enumerate(corrections, 1):
        print(f"  [{i}/{len(corrections)}] 판정 중... ({corr['correction_type']})")
        judgment = judge_match(corr["clause_text"], corr["expert_opinion"], ai_result)
        matched = judgment.get("matched", False)
        if matched:
            matched_count += 1

        details.append({
            "correction_type": corr["correction_type"],
            "clause_text": corr["clause_text"][:80],
            "expert_opinion": corr["expert_opinion"][:150],
            "matched": matched,
            "reason": judgment.get("reason", ""),
        })
        print(f"    → {'✓ 일치' if matched else '✗ 불일치'}: {judgment.get('reason', '')}")

    match_rate = round(matched_count / len(corrections) * 100, 1)

    return {
        "id": pair["id"],
        "total": len(corrections),
        "matched": matched_count,
        "match_rate": match_rate,
        "details": details,
    }


def main():
    print("=== 전문가 일치율 평가 ===\n")

    all_results = []
    total_corrections = 0
    total_matched = 0

    for pair in PAIRS:
        if not pair["pdf"].exists():
            print(f"[스킵] PDF 없음: {pair['pdf'].name}")
            continue
        if not pair["txt"].exists():
            print(f"[스킵] txt 없음: {pair['txt'].name}")
            continue

        result = evaluate_pair(pair)
        all_results.append(result)
        total_corrections += result["total"]
        total_matched += result["matched"]

    # 최종 요약
    print(f"\n{'='*60}")
    print("전문가 일치율 평가 결과")
    print(f"{'='*60}")
    print(f"{'계약서':<20} {'교정수':<8} {'일치수':<8} {'일치율'}")
    print("-" * 50)
    for r in all_results:
        rate = f"{r['match_rate']}%" if r["match_rate"] is not None else "-"
        print(f"{r['id']:<20} {r['total']:<8} {r['matched']:<8} {rate}")

    if total_corrections > 0:
        overall = round(total_matched / total_corrections * 100, 1)
        print("-" * 50)
        print(f"{'전체 합계':<20} {total_corrections:<8} {total_matched:<8} {overall}%")

    # JSON 결과 저장
    out_path = EVAL_DIR / "eval_result.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\n상세 결과 저장: {out_path}")


if __name__ == "__main__":
    main()
