import { ArrowLeft, ArrowUpRight, BookOpen, Layers3, Leaf, Shapes } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Deck } from '../lib/content';

export function go(path: string) {
  window.location.hash = path;
}
export function deckPath(deckId: string, screen = 'setup') {
  return `/deck/${deckId}/${screen}`;
}
export function BackLink({
  children = '단어장으로',
  href = '/',
}: {
  children?: ReactNode;
  href?: string;
}) {
  return (
    <a className="back-link" href={`#${href}`}>
      <ArrowLeft size={17} />
      {children}
    </a>
  );
}
export function DeckIcon({ deck }: { deck: Deck }) {
  const Icon = deck.subjectId === 'math' ? Shapes : deck.id === 'kor-parts' ? Layers3 : Leaf;
  return (
    <span
      className={`deck-icon ${deck.subjectId === 'math' ? 'sand' : deck.id === 'kor-parts' ? 'rose' : ''}`}
    >
      <Icon size={28} strokeWidth={1.5} />
    </span>
  );
}
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <BookOpen size={34} strokeWidth={1.4} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1 tabIndex={-1}>{title}</h1>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
export function NewStudyLink({ deckId }: { deckId: string }) {
  return (
    <a className="button primary" href={`#${deckPath(deckId)}`}>
      새로 학습하기
      <ArrowUpRight size={18} />
    </a>
  );
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
