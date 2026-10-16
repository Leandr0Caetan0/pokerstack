import React, { useMemo, useState } from 'react';
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
  const stacks = players + rebuys;
  const chipsPerDenom = Math.floor(kits * 40 / stacks);
  const leftovers = kits * 40 - chipsPerDenom * stacks;
  const stackValue = chipsPerDenom * 91;
  const stackChips = chipsPerDenom * 5;
  const valorPorFicha = buyIn > 0 && stackValue > 0 ? buyIn / stackValue : null;
  const copyResult = async () => {
    const content = `POKER STACK\nKits: ${kits} (${kits*200} fichas)\nJogadores: ${players}\nRebuys: ${rebuys}\nStacks totais: ${stacks}${buyIn > 0 ? `\nBuy-in: R$ ${buyIn},00` : ''}\n\nEM CADA STACK:\n${[1,5,10,25,50].map(d=>`${d}: ${chipsPerDenom} fichas`).join('\n')}\nFichas físicas por stack: ${stackChips}\nValor por stack: ${stackValue}${valorPorFicha ? `\nValor por ficha: R$ ${valorPorFicha.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}` : ''}\nSobras de cada denominação: ${leftovers}`;
    try { await navigator.clipboard.writeText(content); alert('Distribuição copiada!'); }
    catch { window.prompt('Copie a distribuição:', content); }
  };
  return <main className="app-shell">
    <header><div className="brand-icon">♠</div><div><h1>Poker Stack</h1><p>Calculadora de fichas</p></div></header>
    <section className="intro"><span className="eyebrow">SEU JOGO, SUA DISTRIBUIÇÃO</span><h2>Monte os stacks em segundos.</h2><p>Escolha os kits, os jogadores e quantos rebuys quer deixar reservados.</p></section>
    <section className="panel controls">
      <label htmlFor="kits">Quantidade de kits</label>
      <select id="kits" value={kits} onChange={e=>setKits(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} {n===1?'kit':'kits'} — {n*200} fichas</option>)}</select>
      <label>Jogadores</label><div className="stepper"><button onClick={()=>setPlayers(p=>Math.max(2,p-1))} disabled={players<=2} aria-label="Diminuir jogadores">−</button><div><strong>{players}</strong><small>jogadores</small></div><button onClick={()=>setPlayers(p=>Math.min(39,p+1))} disabled={players>=39} aria-label="Aumentar jogadores">+</button></div>
      <label>Stacks de rebuy</label><div className="segmented">{[0,1,2,3].map(n=><button key={n} className={rebuys===n?'active':''} onClick={()=>setRebuys(n)}>{n===0?'sem rebuy':n===1?'1 rebuy':`${n} rebuys`}</button>)}</div>
      <label htmlFor="buyin">Buy-in por jogador</label><div className="buyin-wrapper"><span>R$</span><input id="buyin" type="number" min="0" step="1" value={buyIn||''} onChange={e=>setBuyIn(Number(e.target.value)||0)} placeholder="0" /></div>
    </section>
    <section className="result panel"><div className="result-top"><div><span className="eyebrow">VALOR POR STACK</span><div className="big-number">{money(stackValue)}</div><p className="muted">unidades de valor por stack</p></div><div className="stack-count"><strong>{stacks}</strong><span>stacks totais</span></div></div><div className="splitline"/><div className="summary-grid"><div><span>Fichas disponíveis</span><strong>{money(kits*200)}</strong></div><div><span>Fichas por stack</span><strong>{stackChips}</strong></div></div>{valorPorFicha&&<div className="por-ficha-row"><span>Valor por ficha</span><strong>R$ {valorPorFicha.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}</strong></div>}</section>
    <section className="panel"><div className="section-heading"><div><span className="eyebrow">DISTRIBUIÇÃO</span><h2>Em cada stack</h2></div><span className="pill">{stackChips} fichas</span></div>
      <div className="chip-list">{DENOMS.map(({value,color,text})=><div className="chip-row" key={value}><div className="chip" style={{background:color,color:text}}>{value}</div><div className="chip-info"><strong>{chipsPerDenom} {chipsPerDenom===1?'ficha':'fichas'}</strong><span>Valor somado: {money(chipsPerDenom*value)}</span></div><div className="denom-total"><strong>{chipsPerDenom*stacks}</strong><span>no total</span></div></div>)}</div>
      <div className="total-row"><span>Valor total de cada stack</span><strong>{money(stackValue)}</strong></div>
    </section>
    <section className="panel leftovers"><div className="leftover-icon">↗</div><div><strong>Sobras de cada valor: {leftovers}</strong><p>As fichas que sobrarem de cada denominação ficam fora dos stacks iniciais.</p></div></section>
    <button className="copy-button" onClick={copyResult}>▣ &nbsp; Copiar distribuição</button>
    <p className="footnote">Regra: cada kit tem 40 fichas de cada valor (1, 5, 10, 25 e 50). A calculadora divide cada denominação igualmente entre jogadores e stacks de rebuy, arredondando para baixo.</p>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
