import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PokerTime.css';

const DEFAULT_LEVELS = [
  { sb: 1,   bb: 2,   duration: 20 },
  { sb: 2,   bb: 4,   duration: 20 },
  { sb: 5,   bb: 10,  duration: 20 },
  { sb: 10,  bb: 20,  duration: 20 },
  { sb: 15,  bb: 30,  duration: 15 },
  { sb: 20,  bb: 40,  duration: 15 },
  { sb: 30,  bb: 60,  duration: 15 },
  { sb: 50,  bb: 100, duration: 15 },
  { sb: 75,  bb: 150, duration: 15 },
  { sb: 100, bb: 200, duration: 15 },
  { sb: 150, bb: 300, duration: 15 },
  { sb: 200, bb: 400, duration: 15 },
  { sb: 300, bb: 600, duration: 15 },
];

function cleanNum(n) {
  if (n <= 0) return 1;
  if (n <= 2) return Math.round(n);
  if (n <= 10) return Math.round(n);
  if (n <= 50) return Math.round(n / 5) * 5;
  if (n <= 200) return Math.round(n / 10) * 10;
  if (n <= 1000) return Math.round(n / 25) * 25;
  return Math.round(n / 100) * 100;
}

export function generateRecommendedLevels(initialStack) {
  const stack = Number(initialStack) || 300;
  // SB inicial ≈ stack / 200 (player começa com ~100BB = 200 SB)
  let startSB = cleanNum(stack / 200);
  if (startSB < 1) startSB = 1;
  const multipliers = [1, 1.5, 2.5, 4, 6, 8.5, 12, 17, 25, 35, 50, 70, 100];
  return multipliers.map((m, i) => {
    const sb = Math.max(1, cleanNum(startSB * m));
    const bb = sb * 2; // BB é SEMPRE o dobro do SB
    return { sb, bb, duration: i < 4 ? 20 : 15 };
  });
}

function totalTime(levels) {
  return levels.reduce((acc, l) => acc + (Number(l.duration) || 0), 0);
}

function padTwo(n) {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0');
}

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  return padTwo(s / 60) + ':' + padTwo(s % 60);
}

function formatTotalTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + 'min';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'min';
}

const audioCtxRef = { current: null };

function getAudioCtx() {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

function playBeep(type) {
  try {
    const ctx = getAudioCtx();
    if (type === 'level') {
      [[660, 0, 0.3], [880, 0.35, 0.3], [1100, 0.7, 0.4]].forEach(function(item) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = item[0]; osc.type = 'triangle';
        gain.gain.setValueAtTime(0, ctx.currentTime + item[1]);
        gain.gain.linearRampToValueAtTime(item[2], ctx.currentTime + item[1] + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + item[1] + 0.5);
        osc.start(ctx.currentTime + item[1]);
        osc.stop(ctx.currentTime + item[1] + 0.55);
      });
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 520; osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.65);
    } else if (type === 'end') {
      [[523, 0, 0.3], [659, 0.3, 0.3], [784, 0.6, 0.3], [1047, 0.9, 0.5]].forEach(function(item) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = item[0]; osc.type = 'triangle';
        gain.gain.setValueAtTime(0, ctx.currentTime + item[1]);
        gain.gain.linearRampToValueAtTime(item[2], ctx.currentTime + item[1] + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + item[1] + 0.7);
        osc.start(ctx.currentTime + item[1]);
        osc.stop(ctx.currentTime + item[1] + 0.75);
      });
    }
  } catch (e) {}
}

export default function PokerTimePage({ sharedStackValue }) {
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_LEVELS[0].duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
  const [recommendStack, setRecommendStack] = useState('');
  const [warnedThisLevel, setWarnedThisLevel] = useState(false);
  const [tournamentEnded, setTournamentEnded] = useState(false);
  const [muted, setMuted] = useState(false);

  const mutedRef = useRef(false);
  const levelsRef = useRef(levels);
  const currentLevelRef = useRef(currentLevel);
  const warnedRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { levelsRef.current = levels; }, [levels]);
  useEffect(() => { currentLevelRef.current = currentLevel; }, [currentLevel]);
  useEffect(() => { warnedRef.current = warnedThisLevel; }, [warnedThisLevel]);

  const beep = useCallback((type) => {
    if (!mutedRef.current) playBeep(type);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next === 60 && !warnedRef.current) {
          setWarnedThisLevel(true);
          beep('warning');
        }
        if (next <= 0) {
          const lvls = levelsRef.current;
          const cl = currentLevelRef.current;
          const nextLvl = cl + 1;
          if (nextLvl >= lvls.length) {
            setIsRunning(false);
            setTournamentEnded(true);
            beep('end');
            return 0;
          }
          setCurrentLevel(nextLvl);
          setWarnedThisLevel(false);
          beep('level');
          return lvls[nextLvl].duration * 60;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, beep]);

  const resetTimer = (newLevels, idx) => {
    setIsRunning(false);
    const i = idx !== undefined ? idx : 0;
    setCurrentLevel(i);
    setTimeLeft((newLevels || levels)[i].duration * 60);
    setWarnedThisLevel(false);
    setTournamentEnded(false);
  };

  const handlePlayPause = () => {
    if (tournamentEnded) return;
    try { getAudioCtx(); } catch (e) {}
    setIsRunning(r => !r);
  };

  const handlePrevLevel = () => {
    if (currentLevel <= 0) return;
    const prev = currentLevel - 1;
    setIsRunning(false);
    setCurrentLevel(prev);
    setTimeLeft(levels[prev].duration * 60);
    setWarnedThisLevel(false);
    setTournamentEnded(false);
  };

  const handleNextLevel = () => {
    if (currentLevel >= levels.length - 1) return;
    const next = currentLevel + 1;
    setIsRunning(false);
    setCurrentLevel(next);
    setTimeLeft(levels[next].duration * 60);
    setWarnedThisLevel(false);
  };

  const handleResetLevel = () => {
    setIsRunning(false);
    setTimeLeft(levels[currentLevel].duration * 60);
    setWarnedThisLevel(false);
    setTournamentEnded(false);
  };

  const handleApplyRecommended = () => {
    const stack = Number(recommendStack) || Number(sharedStackValue) || 0;
    if (!stack || stack < 10) return;
    const newLevels = generateRecommendedLevels(stack);
    setLevels(newLevels);
    resetTimer(newLevels, 0);
    setShowRecommend(false);
    setRecommendStack('');
  };

  const handleResetToDefault = () => {
    setLevels(DEFAULT_LEVELS);
    resetTimer(DEFAULT_LEVELS, 0);
  };

  const updateLevel = (idx, field, val) => {
    setLevels(prev => {
      const updated = prev.map((l, i) => {
        if (i !== idx) return l;
        const numVal = Number(val) || 0;
        if (field === 'sb') {
          // BB é sempre o dobro do SB
          return { ...l, sb: numVal, bb: numVal * 2 };
        }
        return { ...l, [field]: numVal };
      });
      if (idx === currentLevel && field === 'duration') {
        setTimeLeft((Number(val) || 0) * 60);
      }
      return updated;
    });
  };

  const addLevel = () => {
    const last = levels[levels.length - 1];
    setLevels(prev => [...prev, { sb: last.sb * 2, bb: last.bb * 2, duration: 15 }]);
  };

  const removeLevel = (idx) => {
    if (levels.length <= 1) return;
    setLevels(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (idx <= currentLevel) {
        const newIdx = Math.max(0, currentLevel - 1);
        setCurrentLevel(newIdx);
        setTimeLeft(updated[newIdx].duration * 60);
      }
      return updated;
    });
  };

  const lv = levels[currentLevel] || levels[0];
  const nextLv = levels[currentLevel + 1];
  const totalMin = totalTime(levels);
  const progress = lv ? Math.min(100, (1 - timeLeft / (lv.duration * 60)) * 100) : 0;
  const isLastLevel = currentLevel >= levels.length - 1;
  const isWarning = timeLeft <= 60 && timeLeft > 0;

  return (
    <main className="app-shell">
      <header>
        <div className="brand-icon brand-icon--timer">&#9200;</div>
        <div>
          <h1>Poker Time</h1>
          <p>Controlador de blinds</p>
        </div>
        <button
          className={'pt-mute-btn' + (muted ? ' muted' : '')}
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'Ativar som' : 'Silenciar'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {tournamentEnded && (
        <div className="pt-ended-banner">
          <span>&#127942;</span>
          <div>
            <strong>Torneio encerrado!</strong>
            <p>Todos os {levels.length} níveis foram completados.</p>
          </div>
          <button onClick={() => resetTimer(levels, 0)} className="pt-ended-reset">Reiniciar</button>
        </div>
      )}

      <section className={'pt-timer-panel panel' + (isWarning && !tournamentEnded ? ' pt-warning' : '') + (tournamentEnded ? ' pt-ended' : '')}>
        <div className="pt-level-label">
          <span className="eyebrow">NÍVEL {currentLevel + 1} DE {levels.length}</span>
          <span className="pt-total-time">{formatTotalTime(totalMin)} total</span>
        </div>

        <div className="pt-countdown">{formatTime(timeLeft)}</div>

        <div className="pt-progress-bar">
          <div className="pt-progress-fill" style={{ width: progress + '%' }} />
        </div>

        <div className="pt-blinds-display">
          <div className="pt-blind-item">
            <span>Small Blind</span>
            <strong>{lv.sb}</strong>
          </div>
          <div className="pt-blind-divider">/</div>
          <div className="pt-blind-item">
            <span>Big Blind</span>
            <strong>{lv.bb}</strong>
          </div>
        </div>

        {nextLv && (
          <div className="pt-next-level">
            <span>Próximo:</span>
            <span>SB {nextLv.sb} / BB {nextLv.bb} — {nextLv.duration}min</span>
          </div>
        )}
        {isLastLevel && (
          <div className="pt-next-level pt-last">
            <span>&#9733; Último nível da estrutura</span>
          </div>
        )}
      </section>

      <div className="pt-controls">
        <button className="pt-ctrl-btn" onClick={handlePrevLevel} disabled={currentLevel === 0} title="Nível anterior">&#9664;&#9664;</button>
        <button className="pt-ctrl-btn pt-ctrl-reset" onClick={handleResetLevel} title="Reiniciar nível">&#8635;</button>
        <button className={'pt-ctrl-btn pt-ctrl-play' + (isRunning ? ' running' : '')} onClick={handlePlayPause} disabled={tournamentEnded} title={isRunning ? 'Pausar' : 'Iniciar'}>
          {isRunning ? '⏸' : '▶'}
        </button>
        <button className="pt-ctrl-btn pt-ctrl-reset" onClick={() => resetTimer(levels, 0)} title="Reiniciar torneio">&#9632;</button>
        <button className="pt-ctrl-btn" onClick={handleNextLevel} disabled={isLastLevel} title="Próximo nível">&#9654;&#9654;</button>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESTRUTURA DE BLINDS</span>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, margin: '5px 0 0' }}>
              {levels.length} níveis · {formatTotalTime(totalMin)}
            </h2>
          </div>
          <button className={'pt-edit-btn' + (editMode ? ' active' : '')} onClick={() => setEditMode(e => !e)}>
            {editMode ? 'Concluir' : '✏ Editar'}
          </button>
        </div>

        <div className="pt-recommend-row">
          <button className="pt-recommend-btn" onClick={() => {
            if (sharedStackValue > 0) {
              const newLevels = generateRecommendedLevels(sharedStackValue);
              setLevels(newLevels);
              resetTimer(newLevels, 0);
              setShowRecommend(false);
            } else {
              setShowRecommend(s => !s);
              setRecommendStack('');
            }
          }}>
            ✨ Gerar estrutura recomendada
            {sharedStackValue > 0 && <span className="pt-recommend-badge">stack {sharedStackValue}</span>}
          </button>
          <button className="pt-default-btn" onClick={handleResetToDefault} title="Voltar à estrutura padrão">
            Padrão
          </button>
        </div>

        {showRecommend && (
          <div className="pt-recommend-box">
            <p className="pt-recommend-desc">
              Nenhum stack configurado na Calculadora. Informe o <strong>stack inicial</strong> manualmente para gerar uma estrutura otimizada para <strong>4–5 horas</strong> de jogo.
            </p>
            <div className="buyin-wrapper" style={{ marginBottom: 10 }}>
              <span>fichas</span>
              <input
                type="number" min="10" step="10"
                value={recommendStack}
                onChange={e => setRecommendStack(e.target.value)}
                placeholder="Ex: 300"
                onKeyDown={e => e.key === 'Enter' && handleApplyRecommended()}
                autoFocus
              />
            </div>
            <button className="copy-button" style={{ marginBottom: 0 }} onClick={handleApplyRecommended} disabled={!recommendStack || Number(recommendStack) < 10}>
              Aplicar estrutura recomendada
            </button>
          </div>
        )}

        <div className="pt-levels-table">
          <div className="pt-levels-header">
            <span>Nível</span>
            <span>SB</span>
            <span>BB</span>
            <span>Duração</span>
            {editMode && <span></span>}
          </div>
          {levels.map((lv, idx) => (
            <div key={idx} className={'pt-level-row' + (idx === currentLevel ? ' pt-level-active' : '') + (idx < currentLevel ? ' pt-level-done' : '')}>
              <span className="pt-level-num">{idx + 1}</span>
              {editMode ? (
                <>
                  <input className="pt-level-input" type="number" min="1" value={lv.sb} onChange={e => updateLevel(idx, 'sb', e.target.value)} />
                  <span className="pt-bb-auto">{lv.sb * 2}</span>
                  <div className="pt-duration-input-wrap">
                    <input className="pt-level-input" type="number" min="1" max="120" value={lv.duration} onChange={e => updateLevel(idx, 'duration', e.target.value)} />
                    <span>min</span>
                  </div>
                  <button className="pt-remove-btn" onClick={() => removeLevel(idx)} disabled={levels.length <= 1}>×</button>
                </>
              ) : (
                <>
                  <span>{lv.sb}</span>
                  <span>{lv.bb}</span>
                  <span>{lv.duration}min</span>
                </>
              )}
            </div>
          ))}
          {editMode && (
            <button className="pt-add-level-btn" onClick={addLevel}>+ Adicionar nível</button>
          )}
        </div>
      </section>
    </main>
  );
}
