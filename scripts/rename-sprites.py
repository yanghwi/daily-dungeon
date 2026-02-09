"""
스프라이트 번호 → 적 이름 매핑 스크립트.

아래 MAPPING 딕셔너리에 번호를 채우고 실행하세요.
  python scripts/rename-sprites.py
"""

import shutil
from pathlib import Path

SPRITES_DIR = Path(__file__).resolve().parent.parent / "client" / "public" / "sprites"

# TODO(human): 미리보기 페이지에서 골라서 번호를 채워주세요
# 예: "raccoon": 42  →  sprite_042.png 를 raccoon.png 로 복사
MAPPING: dict[str, int] = {
    "raccoon": 0,
    "stray-dog": 0,
    "vending-machine": 0,
    "traffic-light": 0,
    "shadow-cats": 0,
    "sewer-rats": 0,
    "cleaning-robot": 0,
    "shopping-cart": 0,
    "market-boss": 0,       # Wave 5 보스
    "delivery-bike": 0,
    "food-cart": 0,
    "mannequins": 0,
    "umbrella-ghost": 0,
    "neon-ghost": 0,
    "broken-tv": 0,
    "antenna-monster": 0,
    "electric-pole": 0,
    "midnight-clock": 0,    # Wave 10 최종 보스
}


def main():
    unmapped = [name for name, num in MAPPING.items() if num == 0]
    if unmapped:
        print(f"아직 매핑되지 않은 적: {', '.join(unmapped)}")
        print("MAPPING 딕셔너리에 스프라이트 번호를 채워주세요.")
        return

    for name, num in MAPPING.items():
        src = SPRITES_DIR / f"sprite_{num:03d}.png"
        dst = SPRITES_DIR / f"{name}.png"
        if not src.exists():
            print(f"  ✗ sprite_{num:03d}.png 없음 → {name} 건너뜀")
            continue
        shutil.copy2(src, dst)
        print(f"  ✓ sprite_{num:03d}.png → {name}.png")

    print(f"\n완료! {len(MAPPING)}개 적 스프라이트가 준비됐습니다.")


if __name__ == "__main__":
    main()
