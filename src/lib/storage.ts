import { z } from 'zod';
import { completedSessionSchema, sessionSchema, type Session } from './study';

// Keep the original key so the flip-it rename preserves existing sessions and history.
export const STORAGE_KEY = 'know-or-nope:progress:v1';
export const HISTORY_LIMIT = 20;
export const progressSchema = z
  .object({
    schemaVersion: z.literal(1),
    activeByDeck: z.record(z.string(), sessionSchema),
    historyByDeck: z.record(z.string(), z.array(completedSessionSchema).max(HISTORY_LIMIT)),
  })
  .refine(
    (state) =>
      Object.entries(state.activeByDeck).every(([deckId, session]) => deckId === session.deckId) &&
      Object.entries(state.historyByDeck).every(([deckId, history]) =>
        history.every((session) => session.deckId === deckId),
      ),
  );
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({
  schemaVersion: 1,
  activeByDeck: {},
  historyByDeck: {},
});
type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

export function loadProgress(storage: StorageReader): {
  progress: Progress;
  error: string | null;
  blocked: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      progress: raw ? progressSchema.parse(JSON.parse(raw)) : emptyProgress(),
      error: null,
      blocked: false,
    };
  } catch {
    return {
      progress: emptyProgress(),
      blocked: true,
      error:
        '저장된 기록을 읽을 수 없습니다. 기존 데이터는 덮어쓰지 않았습니다. 지금 학습한 내용은 기록을 초기화하기 전까지 이 화면에서만 유지됩니다.',
    };
  }
}

export function saveProgress(storage: StorageWriter, progress: Progress): string | null {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return null;
  } catch {
    return '브라우저에 기록을 저장하지 못했습니다. 지금은 학습할 수 있지만 창을 닫거나 새로고침하면 이번 변경이 사라질 수 있습니다.';
  }
}

export function finishSession(progress: Progress, deckId: string): Progress {
  const session = progress.activeByDeck[deckId];
  if (!session) return progress;
  const activeByDeck = { ...progress.activeByDeck };
  delete activeByDeck[deckId];
  const history = progress.historyByDeck[deckId] ?? [];
  return {
    ...progress,
    activeByDeck,
    historyByDeck: {
      ...progress.historyByDeck,
      [deckId]: [
        { ...session, completedAt: new Date().toISOString() },
        ...history.filter((entry) => entry.id !== session.id),
      ].slice(0, HISTORY_LIMIT),
    },
  };
}

export function putSession(progress: Progress, session: Session): Progress {
  return { ...progress, activeByDeck: { ...progress.activeByDeck, [session.deckId]: session } };
}
