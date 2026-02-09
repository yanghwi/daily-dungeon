"""
EarthBound 스프라이트 시트에서 개별 몬스터 PNG를 추출하는 스크립트.

접근법: 행/열 투영 분석 (projection profile)
  1. 배경색 제거 → 투명화
  2. 수평 투영으로 행 분리 (전경 픽셀이 없는 수평 라인 = 행 경계)
  3. 각 행 내에서 수직 투영으로 개별 스프라이트 분리

사용법:
  python scripts/extract-sprites.py <sprite_sheet.png>
"""

import sys
import os
from pathlib import Path
from PIL import Image
import numpy as np


# --- 설정 ---
BG_TOLERANCE = 25        # 배경색 허용 오차 (RGB 채널별)
MIN_SPRITE_SIZE = 12     # 최소 스프라이트 크기 (px) - 가로/세로 둘 다
GAP_THRESHOLD = 2        # 연속 투명 행/열이 이 이상이면 경계로 인식
PADDING = 1              # 추출 시 여백 (px)


def get_bg_color(img_array: np.ndarray) -> np.ndarray:
    """이미지 모서리 및 가장자리에서 배경색 샘플링"""
    h, w = img_array.shape[:2]
    samples = [
        img_array[0, 0], img_array[0, w//2], img_array[0, -1],
        img_array[h//2, 0], img_array[h//2, -1],
        img_array[-1, 0], img_array[-1, w//2], img_array[-1, -1],
    ]
    return np.median(samples, axis=0).astype(np.uint8)


def make_foreground_mask(img_array: np.ndarray, bg_color: np.ndarray, tolerance: int) -> np.ndarray:
    """배경이 아닌 픽셀 = True"""
    diff = np.abs(img_array[:, :, :3].astype(int) - bg_color[:3].astype(int))
    return diff.max(axis=2) > tolerance


def find_segments(projection: np.ndarray, gap_threshold: int, min_size: int) -> list[tuple[int, int]]:
    """
    1D 투영 배열에서 연속된 전경 구간을 찾음.
    projection[i] > 0 이면 해당 행/열에 전경 픽셀 존재.
    gap_threshold 이상 연속으로 0이면 구간 분리.
    """
    segments = []
    in_segment = False
    start = 0
    gap_count = 0

    for i, val in enumerate(projection):
        if val > 0:
            if not in_segment:
                start = i
                in_segment = True
            gap_count = 0
        else:
            if in_segment:
                gap_count += 1
                if gap_count >= gap_threshold:
                    end = i - gap_count + 1
                    if end - start >= min_size:
                        segments.append((start, end))
                    in_segment = False
                    gap_count = 0

    # 마지막 구간 처리
    if in_segment:
        end = len(projection) - gap_count
        if end - start >= min_size:
            segments.append((start, end))

    return segments


def extract_sprites(sheet_path: str, output_dir: str):
    print(f"스프라이트 시트 로딩: {sheet_path}")
    img = Image.open(sheet_path).convert("RGBA")
    img_array = np.array(img)
    h, w = img_array.shape[:2]

    # 배경색 감지
    bg_color = get_bg_color(img_array)
    print(f"감지된 배경색: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

    # 전경 마스크
    mask = make_foreground_mask(img_array, bg_color, BG_TOLERANCE)
    print(f"전경 픽셀: {mask.sum():,} / {mask.size:,}")

    # 1단계: 수평 투영 → 행 분리
    h_proj = mask.sum(axis=1)  # 각 행의 전경 픽셀 수
    rows = find_segments(h_proj, gap_threshold=GAP_THRESHOLD, min_size=MIN_SPRITE_SIZE)
    print(f"감지된 행: {len(rows)}")

    # 2단계: 각 행에서 수직 투영 → 열(개별 스프라이트) 분리
    sprites = []
    for row_start, row_end in rows:
        row_mask = mask[row_start:row_end, :]
        v_proj = row_mask.sum(axis=0)  # 각 열의 전경 픽셀 수
        cols = find_segments(v_proj, gap_threshold=GAP_THRESHOLD, min_size=MIN_SPRITE_SIZE)

        for col_start, col_end in cols:
            sprites.append((row_start, col_start, row_end, col_end))

    print(f"감지된 스프라이트: {len(sprites)}")

    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    # 개별 스프라이트 추출 및 저장
    for idx, (y1, x1, y2, x2) in enumerate(sprites, 1):
        # 패딩 적용
        py1 = max(0, y1 - PADDING)
        px1 = max(0, x1 - PADDING)
        py2 = min(h, y2 + PADDING)
        px2 = min(w, x2 + PADDING)

        # 크롭
        crop = img_array[py1:py2, px1:px2].copy()

        # 배경 → 투명
        crop_diff = np.abs(crop[:, :, :3].astype(int) - bg_color[:3].astype(int))
        bg_pixels = crop_diff.max(axis=2) <= BG_TOLERANCE
        crop[bg_pixels, 3] = 0

        sprite_img = Image.fromarray(crop, "RGBA")
        filename = f"sprite_{idx:03d}.png"
        sprite_img.save(os.path.join(output_dir, filename))

    print(f"\n{'='*50}")
    print(f"  {len(sprites)}개 스프라이트 추출 완료 → {output_dir}")
    print(f"  파일: sprite_001.png ~ sprite_{len(sprites):03d}.png")
    print(f"{'='*50}")
    print(f"\n다음 단계: 스프라이트를 확인하고 원하는 적에 맞게 이름을 변경하세요.")
    print(f"  예: sprite_042.png → raccoon.png")
    print(f"\n필요한 이름 목록:")
    names = [
        "raccoon", "vending-machine", "shadow-cats", "cleaning-robot",
        "market-boss", "delivery-bike", "mannequins", "neon-ghost",
        "antenna-monster", "midnight-clock", "stray-dog", "traffic-light",
        "sewer-rats", "shopping-cart", "food-cart", "umbrella-ghost",
        "broken-tv", "electric-pole",
    ]
    for name in names:
        print(f"    {name}.png")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python scripts/extract-sprites.py <sprite_sheet.png>")
        sys.exit(1)

    sheet_path = sys.argv[1]
    if not os.path.exists(sheet_path):
        print(f"오류: 파일을 찾을 수 없습니다: {sheet_path}")
        sys.exit(1)

    project_root = Path(__file__).resolve().parent.parent
    output_dir = str(project_root / "client" / "public" / "sprites")

    extract_sprites(sheet_path, output_dir)
