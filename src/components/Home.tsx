import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Clock3, Sparkles } from 'lucide-react';
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
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="tiny-star">✳</span> LITTLE CARDS, BIG IDEAS
          </div>
          <h1 tabIndex={-1}>
            한 장씩 넘기면,
            <br />
            어느새 <span>내 지식.</span>
          </h1>
          <p>
            아는 건 가볍게, 모르는 건 한 번 더.
            <br />
            그림과 설명으로 개념을 만나고, 나의 이해를 확인해요.
          </p>
          <a
            className="button primary"
            href="#subjects"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            오늘의 학습 시작
            <ArrowRight size={18} />
          </a>
          <div className="hero-footnote">
            <Check size={14} /> 로그인 없이, 내 속도대로
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <span className="floating-star star-one">✳</span>
          <span className="floating-star star-two">✧</span>
          <div className="art-card art-back">
            <span>매일 조금씩.</span>
          </div>
          <div className="art-card art-front">
            <div className="art-card-top">
              <span>오늘의 발견</span>
              <span>01 / 08</span>
            </div>
            <div className="art-plant">
              <svg viewBox="0 0 200 140">
                <path d="M100 125V44" stroke="#365d49" strokeWidth="4" fill="none" />
                <path d="M100 100C49 109 35 60 45 49c41-4 59 20 55 51" fill="#94b590" />
                <path d="M100 72C99 23 145 8 164 22c-2 38-32 56-64 50" fill="#527b5f" />
                <path d="m48 54 52 46m0-28 60-46" stroke="#e8edcf" strokeWidth="2" />
                <ellipse cx="100" cy="128" rx="41" ry="5" fill="#d5d5bb" />
              </svg>
            </div>
            <span className="art-term">배움은 자라는 거니까</span>
            <div className="art-card-bottom">
              <span>한 장의 작은 시작</span>
              <span className="art-known">
                <Check size={13} /> Know!
              </span>
            </div>
          </div>
          <div className="art-note">
            몰라도 괜찮아.
            <br />
            <strong>지금 알아가면 되니까!</strong>
          </div>
        </div>
      </section>

      <section id="subjects" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NEXT DISCOVERY</p>
            <h2>오늘은 무엇을 알아볼까요?</h2>
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
