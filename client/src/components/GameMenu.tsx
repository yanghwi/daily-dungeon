import { useState, useCallback, useEffect, useRef } from 'react';

interface Props {
  onLeaveRoom: () => void;
}

/**
 * 햄버거 메뉴 — 좌상단 고정, 배틀 중 로비 복귀 등
 */
export default function GameMenu({ onLeaveRoom }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) setConfirming(false);
      return !prev;
    });
  }, []);

  const handleLeave = useCallback(() => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onLeaveRoom();
    setOpen(false);
    setConfirming(false);
  }, [confirming, onLeaveRoom]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="fixed top-0 left-0 z-40"
      style={{
        marginTop: 'env(safe-area-inset-top, 0px)',
        marginLeft: 'env(safe-area-inset-left, 0px)',
      }}
    >
      {/* 햄버거 버튼 */}
      <button
        type="button"
        onClick={toggle}
        className="px-2.5 py-1.5 bg-midnight-900/80 backdrop-blur-sm rounded-br-lg
                   text-slate-400 font-title text-sm
                   active:bg-midnight-700/80 transition-colors"
        aria-label="메뉴"
      >
        {open ? '\u2715' : '\u2630'}
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div className="absolute top-full left-0 mt-1 ml-1 animate-fade-in">
          <div className="eb-window !p-2 min-w-[160px]">
            <button
              type="button"
              onClick={handleLeave}
              className={`w-full text-left px-3 py-2.5 rounded transition-colors font-body text-sm
                ${confirming
                  ? 'bg-tier-nat1/20 text-tier-nat1'
                  : 'text-slate-300 active:bg-midnight-700'
                }`}
            >
              {confirming ? '정말 나가시겠습니까?' : '로비로 돌아가기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
