import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import PokerTimePage from './PokerTime.jsx';

const DENOMS = [
  { value: 50, color: '#111827', text: '#ffffff' },
  { value: 25, color: '#2563eb', text: '#ffffff' },
  { value: 10, color: '#16a34a', text: '#ffffff' },
  { value: 5, color: '#dc2626', text: '#ffffff' },
  { value: 1, color: '#e5e7eb', text: '#111827' },
];
const money = n => Number(n).toLocaleString('pt-BR');
const brl = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function stackQuality(cpd) {
  if (cpd < 5)  return { level: 'bad',  icon: '!', text: 'Fichas insuficientes. Use mais kits ou reduza jogadores/rebuys.' };
  if (cpd < 8)  return { level: 'warn', icon: '~', text: 'Fichas limitadas. Ok para partidas rapidas, pode apertar no troco com blinds progressivos.' };
  if (cpd < 12) return { level: 'ok',   icon: 'v', text: 'Suficiente para algumas horas. Para jogos longos, o ideal e 12+ fichas de cada.' };
  if (cpd < 16) return { level: 'good', icon: 'v', text: 'Boa configuracao — confortavel para horas de jogo com blinds progressivos.' };
  return { level: 'great', icon: '*', text: cpd + ' fichas de cada — ideal para torneios longos com cegos crescentes a cada 30 min.' };
}

let uid = 1;
const mkPlayer = name => ({ id: uid++, name, chips: '' });

function CalcPage({ kits, setKits, players, setPlayers, rebuys, setRebuys, buyIn, setBuyIn }) {
  const stacks = players + rebuys;
  const chipsPerDenom = Math.floor(kits * 40 / stacks);
  const leftovers = kits * 40 - chipsPerDenom * stacks;
  const stackValue = chipsPerDenom * 91;
  const stackChips = chipsPerDenom * 5;
  const valorPorFicha = buyIn > 0 && stackValue > 0 ? buyIn / stackValue : null;
  const quality = stackQuality(chipsPerDenom);

  const copyResult = async () => {
    const lines = [
      'POKER STACK',
      'Kits: ' + kits + ' (' + kits * 200 + ' fichas)',
      'Jogadores: ' + players,
      'Rebuys: ' + rebuys,
      'Stacks totais: ' + stacks,
      buyIn > 0 ? 'Buy-in: R$ ' + buyIn + ',00' : null,
      '',
      'EM CADA STACK:',
      '1: ' + chipsPerDenom + ' fichas',
      '5: ' + chipsPerDenom + ' fichas',
      '10: ' + chipsPerDenom + ' fichas',
      '25: ' + chipsPerDenom + ' fichas',
      '50: ' + chipsPerDenom + ' fichas',
      'Fichas por stack: ' + stackChips,
      'Valor por stack: ' + stackValue,
      valorPorFicha ? 'Valor por ficha: R$ ' + valorPorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : null,
      'Sobras de cada denominacao: ' + leftovers,
    ].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(lines); alert('Distribuicao copiada!'); }
    catch { window.prompt('Copie:', lines); }
  };

  return (
    <main className="app-shell">
      <header>
        <div className="brand-icon">&#9824;</div>
        <div><h1>Poker Stack</h1><p>Calculadora de fichas</p></div>
      </header>
      <section className="intro">
        <span className="eyebrow">SEU JOGO, SUA DISTRIBUICAO</span>
        <h2>Monte os stacks em segundos.</h2>
        <p>Escolha os kits, os jogadores e quantos rebuys quer deixar reservados.</p>
      </section>
      <section className="panel controls">
        <label htmlFor="kits">Quantidade de kits</label>
        <select id="kits" value={kits} onChange={e => setKits(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'kit' : 'kits'} — {n * 200} fichas</option>
          ))}
        </select>
        <label>Jogadores</label>
        <div className="stepper">
          <button onClick={() => setPlayers(p => Math.max(2, p - 1))} disabled={players <= 2} aria-label="Diminuir">-</button>
          <div><strong>{players}</strong><small>jogadores</small></div>
          <button onClick={() => setPlayers(p => Math.min(39, p + 1))} disabled={players >= 39} aria-label="Aumentar">+</button>
        </div>
        <label>Stacks de rebuy</label>
        <div className="segmented">
          {[0,1,2,3].map(n => (
            <button key={n} className={rebuys === n ? 'active' : ''} onClick={() => setRebuys(n)}>
              {n === 0 ? 'sem rebuy' : n === 1 ? '1 rebuy' : n + ' rebuys'}
            </button>
          ))}
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
        {valorPorFicha && (
          <div className="por-ficha-row">
            <span>Valor por ficha</span>
            <strong>R$ {valorPorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong>
          </div>
        )}
      </section>
      <div className={'stack-quality quality-' + quality.level}>
        <span className="quality-icon">{quality.icon}</span>
        <span>{quality.text}</span>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div><span className="eyebrow">DISTRIBUICAO</span><h2>Em cada stack</h2></div>
          <span className="pill">{stackChips} fichas</span>
        </div>
        <div className="chip-list">
          {DENOMS.map(({ value, color, text }) => (
            <div className="chip-row" key={value}>
              <div className="chip" style={{ background: color, color: text }}>{value}</div>
              <div className="chip-info">
                <strong>{chipsPerDenom} {chipsPerDenom === 1 ? 'ficha' : 'fichas'}</strong>
                <span>Valor somado: {money(chipsPerDenom * value)}</span>
              </div>
              <div className="denom-total">
                <strong>{chipsPerDenom * stacks}</strong>
                <span>no total</span>
              </div>
            </div>
          ))}
        </div>
        <div className="total-row"><span>Valor total de cada stack</span><strong>{money(stackValue)}</strong></div>
      </section>
      <section className="panel leftovers">
        <div className="leftover-icon">+</div>
        <div>
          <strong>Sobras de cada valor: {leftovers}</strong>
          <p>As fichas que sobrarem de cada denominacao ficam fora dos stacks iniciais.</p>
        </div>
      </section>
      <button className="copy-button" onClick={copyResult}>Copiar distribuicao</button>
      <p className="footnote">Regra: cada kit tem 40 fichas de cada valor (1, 5, 10, 25 e 50). A calculadora divide igualmente entre todos os stacks, arredondando para baixo.</p>
    </main>
  );
}

function CashoutPage({ sharedBuyIn, sharedStackValue }) {
  const [buyIn, setBuyIn] = useState(sharedBuyIn > 0 ? String(sharedBuyIn) : '');
  const [stackVal, setStackVal] = useState(sharedStackValue > 0 ? String(sharedStackValue) : '');
  const [players, setPlayers] = useState([mkPlayer('Jogador 1'), mkPlayer('Jogador 2')]);

  useEffect(() => { if (sharedBuyIn > 0) setBuyIn(String(sharedBuyIn)); }, [sharedBuyIn]);
  useEffect(() => { if (sharedStackValue > 0) setStackVal(String(sharedStackValue)); }, [sharedStackValue]);

  const bi = parseFloat(buyIn) || 0;
  const sv = parseFloat(stackVal) || 0;
  const valorFicha = bi > 0 && sv > 0 ? bi / sv : 0;

  const addPlayer = () => setPlayers(p => [...p, mkPlayer('Jogador ' + (p.length + 1))]);
  const removePlayer = id => setPlayers(p => p.filter(pl => pl.id !== id));
  const update = (id, field, val) => setPlayers(p => p.map(pl => pl.id === id ? { ...pl, [field]: val } : pl));

  const results = players.map(pl => ({
    ...pl,
    chipsNum: parseFloat(pl.chips) || 0,
    payout: (parseFloat(pl.chips) || 0) * valorFicha,
  }));

  const totalPayout = results.reduce((s, r) => s + r.payout, 0);

  const copyResult = async () => {
    const lines = results.map(r => (r.name || 'Jogador') + ': ' + r.chipsNum + ' un. => R$ ' + brl(r.payout)).join('\n');
    const txt = 'ACERTO DE CONTAS\nBuy-in: R$ ' + brl(bi) + '\nStack inicial: ' + sv + ' un.\nValor/unidade: R$ ' + valorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '\n\n' + lines + '\n\nTotal: R$ ' + brl(totalPayout);
    try { await navigator.clipboard.writeText(txt); alert('Acerto copiado!'); }
    catch { window.prompt('Copie:', txt); }
  };

  return (
    <main className="app-shell">
      <header>
        <div className="brand-icon brand-icon--cashout">&#9827;</div>
        <div><h1>Acerto de Contas</h1><p>Pagamento final em dinheiro</p></div>
      </header>
      <section className="panel">
        <span className="eyebrow">CONFIGURACAO</span>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, margin: '6px 0 18px' }}>Parametros do jogo</h2>
        <label className="field-label" htmlFor="co-buyin">Buy-in por jogador</label>
        <div className="buyin-wrapper" style={{ marginBottom: 16 }}>
          <span>R$</span>
          <input id="co-buyin" type="number" min="0" step="1" value={buyIn} onChange={e => setBuyIn(e.target.value)} placeholder="Ex: 20" />
        </div>
        <label className="field-label" htmlFor="co-stack">Stack inicial (valor por stack na calculadora)</label>
        <div className="buyin-wrapper">
          <span>un.</span>
          <input id="co-stack" type="number" min="0" step="1" value={stackVal} onChange={e => setStackVal(e.target.value)} placeholder="Ex: 1456" />
        </div>
        <p className="cashout-hint">Valores importados automaticamente da aba Calculadora. Edite se necessario.</p>
        {valorFicha > 0 && (
          <div className="valor-ficha-badge">
            <span>Valor por unidade de ficha</span>
            <strong>R$ {valorFicha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div><span className="eyebrow">RESULTADO FINAL</span><h2>Fichas de cada jogador</h2></div>
          <button className="add-player-btn" onClick={addPlayer}>+ Jogador</button>
        </div>
        <div className="player-list">
          {results.map((pl, i) => (
            <div className="player-row" key={pl.id}>
              <div className="player-inputs">
                <input className="player-name" type="text" value={pl.name} onChange={e => update(pl.id, 'name', e.target.value)} placeholder={'Jogador ' + (i + 1)} />
                <input className="player-chips" type="number" min="0" value={pl.chips} onChange={e => update(pl.id, 'chips', e.target.value)} placeholder="unidades" />
              </div>
              <div className="player-result">
                <strong className={valorFicha > 0 && pl.chips !== '' ? 'payout-value' : 'payout-empty'}>
                  {valorFicha > 0 && pl.chips !== '' ? 'R$ ' + brl(pl.payout) : '—'}
                </strong>
                {players.length > 2 && (
                  <button className="remove-btn" onClick={() => removePlayer(pl.id)} aria-label="Remover">x</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {totalPayout > 0 && (
          <div className="cashout-total-row">
            <span>Total distribuído</span>
            <strong>R$ {brl(totalPayout)}</strong>
          </div>
        )}
      </section>
      <button className="copy-button" onClick={copyResult} disabled={valorFicha === 0}>Copiar acerto</button>
    </main>
  );
}

function App() {
  const [tab, setTab] = useState('calc');
  const [kits, setKits] = useState(1);
  const [players, setPlayers] = useState(4);
  const [rebuys, setRebuys] = useState(1);
  const [buyIn, setBuyIn] = useState(0);

  const stacks = players + rebuys;
  const stackValue = Math.floor(kits * 40 / stacks) * 91;

  return (
    <>
      <div style={{ display: tab === 'calc' ? 'block' : 'none' }}>
        <CalcPage kits={kits} setKits={setKits} players={players} setPlayers={setPlayers} rebuys={rebuys} setRebuys={setRebuys} buyIn={buyIn} setBuyIn={setBuyIn} />
      </div>
      <div style={{ display: tab === 'timer' ? 'block' : 'none' }}>
        <PokerTimePage sharedStackValue={stackValue} />
      </div>
      <div style={{ display: tab === 'cashout' ? 'block' : 'none' }}>
        <CashoutPage sharedBuyIn={buyIn} sharedStackValue={stackValue} />
      </div>
      <nav className="tab-bar">
        <button className={tab === 'calc' ? 'active' : ''} onClick={() => setTab('calc')}>
          <span>&#9824;</span> Calculadora
        </button>
        <button className={tab === 'timer' ? 'active' : ''} onClick={() => setTab('timer')}>
          <span>&#9200;</span> Poker Time
        </button>
        <button className={tab === 'cashout' ? 'active' : ''} onClick={() => setTab('cashout')}>
          <span>$</span> Acerto
        </button>
      </nav>
    </>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
