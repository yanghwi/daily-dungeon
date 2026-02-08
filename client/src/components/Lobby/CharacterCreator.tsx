import { useState } from 'react';
import {
  HEADS,
  BODIES,
  PALETTES,
  buildCharacterSprite,
  DEFAULT_APPEARANCE,
  type CharacterAppearance,
} from '../../assets/sprites/characterParts';

interface Props {
  onConfirm: (appearance: CharacterAppearance) => void;
  onCancel?: () => void;
  initialAppearance?: CharacterAppearance;
}

export default function CharacterCreator({ onConfirm, onCancel, initialAppearance }: Props) {
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    initialAppearance ?? DEFAULT_APPEARANCE
  );
  const [activeTab, setActiveTab] = useState<'head' | 'body' | 'color'>('head');

  const sprite = buildCharacterSprite(appearance);

  return (
    <div className="eb-window animate-fade-in">
      <div className="font-title text-sm text-arcane-light mb-3">캐릭터 외형</div>

      {/* 프리뷰 */}
      <div className="flex justify-center mb-4">
        <div className="relative" style={{ width: 80, height: 120 }}>
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              boxShadow: sprite,
              transform: 'scale(3)',
              transformOrigin: 'top left',
              left: 16,
              top: 8,
            }}
          />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-3">
        {(['head', 'body', 'color'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 font-title text-xs text-center transition-colors ${
              activeTab === tab
                ? 'text-arcane-light border-b-2 border-arcane-light'
                : 'text-slate-500'
            }`}
          >
            {tab === 'head' ? '머리' : tab === 'body' ? '몸' : '색상'}
          </button>
        ))}
      </div>

      {/* 파츠 선택 — renderPartSelector */}
      {renderPartSelector(activeTab, appearance, setAppearance)}

      {/* 확인 / 취소 */}
      <div className="flex gap-2 mt-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 eb-window !border-slate-600 text-center active:scale-95 transition-transform"
          >
            <span className="font-title text-sm text-slate-400">취소</span>
          </button>
        )}
        <button
          onClick={() => onConfirm(appearance)}
          className="flex-1 eb-window !border-gold text-center active:scale-95 transition-transform"
        >
          <span className="font-title text-sm text-gold">확인</span>
        </button>
      </div>
    </div>
  );
}

function renderPartSelector(
  tab: 'head' | 'body' | 'color',
  appearance: CharacterAppearance,
  setAppearance: React.Dispatch<React.SetStateAction<CharacterAppearance>>,
) {
  if (tab === 'head') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {HEADS.map((head) => (
          <button
            key={head.id}
            onClick={() => setAppearance((a) => ({ ...a, headId: head.id }))}
            className={`eb-window text-center py-2 active:scale-95 transition-transform ${
              appearance.headId === head.id ? '!border-arcane-light' : '!border-slate-700'
            }`}
          >
            <span className="font-body text-xs text-slate-300">{head.name}</span>
          </button>
        ))}
      </div>
    );
  }

  if (tab === 'body') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {BODIES.map((body) => (
          <button
            key={body.id}
            onClick={() => setAppearance((a) => ({ ...a, bodyId: body.id }))}
            className={`eb-window text-center py-2 active:scale-95 transition-transform ${
              appearance.bodyId === body.id ? '!border-arcane-light' : '!border-slate-700'
            }`}
          >
            <span className="font-body text-xs text-slate-300">{body.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // color tab
  return (
    <div className="grid grid-cols-3 gap-2">
      {PALETTES.map((palette) => (
        <button
          key={palette.id}
          onClick={() => setAppearance((a) => ({ ...a, paletteId: palette.id }))}
          className={`eb-window text-center py-2 active:scale-95 transition-transform ${
            appearance.paletteId === palette.id ? '!border-arcane-light' : '!border-slate-700'
          }`}
        >
          <div className="flex justify-center gap-1 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.shirt }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.hair }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.accent }} />
          </div>
          <span className="font-body text-[10px] text-slate-400">{palette.name}</span>
        </button>
      ))}
    </div>
  );
}
