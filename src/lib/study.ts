import { z } from 'zod';
import { cardSchema, type Card } from './content';

export const visibilitySchema = z.object({
  term: z.boolean(),
  visual: z.boolean(),
  definition: z.boolean(),
});
export type Visibility = z.infer<typeof visibilitySchema>;
export const DEFAULT_VISIBILITY: Visibility = { term: false, visual: true, definition: true };
export const ratingSchema = z.enum(['known', 'unknown']);
export type Rating = z.infer<typeof ratingSchema>;
export type Order = 'random' | 'alphabetical';
const sessionFields = {
  id: z.string().min(1),
  deckId: z.string().min(1),
  deckTitle: z.string().min(1),
  contentVersion: z.string().min(1),
  startedAt: z.iso.datetime(),
  cards: z.array(cardSchema).min(1),
  currentIndex: z.number().int().nonnegative(),
  visibilityPreset: visibilitySchema,
  ratings: z.record(z.string(), ratingSchema),
  order: z.enum(['random', 'alphabetical']),
};
const sessionBase = z.object(sessionFields);
function validSession(session: z.infer<typeof sessionBase>) {
  const ids = new Set(session.cards.map((card) => card.id));
  return (
    ids.size === session.cards.length &&
    session.currentIndex < session.cards.length &&
    Object.keys(session.ratings).every((key) => ids.has(key)) &&
    Object.values(session.visibilityPreset).some(Boolean)
  );
}
export const sessionSchema = sessionBase.refine(
  validSession,
  '학습 회차 데이터가 올바르지 않습니다.',
);
export const completedSessionSchema = sessionBase
  .extend({ completedAt: z.iso.datetime() })
  .refine(validSession);
export type Session = z.infer<typeof sessionSchema>;
export type CompletedSession = z.infer<typeof completedSessionSchema>;

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createSession(
  input: {
    deckId: string;
    deckTitle: string;
    contentVersion: string;
    cards: Card[];
    order: Order;
    visibilityPreset: Visibility;
  },
  random = Math.random,
): Session {
  if (!input.cards.length) throw new Error('학습할 카드를 한 장 이상 선택해 주세요.');
  if (!Object.values(input.visibilityPreset).some(Boolean))
    throw new Error('처음 보일 영역을 한 개 이상 선택해 주세요.');
  const uniqueCards = [...new Map(input.cards.map((card) => [card.id, card])).values()];
  const cards =
    input.order === 'random'
      ? shuffle(uniqueCards, random)
      : uniqueCards.sort((a, b) => a.term.localeCompare(b.term, 'ko'));
  return sessionSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    cards: structuredClone(cards),
    currentIndex: 0,
    ratings: {},
  });
}

export function rateCard(session: Session, cardId: string, rating: Rating | null): Session {
  if (!session.cards.some((card) => card.id === cardId)) throw new Error('회차에 없는 카드입니다.');
  const ratings = { ...session.ratings };
  if (rating) ratings[cardId] = rating;
  else delete ratings[cardId];
  return { ...session, ratings };
}

export function summarize(session: Pick<Session, 'cards' | 'ratings'>) {
  const total = session.cards.length;
  const known = session.cards.filter((card) => session.ratings[card.id] === 'known').length;
  const unknown = session.cards.filter((card) => session.ratings[card.id] === 'unknown').length;
  const rated = known + unknown;
  return {
    total,
    known,
    unknown,
    unrated: total - rated,
    rated,
    ratingRate: total ? rated / total : 0,
    knownRate: rated ? known / rated : null,
  };
}
