import { Check, ArrowRight, RotateCcw } from 'lucide-react';
import { summarize, type CompletedSession, type Session } from '../lib/study';
import { BackLink, NewStudyLink, PageIntro, deckPath, formatDate, go } from './ui';

export function Results({
  session,
  completed,
  onComplete,
  onReview,
  canRestart,
}: {
  session: Session | CompletedSession;
  completed: boolean;
  canRestart: boolean;
  onComplete: () => void;
  onReview: (index: number) => void;
}) {
  const summary = summarize(session);
  return (
    <div className="flow-page results-page">
      <BackLink href={completed ? '/history' : deckPath(session.deckId, 'study')}>
        {completed ? '학습 기록으로' : '학습으로 돌아가기'}
      </BackLink>
      <PageIntro
        eyebrow={completed ? 'A LITTLE MORE KNOWLEDGE' : 'LOOK HOW FAR YOU HAVE COME'}
        title={completed ? '오늘의 발견을 기록했어요.' : '지금까지 얼마나 알아봤을까요?'}
      >
        {session.deckTitle}
        {'completedAt' in session && ` · ${formatDate(session.completedAt)}`}
      </PageIntro>
      <section className="result-overview panel">
        <div className="result-ratio">
          <div
            className="ratio-ring"
            style={
              {
                '--ratio': `${summary.knownRate === null ? 0 : summary.knownRate * 100}%`,
              } as React.CSSProperties
            }
          >
            <strong>
              {summary.knownRate === null ? '—' : `${Math.round(summary.knownRate * 100)}%`}
            </strong>
          </div>
          <div>
            <h2>알고 있는 비율</h2>
            <p>
              판정한 {summary.rated}장 중 {summary.known}장을 알고 있어요.
            </p>
            <span className="small muted">
              전체 {summary.total}장 중 판정률 {Math.round(summary.ratingRate * 100)}%
            </span>
          </div>
        </div>
        <div className="result-counts">
          <div>
            <span>전체</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="text-green">
            <span>알고 있음</span>
            <strong>{summary.known}</strong>
          </div>
          <div className="text-rust">
            <span>모름</span>
            <strong>{summary.unknown}</strong>
          </div>
          <div>
            <span>미판정</span>
            <strong>{summary.unrated}</strong>
          </div>
        </div>
      </section>
      {!completed && (
        <div className="completion-panel">
          <div>
            <strong>여기서 마칠까요, 조금 더 알아볼까요?</strong>
            <p>
              {summary.unrated
                ? `아직 판정하지 않은 카드가 ${summary.unrated}장 있어요. 지금 완료해도 미판정으로 기록돼요.`
                : '완료 버튼을 눌러 이번 회차를 학습 기록에 남겨 주세요.'}
            </p>
          </div>
          <button className="button primary" onClick={onComplete}>
            <Check size={18} />
            학습 완료하고 기록 저장
          </button>
        </div>
      )}
      <div className="section-heading results-heading">
        <h2>한 장씩 돌아보기</h2>
        <span className="count-label">{summary.total}장의 발견</span>
      </div>
      <div className="result-list">
        {session.cards.map((card, index) => {
          const rating = session.ratings[card.id];
          return (
            <details key={card.id}>
              <summary>
                <span className="result-index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{card.term}</strong>
                <span className={`status-badge ${rating ?? ''}`}>
                  {rating === 'known' ? '알고 있음' : rating === 'unknown' ? '모름' : '미판정'}
                </span>
                <span className="details-plus" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="result-detail">
                <p>{card.definition}</p>
                {card.example && <blockquote>{card.example}</blockquote>}
                {!completed && (
                  <button className="text-button" onClick={() => onReview(index)}>
                    <RotateCcw size={15} />이 카드 다시 보기
                  </button>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <div className="bottom-actions">
        {completed && canRestart ? (
          <NewStudyLink deckId={session.deckId} />
        ) : !completed ? (
          <button
            className="button secondary"
            onClick={() => go(deckPath(session.deckId, 'study'))}
          >
            계속 학습하기
            <ArrowRight size={17} />
          </button>
        ) : (
          <a className="button secondary" href="#/">
            단어장으로
          </a>
        )}
      </div>
    </div>
  );
}
