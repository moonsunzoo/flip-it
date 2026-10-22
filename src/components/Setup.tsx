import { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Shuffle, ArrowDownAZ } from 'lucide-react';
import { cardsForDeck, type Catalog, type Deck } from '../lib/content';
import { DEFAULT_VISIBILITY, type Order, type Session, type Visibility } from '../lib/study';
import { BackLink, DeckIcon, deckPath, go } from './ui';

type Scope = 'all' | 'units' | 'cards';
export function Setup({
  catalog,
  deck,
  active,
  onStart,
}: {
  catalog: Catalog;
  deck: Deck;
  active?: Session;
  onStart: (cards: string[], order: Order, visibility: Visibility) => void;
}) {
  const cards = cardsForDeck(catalog, deck);
  const units = [...new Set(cards.flatMap((card) => card.units))];
  const [scope, setScope] = useState<Scope>('all');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(units);
  const [selectedCards, setSelectedCards] = useState<string[]>(cards.map((card) => card.id));
  const [order, setOrder] = useState<Order>('random');
  const [visibility, setVisibility] = useState<Visibility>({ ...DEFAULT_VISIBILITY });
  const selected = cards.filter(
    (card) =>
      scope === 'all' ||
      (scope === 'units'
        ? card.units.some((unit) => selectedUnits.includes(unit))
        : selectedCards.includes(card.id)),
  );
  const visible = Object.values(visibility).some(Boolean);
  const noVisibleContent =
    !visibility.term && !visibility.definition && selected.some((card) => !card.visual);
  const invalidReason = !selected.length
    ? '학습할 카드를 한 장 이상 선택해 주세요.'
    : !visible
      ? '처음 보일 영역을 한 개 이상 선택해 주세요.'
      : noVisibleContent
        ? '그림 없는 카드가 포함되어 있어요. 단어 또는 설명도 처음 보이도록 설정해 주세요.'
        : '';
  function toggle(values: string[], value: string) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }
  function start() {
    if (invalidReason) return;
    if (
      active &&
      !window.confirm(
        '진행 중인 회차를 새 학습으로 교체할까요? 완료하지 않은 현재 회차의 판정은 사라집니다.',
      )
    )
      return;
    onStart(
      selected.map((card) => card.id),
      order,
      visibility,
    );
  }
  return (
    <div className="flow-page">
      <BackLink />
      <div className="setup-heading">
        <DeckIcon deck={deck} />
        <div>
          <p className="eyebrow">READY WHEN YOU ARE</p>
          <h1 tabIndex={-1}>{deck.title}</h1>
          <p className="muted">오늘의 학습을 내게 맞게 준비해요.</p>
        </div>
      </div>
      {active && (
        <div className="resume-banner">
          <div>
            <strong>아직 마치지 않은 학습이 있어요.</strong>
            <p>
              {active.cards.length}장 중 {active.currentIndex + 1}번째 카드에서 이어갈 수 있어요.
            </p>
          </div>
          <button className="button secondary" onClick={() => go(deckPath(deck.id, 'study'))}>
            이어서 학습
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="setup-grid">
        <div className="setup-sections">
          <section className="panel">
            <h2>
              <span className="step-number">01</span>어디까지 알아볼까요?
            </h2>
            <div className="segmented" aria-label="학습 범위">
              {(
                [
                  ['all', '전체 카드'],
                  ['units', '주제별 선택'],
                  ['cards', '직접 선택'],
                ] as const
              ).map(([value, label]) => (
                <button key={value} aria-pressed={scope === value} onClick={() => setScope(value)}>
                  {label}
                </button>
              ))}
            </div>
            {scope === 'all' && (
              <p className="setting-description">
                이 단어장의 개념 카드 {cards.length}장을 모두 학습해요.
              </p>
            )}
            {scope === 'units' && (
              <div className="selection-list">
                {units.map((unit) => (
                  <label key={unit}>
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(unit)}
                      onChange={() => setSelectedUnits(toggle(selectedUnits, unit))}
                    />
                    <span>{unit}</span>
                    <small>{cards.filter((card) => card.units.includes(unit)).length}장</small>
                  </label>
                ))}
              </div>
            )}
            {scope === 'cards' && (
              <>
                <div className="select-actions">
                  <button onClick={() => setSelectedCards(cards.map((card) => card.id))}>
                    모두 선택
                  </button>
                  <button onClick={() => setSelectedCards([])}>모두 해제</button>
                </div>
                <div className="selection-list card-selection">
                  {cards.map((card) => (
                    <label key={card.id}>
                      <input
                        type="checkbox"
                        checked={selectedCards.includes(card.id)}
                        onChange={() => setSelectedCards(toggle(selectedCards, card.id))}
                      />
                      <span>{card.term}</span>
                      <small>{card.units.join(' · ')}</small>
                    </label>
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">02</span>어떤 순서로 볼까요?
            </h2>
            <div className="order-options">
              {(
                [
                  {
                    value: 'random',
                    title: '무작위',
                    description: '새로운 순서로 만나요',
                    Icon: Shuffle,
                  },
                  {
                    value: 'alphabetical',
                    title: '가나다순',
                    description: '차근차근 살펴봐요',
                    Icon: ArrowDownAZ,
                  },
                ] as const
              ).map(({ value, title, description, Icon }) => (
                <button
                  className="choice-card"
                  key={value}
                  aria-pressed={order === value}
                  onClick={() => setOrder(value)}
                >
                  <Icon size={22} />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  {order === value && <Check size={17} />}
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">03</span>처음에 무엇을 보여줄까요?
            </h2>
            <p className="setting-description">가려둔 영역은 학습 중 언제든 열어볼 수 있어요.</p>
            <div className="visibility-options">
              {(
                [
                  ['term', '단어'],
                  ['visual', '그림'],
                  ['definition', '설명'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={visibility[key]}
                  onClick={() => setVisibility({ ...visibility, [key]: !visibility[key] })}
                >
                  {visibility[key] ? <Eye size={20} /> : <EyeOff size={20} />}
                  <strong>{label}</strong>
                  <small>{visibility[key] ? '처음부터 표시' : '가려두기'}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="setup-summary panel">
          <p className="eyebrow">YOUR STUDY PLAN</p>
          <h2>오늘의 작은 목표</h2>
          <div className="summary-count">
            {selected.length}
            <span>장의 카드</span>
          </div>
          <dl>
            <div>
              <dt>학습 순서</dt>
              <dd>{order === 'random' ? '무작위' : '가나다순'}</dd>
            </div>
            <div>
              <dt>처음 보이는 영역</dt>
              <dd>
                {(
                  [
                    ['term', '단어'],
                    ['visual', '그림'],
                    ['definition', '설명'],
                  ] as const
                )
                  .filter(([key]) => visibility[key])
                  .map(([, label]) => label)
                  .join(' · ') || '없음'}
              </dd>
            </div>
          </dl>
          <p className="small muted">
            조급할 필요 없어요.
            <br />한 장씩, 나의 속도로 알아가면 돼요.
          </p>
          {invalidReason && (
            <p className="inline-error" role="status">
              {invalidReason}
            </p>
          )}
          <button className="button primary" onClick={start} disabled={!!invalidReason}>
            학습 시작하기
            <ArrowRight size={18} />
          </button>
          <a className="text-link" href={`#${deckPath(deck.id, 'history')}`}>
            이 단어장 학습 기록
          </a>
        </aside>
      </div>
    </div>
  );
}
