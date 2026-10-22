import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { Progress } from '../lib/storage';
import type { Catalog } from '../lib/content';
import { summarize } from '../lib/study';
import { BackLink, EmptyState, PageIntro, deckPath, formatDate } from './ui';

export function History({
  progress,
  catalog,
  deckId,
}: {
  progress: Progress;
  catalog: Catalog;
  deckId?: string;
}) {
  const history = (
    deckId
      ? [...(progress.historyByDeck[deckId] ?? [])]
      : Object.values(progress.historyByDeck).flat()
  ).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const active = Object.values(progress.activeByDeck).filter(
    (session) => !deckId || session.deckId === deckId,
  );
  const deck = catalog.decks.find((item) => item.id === deckId);
  return (
    <div className="flow-page">
      <BackLink href={deck ? deckPath(deck.id) : '/'} />
      <PageIntro
        eyebrow="YOUR LITTLE ACHIEVEMENTS"
        title={deck ? `${deck.title}의 학습 기록` : '차곡차곡, 나의 학습 기록'}
      >
        작은 발견이 쌓이는 곳. 단어장별 최근 20회까지 기록해요.
      </PageIntro>
      {active.length > 0 && (
        <section className="history-section">
          <h2>이어서 알아보기</h2>
          {active.map((session) => (
            <a
              className="history-row active-history"
              key={session.id}
              href={`#${deckPath(session.deckId, 'study')}`}
            >
              <Clock3 size={21} />
              <div>
                <strong>{session.deckTitle}</strong>
                <p>
                  판정 완료 {summarize(session).rated} / {session.cards.length}
                </p>
              </div>
              <span>
                이어하기
                <ArrowUpRight size={17} />
              </span>
            </a>
          ))}
        </section>
      )}
      <section className="history-section">
        <h2>
          완료한 학습 <span className="muted">{history.length}</span>
        </h2>
        {history.length ? (
          <div>
            {history.map((session) => {
              const stats = summarize(session);
              return (
                <a
                  className="history-row"
                  key={session.id}
                  href={`#${deckPath(session.deckId, `history/${session.id}`)}`}
                >
                  <span className="history-check" aria-hidden="true">
                    ✓
                  </span>
                  <div>
                    <strong>{session.deckTitle}</strong>
                    <p>
                      {formatDate(session.completedAt)} · {stats.total}장
                    </p>
                  </div>
                  <div className="history-count">
                    <strong>
                      {stats.knownRate === null ? '—' : `${Math.round(stats.knownRate * 100)}%`}
                    </strong>
                    <small>알고 있는 비율</small>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
              );
            })}
          </div>
        ) : (
          <EmptyState title="첫 번째 발견을 기다리고 있어요">
            <p>학습 후 완료 버튼을 누르면 여기에 기록돼요.</p>
            <a className="button primary" href="#/">
              단어장 둘러보기
              <ArrowUpRight size={17} />
            </a>
          </EmptyState>
        )}
      </section>
      <p className="storage-note">
        기록은 현재 브라우저에만 보관됩니다. 브라우저 데이터 삭제, 시크릿 모드 종료, 기기 변경 시
        복원되지 않을 수 있어요. 여러 탭에서 동시에 학습하면 마지막 저장 내용이 남습니다.
      </p>
    </div>
  );
}
