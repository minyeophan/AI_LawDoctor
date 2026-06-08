"""
기존 Qdrant 컬렉션에 payload index 추가 (1회성 마이그레이션)

실행 방법:
  docker-compose -f docker-compose.dev.yml run ai python rag/add_payload_indexes.py
"""

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from rag.db_utils import get_qdrant, LAW_COLLECTION, ensure_payload_indexes
from qdrant_client import models

def main():
    qdrant = get_qdrant()

    info = qdrant.get_collection(LAW_COLLECTION)
    print(f"컬렉션: {LAW_COLLECTION}")
    print(f"총 포인트 수: {info.points_count}")

    existing = info.payload_schema or {}
    print(f"현재 payload index: {list(existing.keys()) if existing else '없음'}")

    # contract_type이 KEYWORD로 잘못 생성된 경우 삭제 후 재생성
    print("\ncontract_type 인덱스 재생성 중...")
    try:
        qdrant.delete_payload_index(collection_name=LAW_COLLECTION, field_name="contract_type")
        print("  기존 contract_type 인덱스 삭제 완료")
    except Exception as e:
        print(f"  삭제 스킵 ({e})")

    print("payload index 추가 중...")
    ensure_payload_indexes(qdrant)

    info_after = qdrant.get_collection(LAW_COLLECTION)
    existing_after = info_after.payload_schema or {}
    print(f"적용 후 payload index: {list(existing_after.keys())}")
    print("\n완료.")

if __name__ == "__main__":
    main()
