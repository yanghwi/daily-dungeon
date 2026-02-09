import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function RoomCodeBadge() {
  const code = useGameStore((s) => s.room?.code);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!code || copied) return;

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code, copied]);

  if (!code) return null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="fixed top-0 right-0 z-40 px-2.5 py-1 bg-midnight-900/80 backdrop-blur-sm rounded-bl-lg
                 text-slate-500 font-title text-[10px] tracking-widest
                 active:bg-midnight-700/80 transition-colors"
      style={{ marginTop: 'env(safe-area-inset-top, 0px)', marginRight: 'env(safe-area-inset-right, 0px)' }}
    >
      {copied ? 'COPIED!' : code}
    </button>
  );
}
