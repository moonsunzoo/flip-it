import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, History as HistoryIcon, AlertCircle, Sprout, ArrowUpRight } from 'lucide-react';
import { cardsForDeck, type Catalog } from './lib/content';
import { useProgress } from './lib/useProgress';
import { createSession } from './lib/study';
import { finishSession, putSession } from './lib/storage';
import { Home } from './components/Home';
import { Setup } from './components/Setup';
import { Study } from './components/Study';
import { Results } from './components/Results';
import { History } from './components/History';
import { EmptyState, deckPath, go } from './components/ui';

function currentRoute() {
  return window.location.hash.slice(1) || '/';
}
export default function App({ catalog }: { catalog: Catalog }) {
  const [route, setRoute] = useState(currentRoute);
  const { progress, setProgress, error, blocked, resetStorage } = useProgress();
  useEffect(() => {
    const change = () => setRoute(currentRoute());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [route]);
  const parts = route.split('/').filter(Boolean);
  const deck = parts[0] === 'deck' ? catalog.decks.find((item) => item.id === parts[1]) : undefined;
  const active = Object.hasOwn(progress.activeByDeck, parts[1])
    ? progress.activeByDeck[parts[1]]
    : undefined;
  const history = Object.hasOwn(progress.historyByDeck, parts[1])
    ? progress.historyByDeck[parts[1]]
    : undefined;
  const saved = history?.find((session) => session.id === parts[3]);
  let screen: ReactNode;
  if (route === '/') screen = <Home catalog={catalog} progress={progress} />;
  else if (route === '/history') screen = <History catalog={catalog} progress={progress} />;
  else if (parts[0] === 'deck' && parts[2] === 'history' && parts.length === 3 && (deck || history))
    screen = <History catalog={catalog} progress={progress} deckId={parts[1]} />;
  else if (parts[0] === 'deck' && parts[2] === 'history' && parts.length === 4 && saved)
    screen = (
      <Results
        session={saved}
        completed
        canRestart={!!deck}
        onComplete={() => {}}
        onReview={() => {}}
      />
    );
  else if (parts[0] === 'deck' && parts[2] === 'study' && parts.length === 3 && active)
    screen = (
      <Study
        key={active.id}
        session={active}
        contentVersion={catalog.contentVersion}
        update={(session) => setProgress((value) => putSession(value, session))}
      />
    );
  else if (parts[0] === 'deck' && parts[2] === 'results' && parts.length === 3 && active)
    screen = (
      <Results
        session={active}
        completed={false}
        canRestart={!!deck}
        onReview={(index) => {
          setProgress((value) => putSession(value, { ...active, currentIndex: index }));
          go(deckPath(active.deckId, 'study'));
        }}
        onComplete={() => {
          setProgress((value) => finishSession(value, active.deckId));
          go(deckPath(active.deckId, `history/${active.id}`));
        }}
      />
    );
  else if (deck && parts.length === 3 && ['setup', 'study', 'results'].includes(parts[2]))
    screen = (
      <Setup
        key={deck.id}
        catalog={catalog}
        deck={deck}
        active={active}
        onStart={(ids, order, visibilityPreset) => {
          const session = createSession({
            deckId: deck.id,
            deckTitle: deck.title,
            contentVersion: catalog.contentVersion,
            cards: cardsForDeck(catalog, deck).filter((card) => ids.includes(card.id)),
            order,
            visibilityPreset,
          });
          setProgress((value) => putSession(value, session));
          go(deckPath(deck.id, 'study'));
        }}
      />
    );
  else
    screen = (
      <EmptyState title="이 페이지를 찾을 수 없어요">
        <p>단어장이나 학습 기록이 변경되었을 수 있어요.</p>
        <a className="button primary" href="#/">
          단어장으로 돌아가기
        </a>
      </EmptyState>
    );

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="Know or Nope 홈">
          <span className="brand-mark">
            k<span>n</span>
          </span>
          <span>
            know or nope<span className="brand-dot">.</span>
          </span>
        </a>
        <nav aria-label="주 메뉴">
          <a
            href="#/"
            aria-current={route === '/' || (deck && parts[2] !== 'history') ? 'page' : undefined}
          >
            <BookOpen size={17} />
            <span>단어장</span>
          </a>
          <a href="#/history" aria-current={route.includes('history') ? 'page' : undefined}>
            <HistoryIcon size={17} />
            <span>나의 학습</span>
          </a>
        </nav>
        <span className="header-note">
          <span />
          오늘도, 한 장의 발견
        </span>
      </header>
      <main id="main" tabIndex={-1} className="main-shell">
        {error && (
          <div className="storage-warning" role="alert">
            <AlertCircle size={21} />
            <p>{error}</p>
            {blocked && (
              <button className="button secondary" onClick={resetStorage}>
                기록 초기화
              </button>
            )}
          </div>
        )}
        {screen}
      </main>
      <footer className="site-footer">
        <div>
          <Sprout size={19} />
          <strong>조금씩 알아가는 즐거움.</strong>
        </div>
        <span>학습 기록은 이 브라우저에만 저장돼요.</span>
        <a href="#/history">
          나의 기록
          <ArrowUpRight size={14} />
        </a>
      </footer>
    </>
  );
}
