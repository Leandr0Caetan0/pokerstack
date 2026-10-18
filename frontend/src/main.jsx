import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const DENOMS = [
  { value: 50, color: '#111827', text: '#ffffff' },
  { value: 25, color: '#2563eb', text: '#ffffff' },
  { value: 10, color: '#16a34a', text: '#ffffff' },
  { value: 5, color: '#dc2626', text: '#ffffff' },
  { value: 1, color: '#e5e7eb', text: '#111827' },
];
const money = n => Number(n).toLocaleString('pt-BR');

function App() {
  const [kits, setKits] = useState(1);
  const [players, setPlayers] = useState(4);
  const [rebuys, setRebuys] = useState(1);
  const [buyIn, setBuyIn] = useState(0);
  const [distMode, setDistMode] = useState('prop');

  const stacks = players + rebuys;
  const baseMax = Math.floor(kits * 40 / stacks);

  // Proportional: more 1s/5s/10s, fewer 25s/50s; 1s always multiple of 5
  const chipsDist = distMode === 'equal'
    ? { 1: baseMax, 5: baseMax, 10: baseMax, 25: baseMax, 50: baseMax }
    : {
        1: Math.floor(baseMax / 5) * 5 || baseMax,
        5: baseMax,
        10: baseMax,
        25: Math.max(1, Math.floor(baseMax / 2)),
        50: Math.max(1, Math.floor(baseMax / 3)),
      };

  const stackValue = DENOMS.reduce((s, { value }) => s + chipsDist[value] * value, 0);
  const stackChips = DENOMS.reduce((s, { value }) => s + chipsDist[value], 0);
  const valorPorFicha = buyIn > 0 && stackValue > 0 ? buyIn / stackValue : null;

  // Per-denomination leftovers
  const leftoversDist = DENOMS.reduce((acc, { value }) => {
    acc[value] = kits * 40 - chipsDist[value] * stacks;
    return acc;
  }, {});
  const hasVariableLeftovers = DENOMS.some(({ value }) => leftoversDist[value] !== leftoversDist[1]);

  const copyResult = async () => {
    const denomLines = [...DENOMS].reverse().map(({ value }) => `${value}: ${chipsDist[value]} fichas`).join('\n');
    const leftoverLines = hasVariableLeftovers
      ? [...DENOMS].reverse().map(({ value }) => `${value}: ${leftoversDist[value]} sobras`).join('\n')
      : `Todas as denominações: ${leftoversDist[1]}`;
    const content = `POKER STACK\nKits: ${kits} (${kits * 200} fichas)\nJogadores: ${players}\nRebuys: ${rebuys}\nStacks totais: ${stacks}${buyIn > 0 ? `\nBuy-in: R$ ${buyIn},00` : ''}\nModo: ${distMode === 'prop' ? 'Proporcional' : 'Igual'}\n\nEM CADA STACK:\n${denomLines}\nFichas por stack: ${stackChips}\nValor por stack: ${stackValue}${valorPorFicha ? `\nValor por ficha: R$ ${valorPorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : ''}\n\nSOBRAS:\n${leftoverLines}`;
    try { await navigator.clipboard.writeText(content); alert('Distribuição copiada!'); }
    catch { window.prompt('Copie a distribuição:', content); }
  };

  return <main className="app-shell">
    <header><div className="brand-icon">♠</div><div><h1>Poker Stack</h1><p>Calculadora de fichas</p></div></header>
    <section className="intro"><span className="eyebrow">SEU JOGO, SUA DISTRIBUIÇÃO</span><h2>Monte os stacks em segundos.</h2><p>Escolha os kits, os jogadores e quantos rebuys quer deixar reservados.</p></section>

    <section className="panel controls">
      <label htmlFor="kits">Quantidade de kits</label>
      <select id="kits" value={kits} onChange={e => setKits(Number(e.target.value))}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'kit' : 'kits'} — {n * 200} fichas</option>)}
      </select>
      <label>Jogadores</label>
      <div className="stepper">
        <button onClick={() => setPlayers(p => Math.max(2, p - 1))} disabled={players <= 2} aria-label="Diminuir jogadores">−</button>
        <div><strong>{players}</strong><small>jogadores</small></div>
        <button onClick={() => setPlayers(p => Math.min(39, p + 1))} disabled={players >= 39} aria-label="Aumentar jogadores">+</button>
      </div>
      <label>Stacks de rebuy</label>
      <div className="segmented">
        {[0,1,2,3].map(n => <button key={n} className={rebuys === n ? 'active' : ''} onClick={() => setRebuys(n)}>{n === 0 ? 'sem rebuy' : n === 1 ? '1 rebuy' : `${n} rebuys`}</button>)}
      </div>
      <label htmlFor="buyin">Buy-in por jogador</label>
      <div className="buyin-wrapper">
        <span>R$</span>
        <input id="buyin" type="number" min="0" step="1" value={buyIn || ''} onChange={e => setBuyIn(Number(e.target.value) || 0)} placeholder="0" />
      </div>
    </section>

    <section className="result panel">
      <div className="result-top">
        <div>
          <span className="eyebrow">VALOR POR STACK</span>
          <div className="big-number">{money(stackValue)}</div>
          <p className="muted">unidades de valor por stack</p>
        </div>
        <div className="stack-count"><strong>{stacks}</strong><span>stacks totais</span></div>
      </div>
      <div className="splitline" />
      <div className="summary-grid">
        <div><span>Fichas disponíveis</span><strong>{money(kits * 200)}</strong></div>
        <div><span>Fichas por stack</span><strong>{stackChips}</strong></div>
      </div>
      {valorPorFicha && <div className="por-ficha-row"><span>Valor por ficha</span><strong>R$ {valorPorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong></div>}
    </section>

    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">DISTRIBUIÇÃO</span><h2>Em cada stack</h2></div>
        <div className="mode-toggle">
          <button className={distMode === 'prop' ? 'active' : ''} onClick={() => setDistMode('prop')} title="Mais fichas baixas, ideal para cegos progressivos">Proporcional</button>
          <button className={distMode === 'equal' ? 'active' : ''} onClick={() => setDistMode('equal')}>Igual</button>
        </div>
      </div>
      {distMode === 'prop' && <p className="mode-hint">Fichas de 25 e 50 reduzidas — as sobras ficam como troco para nível avançado. Fichas de 1 sempre múltiplo de 5.</p>}
      <div className="chip-list">
        {DENOMS.map(({ value, color, text }) => (
          <div className="chip-row" key={value}>
            <div className="chip" style={{ background: color, color: text }}>{value}</div>
            <div className="chip-info">
              <strong>{chipsDist[value]} {chipsDist[value] === 1 ? 'ficha' : 'fichas'}</strong>
              <span>Valor somado: {money(chipsDist[value] * value)}</span>
            </div>
            <div className="denom-total">
              <strong>{chipsDist[value] * stacks}</strong>
              <span>{leftoversDist[value] > 0 ? `+${leftoversDist[value]} sobra${leftoversDist[value] > 1 ? 's' : ''}` : 'sem sobra'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="total-row"><span>Valor total de cada stack</span><strong>{money(stackValue)}</strong></div>
    </section>

    <button className="copy-button" onClick={copyResult}>▣ &nbsp; Copiar distribuição</button>
    <p className="footnote">
      {distMode === 'prop'
        ? 'Modo proporcional: fichas de 1 arredondadas para múltiplo de 5; fichas de 25 usam ~50% do máximo; fichas de 50 usam ~33% do máximo. As sobras ficam disponíveis para troco durante o jogo.'
        : 'Modo igual: cada kit tem 40 fichas de cada valor (1, 5, 10, 25 e 50). A calculadora divide cada denominação igualmente entre todos os stacks, arredondando para baixo.'}
    </p>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
