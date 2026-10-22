import { describe, expect, it } from 'vitest';
import catalogData from '../content/catalog.json';
import { cardsForDeck, parseCatalog } from './content';
import {
  createSession,
  DEFAULT_VISIBILITY,
  rateCard,
  sessionSchema,
  shuffle,
  summarize,
} from './study';
import {
  emptyProgress,
  finishSession,
  HISTORY_LIMIT,
  loadProgress,
  progressSchema,
  putSession,
  saveProgress,
  STORAGE_KEY,
} from './storage';

const catalog = parseCatalog(catalogData);
const deck = catalog.decks[0];
const cards = cardsForDeck(catalog, deck);
function newSession(selected = cards) {
  return createSession({
    deckId: deck.id,
    deckTitle: deck.title,
    contentVersion: catalog.contentVersion,
    cards: selected,
    order: 'alphabetical',
    visibilityPreset: DEFAULT_VISIBILITY,
  });
}

describe('published catalog boundary', () => {
  it('validates all sample decks and their referenced cards', () => {
    expect(catalog.cards).toHaveLength(150);
    expect(catalog.decks).toHaveLength(3);
    for (const sampleDeck of catalog.decks) {
      const sampleCards = cardsForDeck(catalog, sampleDeck);
      expect(sampleCards).toHaveLength(50);
      expect(new Set(sampleCards.map((card) => card.term)).size).toBe(50);
    }
    expect(catalog.cards.every((card) => card.term && card.definition)).toBe(true);
  });
  it('rejects drafts, dangling references and duplicate card identities', () => {
    const draft = structuredClone(catalogData);
    draft.decks[0].published = false;
    expect(() => parseCatalog(draft)).toThrow();
    const missing = structuredClone(catalogData);
    missing.decks[0].cardIds.push('missing-card');
    expect(() => parseCatalog(missing)).toThrow();
    const duplicate = structuredClone(catalogData);
    duplicate.cards.push(duplicate.cards[0]);
    expect(() => parseCatalog(duplicate)).toThrow();
  });
  it('rejects cards not referenced by a public deck', () => {
    const orphan = structuredClone(catalogData);
    orphan.cards.push({ ...orphan.cards[0], id: 'orphan' });
    expect(() => parseCatalog(orphan)).toThrow();
  });
  it('allows image-free cards and deduplicates deck membership', () => {
    expect(catalog.cards.some((card) => !card.visual)).toBe(true);
    expect(
      cardsForDeck(catalog, { ...deck, cardIds: [...deck.cardIds, deck.cardIds[0]] }),
    ).toHaveLength(cards.length);
  });
});

describe('study sessions', () => {
  it('starts new sessions with only the term visible', () => {
    expect(newSession().visibilityPreset).toEqual({
      term: true,
      visual: false,
      definition: false,
    });
  });
  it('rejects zero cards and an entirely hidden initial preset', () => {
    expect(() => newSession([])).toThrow();
    expect(() =>
      createSession({
        ...newSession(),
        order: 'random',
        visibilityPreset: { term: false, visual: false, definition: false },
      }),
    ).toThrow();
  });
  it('shuffles without replacing, dropping or mutating cards', () => {
    const input = [1, 2, 3, 4];
    const result = shuffle(input, () => 0);
    expect(result).toEqual([2, 3, 4, 1]);
    expect([...result].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });
  it('stores the chosen order, selected scope and content snapshot', () => {
    const selected = structuredClone(cards.slice(0, 4));
    const session = newSession(selected);
    expect(session.cards).toHaveLength(4);
    expect(session.cards.map((card) => card.term)).toEqual(
      selected.map((card) => card.term).sort((a, b) => a.localeCompare(b, 'ko')),
    );
    selected[0].definition = '바뀐 정의';
    expect(session.cards.find((card) => card.id === selected[0].id)?.definition).not.toBe(
      '바뀐 정의',
    );
  });
  it('replaces and cancels a rating without double counting', () => {
    let session = newSession();
    session = rateCard(session, cards[0].id, 'unknown');
    session = rateCard(session, cards[0].id, 'known');
    expect(summarize(session)).toMatchObject({ known: 1, unknown: 0, rated: 1 });
    session = rateCard(session, cards[0].id, null);
    expect(summarize(session)).toMatchObject({ known: 0, unknown: 0, rated: 0, knownRate: null });
  });
  it('calculates 3 known, 2 unknown and 1 unrated with the rated denominator', () => {
    let session = newSession(cards.slice(0, 6));
    session.cards.slice(0, 3).forEach((card) => {
      session = rateCard(session, card.id, 'known');
    });
    session.cards.slice(3, 5).forEach((card) => {
      session = rateCard(session, card.id, 'unknown');
    });
    expect(summarize(session)).toEqual({
      total: 6,
      known: 3,
      unknown: 2,
      unrated: 1,
      rated: 5,
      ratingRate: 5 / 6,
      knownRate: 3 / 5,
    });
  });
  it('rejects invalid positions, foreign ratings and duplicate cards during restore', () => {
    const session = newSession();
    expect(sessionSchema.safeParse({ ...session, currentIndex: 999 }).success).toBe(false);
    expect(sessionSchema.safeParse({ ...session, ratings: { missing: 'known' } }).success).toBe(
      false,
    );
    expect(sessionSchema.safeParse({ ...session, cards: [cards[0], cards[0]] }).success).toBe(
      false,
    );
    expect(() => rateCard(session, 'missing', 'known')).toThrow();
  });
});

describe('local progress and immutable history', () => {
  it('restores random order, current position and ratings exactly', () => {
    let session = createSession({ ...newSession(), order: 'random' });
    session = { ...rateCard(session, session.cards[0].id, 'known'), currentIndex: 2 };
    const progress = putSession(emptyProgress(), session);
    const storage = new Map<string, string>();
    expect(saveProgress({ setItem: (key, value) => storage.set(key, value) }, progress)).toBeNull();
    expect(loadProgress({ getItem: (key) => storage.get(key) ?? null }).progress).toEqual(progress);
  });
  it('finishes only explicitly and does not duplicate completed history', () => {
    const session = newSession();
    const progress = putSession(emptyProgress(), {
      ...session,
      currentIndex: session.cards.length - 1,
    });
    expect(progress.historyByDeck[deck.id]).toBeUndefined();
    const finished = finishSession(progress, deck.id);
    expect(finished.activeByDeck[deck.id]).toBeUndefined();
    expect(finished.historyByDeck[deck.id]).toHaveLength(1);
    expect(finishSession(finished, deck.id)).toEqual(finished);
  });
  it('keeps two decks independent, including completion and previous results', () => {
    const first = newSession();
    const second = { ...newSession(), deckId: 'math', id: 'second' };
    const both = putSession(putSession(emptyProgress(), first), second);
    const finished = finishSession(both, first.deckId);
    expect(finished.activeByDeck.math).toEqual(second);
    expect(finished.historyByDeck[first.deckId][0].cards).toEqual(first.cards);
    const updated = putSession(finished, newSession());
    expect(updated.historyByDeck).toEqual(finished.historyByDeck);
  });
  it('retains only the most recent 20 results per deck', () => {
    let progress = emptyProgress();
    for (let i = 0; i < 25; i++)
      progress = finishSession(putSession(progress, newSession()), deck.id);
    expect(progress.historyByDeck[deck.id]).toHaveLength(HISTORY_LIMIT);
    expect(progressSchema.safeParse(progress).success).toBe(true);
  });
  it('distinguishes empty storage, malformed records and unknown versions', () => {
    expect(loadProgress({ getItem: () => null }).blocked).toBe(false);
    expect(loadProgress({ getItem: () => '{bad json' }).blocked).toBe(true);
    expect(
      loadProgress({ getItem: () => JSON.stringify({ ...emptyProgress(), schemaVersion: 2 }) })
        .blocked,
    ).toBe(true);
    expect(
      loadProgress({
        getItem: () => {
          throw new Error('denied');
        },
      }).error,
    ).toBeTruthy();
  });
  it('reports write failures and rejects mismatched deck storage', () => {
    expect(
      saveProgress(
        {
          setItem: () => {
            throw new Error('quota exceeded');
          },
        },
        emptyProgress(),
      ),
    ).toContain('저장하지 못했습니다');
    expect(
      progressSchema.safeParse({ ...emptyProgress(), activeByDeck: { wrong: newSession() } })
        .success,
    ).toBe(false);
    expect(STORAGE_KEY).toContain('v1');
  });
});
