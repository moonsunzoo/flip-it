import { z } from 'zod';

const id = z.string().regex(/^[a-zA-Z0-9_-]+$/);
const text = z.string().trim().min(1);
export const visualSchema = z.object({
  src: z.string().regex(/^\/visuals\/[a-z0-9-]+\.svg$/),
  alt: text,
  attribution: text,
});
export const cardSchema = z.object({
  id,
  revision: z.number().int().positive(),
  term: text,
  definition: text,
  example: text.optional(),
  units: z.array(text).min(1),
  visual: visualSchema.optional(),
});
const deckSchema = z.object({
  id,
  subjectId: id,
  title: text,
  description: text,
  published: z.literal(true),
  cardIds: z.array(id),
  level: text,
});
const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: text,
    subjects: z.array(z.object({ id, name: text, order: z.number().int() })),
    decks: z.array(deckSchema),
    cards: z.array(cardSchema),
  })
  .strict()
  .superRefine((catalog, ctx) => {
    for (const [kind, entries] of [
      ['subjects', catalog.subjects],
      ['decks', catalog.decks],
      ['cards', catalog.cards],
    ] as const) {
      if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
        ctx.addIssue({ code: 'custom', message: `${kind}: 중복 ID가 있습니다.` });
      }
    }
    const subjects = new Set(catalog.subjects.map((subject) => subject.id));
    const cards = new Set(catalog.cards.map((card) => card.id));
    const referenced = new Set(catalog.decks.flatMap((deck) => deck.cardIds));
    for (const deck of catalog.decks) {
      if (!subjects.has(deck.subjectId) || deck.cardIds.some((cardId) => !cards.has(cardId))) {
        ctx.addIssue({
          code: 'custom',
          message: `${deck.id}: 존재하지 않는 과목 또는 카드입니다.`,
        });
      }
    }
    if (catalog.cards.some((card) => !referenced.has(card.id))) {
      ctx.addIssue({ code: 'custom', message: '공개 단어장에 포함되지 않은 카드가 있습니다.' });
    }
  });

export type Card = z.infer<typeof cardSchema>;
export type Deck = z.infer<typeof deckSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export function parseCatalog(input: unknown): Catalog {
  return catalogSchema.parse(input);
}
export function cardsForDeck(catalog: Catalog, deck: Deck): Card[] {
  const byId = new Map(catalog.cards.map((card) => [card.id, card]));
  return [...new Set(deck.cardIds)].map((cardId) => byId.get(cardId)!);
}
