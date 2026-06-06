"""
RAG 적용 전 AI 의견의 전문가 일치율 측정

txt 파일 안의 'AI 의견' 섹션(RAG 없이 생성된 분석)을 전문가 교정과 비교.
eval_expert_match.py 결과(RAG 후)와 비교하면 개선폭을 수치로 확인 가능.

실행 방법:
  docker-compose -f docker-compose.dev.yml run ai python eval_before_rag.py
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

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

EVAL_DIR = Path(__file__).parent / "eval_data"

TXT_FILES = [
    {"id": "원룸_반려동물",   "txt": EVAL_DIR / "oneroom.txt"},
    {"id": "단독주택_선순위",  "txt": EVAL_DIR / "standalone.txt"},
    {"id": "상가건물_업종제한", "txt": EVAL_DIR / "commercial.txt"},
]

_AI_MARKER = re.compile(r'(?im)^ai\s*의견\s*[:：]')
_EXPERT_MARKER = re.compile(
    r'(?im)^(ai와\s*다른\s*전문가\s*의견|ai\s*의견에\s*추가한.*?전문가\s*의견|전문가\s*수정\s*의견|전문가\s*추가\s*의견)\s*[:：]'
)


def parse_blocks(txt_path: Path) -> list[dict]:
    """txt에서 [조항, AI 의견, 전문가 교정] 블록 추출"""
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

        if clause_text and ai_opinion and expert_opinion:
            blocks.append({
                "clause_text": clause_text,
                "ai_opinion": ai_opinion,
                "expert_opinion": expert_opinion,
                "correction_type": correction_type,
            })

    return blocks


def judge_before(clause_text: str, ai_opinion: str, expert_opinion: str, correction_type: str) -> dict:
    """
    RAG 이전 AI 의견이 전문가 핵심 포인트를 반영했는지 판정.
    - correction: AI가 잘못된 판단을 했는지 (전문가가 틀렸다고 지적한 케이스)
    - addition: AI가 전문가가 추가한 포인트를 놓쳤는지
    """
    if correction_type == "correction":
        criterion = "AI 의견이 전문가가 '틀렸다'고 지적한 내용을 포함하고 있으면 불일치(false). 전문가 의견과 같은 방향이면 일치(true)."
    else:
        criterion = "AI 의견이 전문가가 '추가'한 핵심 포인트를 이미 언급하고 있으면 일치(true). 누락되어 있으면 불일치(false)."

    prompt = f"""다음은 계약서 조항에 대한 RAG 적용 전 AI 의견과 전문가 교정입니다.

[계약 조항]
{clause_text[:300]}

[RAG 전 AI 의견]
{ai_opinion[:400]}

[전문가 {("교정(오류 수정)" if correction_type == "correction" else "보완 의견")}]
{expert_opinion[:400]}

판단 기준: {criterion}

JSON만 반환: {{"matched": true/false, "reason": "한 줄 이유"}}"""

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


def evaluate_file(item: dict) -> dict:
    print(f"\n{'='*60}")
    print(f"[{item['id']}] RAG 전 평가")

    blocks = parse_blocks(item["txt"])
    print(f"  교정 블록: {len(blocks)}개")

    if not blocks:
        return {"id": item["id"], "total": 0, "matched": 0, "match_rate": None, "details": []}

    details = []
    matched_count = 0

    for i, b in enumerate(blocks, 1):
        print(f"  [{i}/{len(blocks)}] 판정 중... ({b['correction_type']})")
        judgment = judge_before(b["clause_text"], b["ai_opinion"], b["expert_opinion"], b["correction_type"])
        matched = judgment.get("matched", False)
        if matched:
            matched_count += 1

        details.append({
            "correction_type": b["correction_type"],
            "clause_text": b["clause_text"][:80],
            "matched": matched,
            "reason": judgment.get("reason", ""),
        })
        print(f"    → {'✓ 일치' if matched else '✗ 불일치'}: {judgment.get('reason', '')}")

    match_rate = round(matched_count / len(blocks) * 100, 1)
    return {"id": item["id"], "total": len(blocks), "matched": matched_count, "match_rate": match_rate, "details": details}


def main():
    print("=== RAG 적용 전 전문가 일치율 평가 ===\n")

    all_results = []
    total_corrections = 0
    total_matched = 0

    for item in TXT_FILES:
        if not item["txt"].exists():
            print(f"[스킵] txt 없음: {item['txt'].name}")
            continue
        result = evaluate_file(item)
        all_results.append(result)
        total_corrections += result["total"]
        total_matched += result["matched"]

    overall = round(total_matched / total_corrections * 100, 1) if total_corrections else 0

    print(f"\n{'='*60}")
    print("RAG 전 전문가 일치율")
    print(f"{'='*60}")
    print(f"{'계약서':<20} {'교정수':<8} {'일치수':<8} {'일치율'}")
    print("-" * 50)
    for r in all_results:
        rate = f"{r['match_rate']}%" if r["match_rate"] is not None else "-"
        print(f"{r['id']:<20} {r['total']:<8} {r['matched']:<8} {rate}")
    if total_corrections:
        print("-" * 50)
        print(f"{'전체 합계':<20} {total_corrections:<8} {total_matched:<8} {overall}%")

    print(f"\n{'='*60}")
    print("RAG 전후 비교")
    print(f"{'='*60}")
    print(f"  RAG 적용 전  : {overall}%  (txt AI 의견 기준)")
    print(f"  RAG 적용 후  : 57.1%  (법령 RAG, eval_expert_match.py 기준)")
    print(f"  개선폭       : +{round(57.1 - overall, 1)}%p")

    out_path = EVAL_DIR / "eval_before_rag.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\n상세 결과 저장: {out_path}")


if __name__ == "__main__":
    main()
