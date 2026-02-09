/**
 * 적 스프라이트 설정 — 전체 PNG 기반 (EarthBound 스프라이트)
 * boxShadow 픽셀아트 제거, 모든 적이 /sprites/{imageTag}.png 사용
 */

export interface SpriteConfig {
  boxShadow: string;
  /** idle 애니메이션 이름 (spriteAnimations.css에 정의) */
  idleAnimation: string;
  /** idle 애니메이션 duration */
  idleDuration: string;
  /** idle steps (retro feel) */
  idleSteps: number | null;
  /** 스프라이트 scale factor */
  scale: number;
  /** box-shadow 시각 영역 너비 (px) — 센터링 보정용 */
  visualWidth: number;
  /** box-shadow 시각 영역 높이 (px) — 센터링 보정용 */
  visualHeight: number;
}

// ===== 기존 18개 적 (box-shadow → PNG 교체) =====

const SPRITES: Record<string, SpriteConfig> = {
  'raccoon':          { boxShadow: '', idleAnimation: 'idle-bounce',   idleDuration: '1s',   idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'vending-machine':  { boxShadow: '', idleAnimation: 'idle-wobble',   idleDuration: '1.2s', idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'shadow-cats':      { boxShadow: '', idleAnimation: 'idle-float',    idleDuration: '2s',   idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'cleaning-robot':   { boxShadow: '', idleAnimation: 'idle-pulse',    idleDuration: '0.8s', idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'market-boss':      { boxShadow: '', idleAnimation: 'idle-float',    idleDuration: '3s',   idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'delivery-bike':    { boxShadow: '', idleAnimation: 'idle-vibrate',  idleDuration: '0.3s', idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'mannequins':       { boxShadow: '', idleAnimation: 'idle-twitch',   idleDuration: '2s',   idleSteps: 4,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'neon-ghost':       { boxShadow: '', idleAnimation: 'idle-flicker',  idleDuration: '1.5s', idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'antenna-monster':  { boxShadow: '', idleAnimation: 'idle-spark',    idleDuration: '1s',   idleSteps: 3,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'midnight-clock':   { boxShadow: '', idleAnimation: 'idle-pendulum', idleDuration: '2.5s', idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'stray-dog':        { boxShadow: '', idleAnimation: 'idle-bounce',   idleDuration: '0.8s', idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'traffic-light':    { boxShadow: '', idleAnimation: 'idle-flicker',  idleDuration: '1.2s', idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'sewer-rats':       { boxShadow: '', idleAnimation: 'idle-twitch',   idleDuration: '1.5s', idleSteps: 4,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'shopping-cart':    { boxShadow: '', idleAnimation: 'idle-vibrate',  idleDuration: '0.4s', idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'food-cart':        { boxShadow: '', idleAnimation: 'idle-wobble',   idleDuration: '1s',   idleSteps: 2,    scale: 5, visualWidth: 64, visualHeight: 64 },
  'umbrella-ghost':   { boxShadow: '', idleAnimation: 'idle-float',    idleDuration: '2.5s', idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'broken-tv':        { boxShadow: '', idleAnimation: 'idle-flicker',  idleDuration: '1s',   idleSteps: null, scale: 5, visualWidth: 64, visualHeight: 64 },
  'electric-pole':    { boxShadow: '', idleAnimation: 'idle-spark',    idleDuration: '0.8s', idleSteps: 3,    scale: 5, visualWidth: 64, visualHeight: 64 },
};

// ===== 레지스트리 몬스터 일괄 등록 (PNG 전용) =====

const CATEGORY_ANIM: Record<string, Pick<SpriteConfig, 'idleAnimation' | 'idleDuration' | 'idleSteps'>> = {
  animal:       { idleAnimation: 'idle-bounce',  idleDuration: '1.0s', idleSteps: 2 },
  humanoid:     { idleAnimation: 'idle-twitch',  idleDuration: '2.0s', idleSteps: 4 },
  machine:      { idleAnimation: 'idle-vibrate', idleDuration: '0.4s', idleSteps: 2 },
  supernatural: { idleAnimation: 'idle-float',   idleDuration: '2.5s', idleSteps: null },
  insect:       { idleAnimation: 'idle-vibrate', idleDuration: '0.3s', idleSteps: 2 },
  plant:        { idleAnimation: 'idle-pulse',   idleDuration: '1.5s', idleSteps: 2 },
  blob:         { idleAnimation: 'idle-wobble',  idleDuration: '1.5s', idleSteps: 2 },
  boss:         { idleAnimation: 'idle-pendulum',idleDuration: '2.5s', idleSteps: null },
};

/** 카테고리별 imageTag 목록 — monsterRegistry.ts와 동기화 */
const SPRITE_CATEGORIES: Record<string, string[]> = {
  animal: [
    'scruffy-dog','dark-crow','jade-cobra','wild-donkey','sewer-mouse','cave-bear',
    'tunnel-mole','green-bat','trash-critter','midnight-panther','mountain-ram',
    'mad-duck','swamp-frog','scale-fighter','red-hopper','stampede-bison',
    'gentle-bronto','gray-wolf','guitar-lizard','mad-rooster','ribbon-mouse',
    'frost-bear','dusk-bat','sea-stallion','crown-serpent','singing-cat',
    'pincer-crab','coral-pony','pastel-unicorn','coiled-wyrm','baby-rex',
    'volt-toad','wyrm-dragon','kraken-spawn',
  ],
  humanoid: [
    'forest-mage','suited-gorilla','angry-imp','violet-priest','crimson-showman',
    'alley-punk','birdcage-witch','horned-raider','club-caveman','tribal-warrior',
    'tin-knight','raging-fatty','trench-coat-man','corrupt-officer','shades-brawler',
    'crimson-ogre','emerald-knight','arcane-wizard','sinister-professor',
    'mad-professor','wandering-sage','infernal-knight',
  ],
  machine: [
    'rocket-gremlin','silver-saucer','hover-disc','spindly-bot','cursed-sign',
    'runaway-taxi','rogue-hydrant','possessed-pump','retro-robot','patrol-drone',
    'spider-mech','gilded-automaton','armored-orb','mini-saucer','bell-robot',
    'molecular-drone','blade-sphere',
  ],
  supernatural: [
    'horned-demon','shadow-wisp','rabbit-archdemon','rabbit-sorcerer','scarlet-naga',
    'pumpkin-head','shambling-zombie','pale-ghost','bloated-goblin','bone-mask',
    'haunted-canvas','melting-clock','psychic-snail','sinister-puppet','magma-snail',
    'elder-mummy','thorned-fiend','floating-lips','face-serpent','storm-cloud',
    'one-eyed-stalker','wisp-serpent','solar-face','evil-eye','flame-wraith',
    'twin-watchers','cyclops-lurker','shadow-wings','staff-phantom','phantom-skull',
  ],
  insect: [
    'neon-firefly','iron-stag-beetle','flutter-moth','plump-caterpillar',
    'armored-hornet','titan-beetle','giant-larva','dusk-spider',
  ],
  plant: [
    'poison-shroom','tiny-sprout','great-treant','toddling-mushroom',
    'pebble-fungus','venus-trap','elder-oak',
  ],
  blob: [
    'violet-slime','cherry-pudding','dish-critter','dark-eyeball','dustball',
    'ooze-phantom','wriggling-worm','plate-imp','kiss-blob','pumpkin-blob',
    'stone-face','mud-toad','chomping-lips',
  ],
  boss: [
    'golden-titan','jovial-dragon','dread-guardian',
  ],
};

// 일괄 등록
for (const [category, tags] of Object.entries(SPRITE_CATEGORIES)) {
  const anim = CATEGORY_ANIM[category] ?? CATEGORY_ANIM.animal;
  for (const tag of tags) {
    if (!SPRITES[tag]) {
      SPRITES[tag] = {
        boxShadow: '',
        idleAnimation: anim.idleAnimation,
        idleDuration: anim.idleDuration,
        idleSteps: anim.idleSteps,
        scale: 5,
        visualWidth: 64,
        visualHeight: 64,
      };
    }
  }
}

export default SPRITES;
