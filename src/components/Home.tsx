import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Clock3, Sparkles } from 'lucide-react';
import { cardsForDeck, type Catalog } from '../lib/content';
import type { Progress } from '../lib/storage';
import { summarize } from '../lib/study';
import { DeckIcon, EmptyState, deckPath } from './ui';

export function Home({ catalog, progress }: { catalog: Catalog; progress: Progress }) {
  const [subject, setSubject] = useState('all');
  const decks = catalog.decks.filter((deck) => subject === 'all' || deck.subjectId === subject);
  const completed = Object.values(progress.historyByDeck).reduce(
    (count, history) => count + history.length,
    0,
  );
  return (
    <>
      <section id="subjects" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NEXT DISCOVERY</p>
            <h1 tabIndex={-1}>오늘은 무엇을 알아볼까요?</h1>
          </div>
          <span className="count-label">{catalog.decks.length}개의 단어장</span>
        </div>
        <div className="subject-tabs" aria-label="과목 선택">
          {[
            { id: 'all', name: '전체' },
            ...[...catalog.subjects].sort((a, b) => a.order - b.order),
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={subject === item.id}
              onClick={() => setSubject(item.id)}
            >
              {item.name}
              <span>
                {item.id === 'all'
                  ? catalog.decks.length
                  : catalog.decks.filter((deck) => deck.subjectId === item.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="deck-grid">
          {decks.map((deck, index) => {
            const cards = cardsForDeck(catalog, deck);
            const active = progress.activeByDeck[deck.id];
            const history = progress.historyByDeck[deck.id] ?? [];
            const rated = active ? summarize(active).rated : 0;
            return (
              <article
                className="deck-card"
                key={deck.id}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="deck-card-top">
                  <DeckIcon deck={deck} />
                  <span className="deck-level">{deck.level}</span>
                </div>
                <h3>
                  <a href={`#${deckPath(deck.id)}`}>{deck.title}</a>
                </h3>
                <p className="deck-description">{deck.description}</p>
                <div className="deck-tags">
                  {[...new Set(cards.flatMap((card) => card.units))].slice(0, 3).map((unit) => (
                    <span key={unit}>{unit}</span>
                  ))}
                </div>
                <div className="deck-meta">
                  <span>{cards.length}장의 개념 카드</span>
                  <span>
                    {history.length ? `${history.length}회 학습 완료` : '새롭게 알아보기'}
                  </span>
                </div>
                {active ? (
                  <>
                    <div className="deck-progress">
                      <span style={{ width: `${(rated / active.cards.length) * 100}%` }} />
                    </div>
                    <a className="deck-action" href={`#${deckPath(deck.id, 'study')}`}>
                      <span>
                        <Clock3 size={15} /> 이어서 학습 · {rated}/{active.cards.length}
                      </span>
                      <ArrowRight size={18} />
                    </a>
                  </>
                ) : (
                  <a className="deck-action" href={`#${deckPath(deck.id)}`}>
                    <span>학습 설정하기</span>
                    <ArrowUpRight size={20} />
                  </a>
                )}
              </article>
            );
          })}
        </div>
        {!decks.length && (
          <EmptyState title="아직 공개된 단어장이 없어요">
            <p>새로운 단어장이 준비되면 이곳에서 만날 수 있어요.</p>
          </EmptyState>
        )}
        <div className="learning-note">
          <span className="note-icon">
            <Sparkles size={22} />
          </span>
          <div>
            <strong>작은 발견을 모아, 나만의 지식으로.</strong>
            <p>
              {completed
                ? `지금까지 ${completed}번의 학습을 마쳤어요. 오늘도 한 장 더 알아볼까요?`
                : '정답을 맞히는 시험이 아니에요. 얼마나 알고 있는지, 나에게 솔직하게 답해 보세요.'}
            </p>
          </div>
          <span className="note-decoration" aria-hidden="true">
            ↗
          </span>
        </div>
        <p className="sample-note">
          현재 단어장은 기능 확인을 위한 샘플 콘텐츠입니다. 수업에 사용하기 전 교사의 내용 검수가
          필요합니다.
        </p>
      </section>
    </>
  );
}
