import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { CombatResult, CombatOutcome } from '@daily-dungeon/shared';
import { theme } from '../../styles/theme';

// 결과별 스타일 설정 (색상은 theme.ts에서 참조)
const RESULT_STYLES: Record<
  CombatResult,
  { title: string; bgColor: string; borderColor: string; textColor: string }
> = {
  perfect: {
    title: '완벽한 승리!',
    bgColor: theme.combatResults.perfect.bg,
    borderColor: theme.combatResults.perfect.border,
    textColor: theme.combatResults.perfect.text,
  },
  victory: {
    title: '승리!',
    bgColor: theme.combatResults.victory.bg,
    borderColor: theme.combatResults.victory.border,
    textColor: theme.combatResults.victory.text,
  },
  narrow: {
    title: '아슬아슬한 승리',
    bgColor: theme.combatResults.narrow.bg,
    borderColor: theme.combatResults.narrow.border,
    textColor: theme.combatResults.narrow.text,
  },
  defeat: {
    title: '패배...',
    bgColor: theme.combatResults.defeat.bg,
    borderColor: theme.combatResults.defeat.border,
    textColor: theme.combatResults.defeat.text,
  },
  wipe: {
    title: '전멸 위기!',
    bgColor: theme.combatResults.wipe.bg,
    borderColor: theme.combatResults.wipe.border,
    textColor: theme.combatResults.wipe.text,
  },
};

interface CombatPopupProps {
  onClose: () => void;
}

export function CombatPopup({ onClose }: CombatPopupProps) {
  const { combat, player, room } = useGameStore();
  const outcome = combat.outcome;

  // 타이핑 효과 상태
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // 문장 분리 및 순차 표시
  useEffect(() => {
    if (!outcome) return;

    const description = outcome.description || '전투가 벌어졌다!';
    // 마침표 또는 줄바꿈으로 문장 분리
    const lines = description
      .split(/(?<=\.)\s+|\n/)
      .filter((line) => line.trim().length > 0);

    // 타이머 ID 배열 (클린업용)
    const timerIds: NodeJS.Timeout[] = [];

    // 초기화
    setDisplayedLines([]);
    setIsTypingComplete(false);

    lines.forEach((line, index) => {
      const timerId = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, line.trim()]);
        if (index === lines.length - 1) {
          setIsTypingComplete(true);
        }
      }, 800 * (index + 1));
      timerIds.push(timerId);
    });

    // 문장이 하나도 없는 경우
    if (lines.length === 0) {
      setDisplayedLines(['전투가 벌어졌다!']);
      setIsTypingComplete(true);
    }

    return () => {
      timerIds.forEach((id) => clearTimeout(id));
    };
  }, [outcome]);

  if (!outcome || !combat.isActive) return null;

  const style = RESULT_STYLES[outcome.result];
  const isParticipant = outcome.participants.includes(player?.id || '');
  const myDamage = outcome.damages.find((d) => d.playerId === player?.id);

  // 참전자 이름 목록
  const participantNames = outcome.participants
    .map((id) => room?.players.find((p) => p.id === id)?.name || '알 수 없음')
    .join(', ');

  // 인라인 스타일 정의
  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '0 16px',
    },
    backdrop: {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    popup: {
      position: 'relative' as const,
      maxWidth: '380px',
      width: '100%',
      padding: '16px',
      borderRadius: '8px',
      border: `2px solid ${style.borderColor}`,
      backgroundColor: style.bgColor,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '16px',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: '0.875rem',
      marginTop: '4px',
    },
    descriptionBox: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '16px',
      minHeight: '80px',
    },
    descriptionLine: {
      color: '#f3f4f6',
      fontSize: '0.875rem',
      lineHeight: '1.625',
      marginBottom: '8px',
    },
    typingCursor: {
      display: 'inline-block',
      width: '2px',
      height: '14px',
      backgroundColor: style.textColor,
      marginLeft: '2px',
      animation: 'blink 1s step-end infinite',
    },
    sectionLabel: {
      color: theme.colors.textSecondary,
      fontSize: '0.75rem',
      marginBottom: '4px',
    },
    sectionValue: {
      color: theme.colors.textPrimary,
      fontSize: '0.875rem',
    },
    section: {
      marginBottom: '12px',
    },
    flexWrap: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
    },
    damageTag: {
      fontSize: '0.75rem',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    myStatusBox: {
      backgroundColor: 'rgba(37, 99, 235, 0.3)',
      borderRadius: '4px',
      padding: '8px',
      marginBottom: '16px',
    },
    myStatusText: {
      color: '#bfdbfe',
      fontSize: '0.75rem',
    },
    myStatusDamage: {
      color: '#f87171',
      marginLeft: '8px',
    },
    button: {
      width: '100%',
      backgroundColor: isTypingComplete ? theme.colors.secondary : '#6b7280',
      color: theme.colors.textPrimary,
      fontWeight: 'bold',
      padding: '12px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: isTypingComplete ? 'pointer' : 'not-allowed',
      transition: 'background-color 0.2s',
      opacity: isTypingComplete ? 1 : 0.7,
    },
  };

  // 희귀도별 스타일 (theme.ts에서 참조)
  const getRarityStyle = (rarity: string): React.CSSProperties => {
    const rarityKey = rarity as keyof typeof theme.rarity;
    const rarityColors = theme.rarity[rarityKey] || theme.rarity.common;
    return { backgroundColor: rarityColors.bg, color: rarityColors.text };
  };

  const handleClose = () => {
    if (isTypingComplete) {
      onClose();
    }
  };

  return (
    <>
      {/* 깜빡임 애니메이션용 스타일 */}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            50.01%, 100% { opacity: 0; }
          }
        `}
      </style>

      <div style={styles.overlay}>
        {/* 배경 오버레이 */}
        <div style={styles.backdrop} onClick={handleClose} />

        {/* 팝업 컨텐츠 */}
        <div style={styles.popup}>
          {/* 헤더 */}
          <div style={styles.header}>
            <h2 style={styles.title}>{style.title}</h2>
            <p style={styles.subtitle}>vs {outcome.monster.name}</p>
          </div>

          {/* 전투 묘사 (타이핑 효과) */}
          <div style={styles.descriptionBox}>
            {displayedLines.map((line, index) => (
              <p key={index} style={styles.descriptionLine}>
                {line}
              </p>
            ))}
            {!isTypingComplete && (
              <span style={styles.typingCursor} />
            )}
          </div>

          {/* 참전자 */}
          <div style={styles.section}>
            <p style={styles.sectionLabel}>참전자</p>
            <p style={styles.sectionValue}>{participantNames}</p>
          </div>

          {/* 피해 현황 */}
          {outcome.damages.length > 0 && (
            <div style={styles.section}>
              <p style={styles.sectionLabel}>피해 현황</p>
              <div style={styles.flexWrap}>
                {outcome.damages.map((d) => {
                  const damagePlayer = room?.players.find((p) => p.id === d.playerId);
                  const isMe = d.playerId === player?.id;
                  return (
                    <span
                      key={d.playerId}
                      style={{
                        ...styles.damageTag,
                        backgroundColor: isMe
                          ? 'rgba(37, 99, 235, 0.5)'
                          : 'rgba(55, 65, 81, 0.5)',
                        color: theme.colors.textPrimary,
                      }}
                    >
                      {damagePlayer?.name || '알 수 없음'}: -{d.damage} HP
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 드랍 아이템 */}
          {outcome.drops.length > 0 && (
            <div style={{ ...styles.section, marginBottom: '16px' }}>
              <p style={styles.sectionLabel}>획득 아이템</p>
              <div style={styles.flexWrap}>
                {outcome.drops.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      ...styles.damageTag,
                      ...getRarityStyle(item.rarity),
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 내 상태 (참전한 경우) */}
          {isParticipant && player && (
            <div style={styles.myStatusBox}>
              <p style={styles.myStatusText}>
                내 HP: {player.hp} / {player.maxHp}
                {myDamage && myDamage.damage > 0 && (
                  <span style={styles.myStatusDamage}>(-{myDamage.damage})</span>
                )}
              </p>
            </div>
          )}

          {/* 확인 버튼 */}
          <button
            onClick={handleClose}
            style={styles.button}
            disabled={!isTypingComplete}
            onMouseOver={(e) => {
              if (isTypingComplete) {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }
            }}
            onMouseOut={(e) => {
              if (isTypingComplete) {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }
            }}
          >
            {isTypingComplete ? '계속 탐험' : '전투 진행 중...'}
          </button>
        </div>
      </div>
    </>
  );
}
