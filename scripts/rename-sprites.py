"""
스프라이트 번호 → 적 이름 매핑 스크립트.

134개 EarthBound 스프라이트를 imageTag 이름으로 복사합니다.
  python scripts/rename-sprites.py
"""

import shutil
from pathlib import Path

SPRITES_DIR = Path(__file__).resolve().parent.parent / "client" / "public" / "sprites"

# sprite_NNN.png → {imageTag}.png
MAPPING: dict[str, int] = {
    # --- 001~010 ---
    "scruffy-dog": 1,
    "dark-crow": 2,
    "jade-cobra": 3,
    "forest-mage": 4,
    "horned-demon": 5,
    "rocket-gremlin": 6,
    "wild-donkey": 7,
    "shadow-wisp": 8,
    "sewer-mouse": 9,
    "suited-gorilla": 10,
    # --- 011~020 ---
    "poison-shroom": 11,
    "angry-imp": 12,
    "violet-priest": 13,
    "crimson-showman": 14,
    "alley-punk": 15,
    "tiny-sprout": 16,
    "silver-saucer": 17,
    "great-treant": 18,
    "rabbit-archdemon": 19,
    "rabbit-sorcerer": 20,
    # --- 021~030 ---
    "cave-bear": 21,
    "tunnel-mole": 22,
    "green-bat": 23,
    "birdcage-witch": 24,
    "neon-firefly": 25,
    "trash-critter": 26,
    "scarlet-naga": 27,
    "horned-raider": 28,
    "pumpkin-head": 29,
    "shambling-zombie": 30,
    # --- 031~040 ---
    "midnight-panther": 31,
    "pale-ghost": 32,
    "club-caveman": 33,
    "mountain-ram": 34,
    "mad-duck": 35,
    "violet-slime": 36,
    "swamp-frog": 37,
    "tribal-warrior": 38,
    "scale-fighter": 39,
    "red-hopper": 40,
    # --- 041~050 ---
    "iron-stag-beetle": 41,
    "cherry-pudding": 42,
    "flutter-moth": 43,
    "hover-disc": 44,
    "bloated-goblin": 45,
    "toddling-mushroom": 46,
    "pebble-fungus": 47,
    "stampede-bison": 48,
    "gentle-bronto": 49,
    "plump-caterpillar": 50,
    # --- 051~060 ---
    "dish-critter": 51,
    "gray-wolf": 52,
    "tin-knight": 53,
    "bone-mask": 54,
    "armored-hornet": 55,
    "spindly-bot": 56,
    "wriggling-worm": 57,
    "raging-fatty": 58,
    "cursed-sign": 59,
    "trench-coat-man": 60,
    # --- 061~070 ---
    "runaway-taxi": 61,
    "guitar-lizard": 62,
    "dark-eyeball": 63,
    "mad-rooster": 64,
    "haunted-canvas": 65,
    "melting-clock": 66,
    "rogue-hydrant": 67,
    "possessed-pump": 68,
    "retro-robot": 69,
    "ribbon-mouse": 70,
    # --- 071~080 ---
    "titan-beetle": 71,
    "venus-trap": 72,
    "frost-bear": 73,
    "dustball": 74,
    "dusk-bat": 75,
    "sea-stallion": 76,
    "psychic-snail": 77,
    "sinister-puppet": 78,
    "ooze-phantom": 79,
    "patrol-drone": 80,
    # --- 081~090 ---
    "spider-mech": 81,
    "magma-snail": 82,
    "gilded-automaton": 83,
    "corrupt-officer": 84,
    "shades-brawler": 85,
    "elder-mummy": 86,
    "thorned-fiend": 87,
    "floating-lips": 88,
    "face-serpent": 89,
    "storm-cloud": 90,
    # --- 091~100 ---
    "plate-imp": 91,
    "one-eyed-stalker": 92,
    "armored-orb": 93,
    "crown-serpent": 94,
    "kiss-blob": 95,
    "giant-larva": 96,
    "dusk-spider": 97,
    "crimson-ogre": 98,
    "singing-cat": 99,
    "wisp-serpent": 100,
    # --- 101~110 ---
    "golden-titan": 101,
    "mud-toad": 102,
    "pincer-crab": 103,
    "mini-saucer": 104,
    "coral-pony": 105,
    "elder-oak": 106,
    "emerald-knight": 107,
    "arcane-wizard": 108,
    "pastel-unicorn": 109,
    "coiled-wyrm": 110,
    # --- 111~120 ---
    "pumpkin-blob": 111,
    "solar-face": 112,
    "bell-robot": 113,
    "evil-eye": 114,
    "jovial-dragon": 115,
    "stone-face": 116,
    "baby-rex": 117,
    "phantom-skull": 118,
    "mad-professor": 119,
    "sinister-professor": 120,
    # --- 121~134 ---
    "flame-wraith": 121,
    "wandering-sage": 122,
    "twin-watchers": 123,
    "molecular-drone": 124,
    "chomping-lips": 125,
    "volt-toad": 126,
    "dread-guardian": 127,
    "cyclops-lurker": 128,
    "wyrm-dragon": 129,
    "blade-sphere": 130,
    "kraken-spawn": 131,
    "shadow-wings": 132,
    "staff-phantom": 133,
    "infernal-knight": 134,
}


def main():
    unmapped = [name for name, num in MAPPING.items() if num == 0]
    if unmapped:
        print(f"아직 매핑되지 않은 적: {', '.join(unmapped)}")
        print("MAPPING 딕셔너리에 스프라이트 번호를 채워주세요.")
        return

    copied = 0
    for name, num in MAPPING.items():
        src = SPRITES_DIR / f"sprite_{num:03d}.png"
        dst = SPRITES_DIR / f"{name}.png"
        if not src.exists():
            print(f"  ✗ sprite_{num:03d}.png 없음 → {name} 건너뜀")
            continue
        shutil.copy2(src, dst)
        print(f"  ✓ sprite_{num:03d}.png → {name}.png")
        copied += 1

    print(f"\n완료! {copied}/{len(MAPPING)}개 적 스프라이트가 준비됐습니다.")


if __name__ == "__main__":
    main()
