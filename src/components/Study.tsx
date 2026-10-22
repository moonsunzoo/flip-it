import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Flag, RotateCcw, X } from 'lucide-react';
import type { Card } from '../lib/content';
import { rateCard, summarize, type Session, type Visibility } from '../lib/study';
import { BackLink, deckPath, go } from './ui';

function Visual({ card }: { card: Card }) {
  const [failed, setFailed] = useState(false);
  if (!card.visual || failed)
    return (
      <p className="image-fallback">
        {failed
          ? '그림을 불러오지 못했어요. 단어와 설명으로 학습해 주세요.'
          : '이 카드는 단어와 설명으로 알아봐요.'}
      </p>
    );
  return (
    <figure>
      <img
        src={`${import.meta.env.BASE_URL}${card.visual.src.slice(1)}`}
        alt={card.visual.alt}
        onError={() => setFailed(true)}
        loading="lazy"
      />
      <figcaption>{card.visual.attribution}</figcaption>
    </figure>
  );
}
function Region({
  name,
  visible,
  onToggle,
  children,
}: {
  name: string;
  visible: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`card-region ${visible ? '' : 'concealed'}`} aria-label={`${name} 영역`}>
      <div className="region-heading">
        <span>{name}</span>
        <button
          aria-label={`${name} ${visible ? '가리기' : '보이기'}`}
          aria-expanded={visible}
          onClick={onToggle}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          {visible ? '가리기' : '보이기'}
        </button>
      </div>
      {visible ? (
        children
      ) : (
        <button className="reveal-button" onClick={onToggle}>
          <span aria-hidden="true">•••</span>
          {name} 떠올려 보기<small>눌러서 확인하세요</small>
        </button>
      )}
    </section>
  );
}
export function Study({
  session,
  contentVersion,
  update,
}: {
  session: Session;
  contentVersion: string;
  update: (session: Session) => void;
}) {
  const card = session.cards[session.currentIndex];
  const [visibility, setVisibility] = useState<Visibility>({ ...session.visibilityPreset });
  useEffect(() => {
    setVisibility({ ...session.visibilityPreset });
  }, [session.id, session.currentIndex, session.visibilityPreset]);
  const summary = summarize(session);
  const rating = session.ratings[card.id];
  function toggle(region: keyof Visibility) {
    setVisibility((value) => ({ ...value, [region]: !value[region] }));
  }
  function move(delta: number) {
    update({
      ...session,
      currentIndex: Math.max(0, Math.min(session.cards.length - 1, session.currentIndex + delta)),
    });
  }
  return (
    <div className="study-page">
      <div className="study-top">
        <BackLink href={deckPath(session.deckId)}>설정으로</BackLink>
        <button className="text-button" onClick={() => go(deckPath(session.deckId, 'results'))}>
          <Flag size={16} />
          결과 보기
        </button>
      </div>
      <div className="study-title">
        <p className="eyebrow">ONE CARD AT A TIME</p>
        <h1 tabIndex={-1}>{session.deckTitle}</h1>
      </div>
      {session.contentVersion !== contentVersion && (
        <p className="notice" role="status">
          단어장 내용이 업데이트되었어요. 이번 회차는 시작할 때의 내용으로 이어가며, 새 회차에서
          최신 내용을 만날 수 있어요.
        </p>
      )}
      <div className="study-progress">
        <span>
          현재 카드 <strong>{session.currentIndex + 1}</strong> / {session.cards.length}
        </span>
        <span>
          판정 완료 <strong>{summary.rated}</strong> / {summary.total}
        </span>
      </div>
      <progress
        className="progress-bar"
        value={summary.rated}
        max={summary.total}
        aria-label="판정 완료"
      />
      <article
        className="study-card"
        key={`${session.id}-${card.id}`}
        data-testid="study-card"
        data-card-id={card.id}
      >
        <Region name="단어" visible={visibility.term} onToggle={() => toggle('term')}>
          <h2 className="study-term">{card.term}</h2>
          <p className="term-unit">{card.units.join(' · ')}</p>
        </Region>
        {card.visual && (
          <Region name="그림" visible={visibility.visual} onToggle={() => toggle('visual')}>
            <Visual key={card.id} card={card} />
          </Region>
        )}
        <Region name="설명" visible={visibility.definition} onToggle={() => toggle('definition')}>
          <p className="study-definition">{card.definition}</p>
          {card.example && (
            <blockquote>
              <span>예를 들면</span>
              {card.example}
            </blockquote>
          )}
        </Region>
        {!card.visual && (
          <p className="no-visual-note">그림 없이 단어와 설명으로 학습하는 카드예요.</p>
        )}
      </article>
      <div className="self-check">
        <p>이 개념, 얼마나 알고 있나요?</p>
        <div className="rating-actions">
          <button
            className="rating unknown"
            aria-pressed={rating === 'unknown'}
            onClick={() => update(rateCard(session, card.id, 'unknown'))}
          >
            <X size={21} />
            <span>
              모름<small>한 번 더</small>
            </span>
          </button>
          <button
            className="clear-rating"
            disabled={!rating}
            aria-label="판정 취소"
            onClick={() => update(rateCard(session, card.id, null))}
          >
            <RotateCcw size={18} />
            <span>판정 취소</span>
          </button>
          <button
            className="rating known"
            aria-pressed={rating === 'known'}
            onClick={() => update(rateCard(session, card.id, 'known'))}
          >
            <Check size={22} />
            <span>
              알고 있음<small>알겠어요</small>
            </span>
          </button>
        </div>
      </div>
      <nav className="card-navigation" aria-label="카드 탐색">
        <button
          className="button secondary"
          disabled={session.currentIndex === 0}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={17} />
          이전
        </button>
        <span className="small muted">판정 없이 넘어가도 괜찮아요.</span>
        {session.currentIndex < session.cards.length - 1 ? (
          <button className="button secondary" onClick={() => move(1)}>
            다음
            <ArrowRight size={17} />
          </button>
        ) : (
          <button
            className="button primary"
            onClick={() => go(deckPath(session.deckId, 'results'))}
          >
            결과 보기
            <ArrowRight size={17} />
          </button>
        )}
      </nav>
    </div>
  );
}
