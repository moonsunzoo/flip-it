import { expect, test, type Page } from '@playwright/test';

const literature = './#/deck/kor-literature/setup';
const storageKey = 'know-or-nope:progress:v1';
async function toVisibility(page: Page) {
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
}
async function finishSetup(page: Page) {
  await toVisibility(page);
  await page.getByRole('button', { name: '학습 시작하기', exact: true }).click();
}
async function start(page: Page) {
  await page.goto(literature);
  await finishSetup(page);
  await expect(page.getByTestId('study-card')).toBeVisible();
}
async function readProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), storageKey);
}
async function selectPictureCard(page: Page) {
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await page.getByLabel('정삼각형').check();
}

test('catalog filters by subject and opens settings before studying', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle(/^flip-it/);
  await expect(page.getByRole('link', { name: 'flip-it 홈' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('오늘은 무엇을 알아볼까요?');
  await expect(page.locator('.hero')).toHaveCount(0);
  await expect(page.getByText('로그인 없이, 내 속도대로')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '오늘의 학습 시작' })).toHaveCount(0);
  await expect(page.locator('.deck-card')).toHaveCount(3);
  await expect(page.getByText('50장의 개념 카드', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: '수학' }).click();
  await expect(page.locator('.deck-card')).toHaveCount(1);
  await page.getByRole('link', { name: '학습 설정하기' }).click();
  await expect(page).toHaveURL(/setup$/);
  await expect(page.getByRole('heading', { name: '어디까지 알아볼까요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '단어 처음부터 표시' })).toHaveCount(0);
  await toVisibility(page);
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '단어 처음부터 표시' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const name of ['그림 가려두기', '설명 가려두기']) {
    await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
  }
  await expect(page.getByTestId('study-card')).toHaveCount(0);
});

test('zero cards and empty initial visibility are blocked; selected topics form the session', async ({
  page,
}) => {
  await page.goto(literature);
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await expect(page.getByRole('button', { name: '다음', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '주제별 선택' }).click();
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.uncheck();
  await page.getByLabel('비유').check();
  await toVisibility(page);
  await page.getByRole('button', { name: '단어 처음부터 표시' }).click();
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeDisabled();
  await page.getByRole('button', { name: '설명 가려두기' }).click();
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  const progress = await readProgress(page);
  expect(progress.activeByDeck['kor-literature'].cards).toHaveLength(4);
  expect(
    progress.activeByDeck['kor-literature'].cards.every((card: { units: string[] }) =>
      card.units.includes('비유'),
    ),
  ).toBe(true);
});

test('toggles are independent, preset resets on navigation, rating replacement and reload persist', async ({
  page,
}) => {
  await start(page);
  await expect(page.getByRole('button', { name: '단어 가리기', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '설명 보이기', exact: true }).click();
  await expect(page.getByRole('button', { name: '단어 가리기', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '단어 가리기', exact: true }).click();
  await expect(page.getByRole('button', { name: '설명 가리기', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '모름 한 번 더' }).click();
  await page.getByRole('button', { name: '알고 있음 알겠어요' }).click();
  await expect(page.getByRole('button', { name: '알고 있음 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('button', { name: '단어 가리기', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '설명 보이기', exact: true })).toBeVisible();
  const before = await readProgress(page);
  const currentId = await page.getByTestId('study-card').getAttribute('data-card-id');
  await page.reload();
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', currentId!);
  expect(await readProgress(page)).toEqual(before);
  await page.getByRole('button', { name: '이전', exact: true }).click();
  await expect(page.getByRole('button', { name: '알고 있음 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '판정 취소', exact: true }).click();
  await expect(page.getByRole('button', { name: '알고 있음 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('last card and results do not finish automatically; explicit completion is recorded once', async ({
  page,
}) => {
  await page.goto(literature);
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await page.getByLabel('과장법').check();
  await finishSetup(page);
  await expect(page.getByText('그림 없이 단어와 설명으로 학습하는 카드예요.')).toBeVisible();
  expect((await readProgress(page)).historyByDeck).toEqual({});
  await page.getByRole('button', { name: '결과 보기', exact: true }).first().click();
  await expect(page.locator('.ratio-ring')).toHaveText('—');
  expect((await readProgress(page)).historyByDeck).toEqual({});
  await page.getByRole('button', { name: '학습 완료하고 기록 저장' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('기록했어요');
  await page.reload();
  const progress = await readProgress(page);
  expect(progress.historyByDeck['kor-literature']).toHaveLength(1);
  expect(progress.activeByDeck['kor-literature']).toBeUndefined();
  await page.getByRole('link', { name: '나의 학습', exact: true }).click();
  await expect(page.locator('.history-row')).toHaveCount(1);
});

test('different decks retain their own active sessions and replacing a session requires confirmation', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: '모름 한 번 더' }).click();
  await page.goto('./#/deck/math-geometry/setup');
  await finishSetup(page);
  await page.getByRole('button', { name: '알고 있음 알겠어요' }).click();
  expect(Object.keys((await readProgress(page)).activeByDeck)).toHaveLength(2);
  await page.goto(literature);
  const original = (await readProgress(page)).activeByDeck['kor-literature'].id;
  await toVisibility(page);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  await expect(page).toHaveURL(/setup$/);
  expect((await readProgress(page)).activeByDeck['kor-literature'].id).toBe(original);
  await page.getByRole('button', { name: '이어서 학습', exact: true }).click();
  await expect(page.getByRole('button', { name: '모름 한 번 더' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('malformed local records are preserved and storage write failures are visible', async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken record'), storageKey);
  await start(page);
  await expect(page.getByRole('alert')).toContainText('기존 데이터는 덮어쓰지 않았습니다');
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(
    '{broken record',
  );
});

test('quota failures warn while the current session remains usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await start(page);
  await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await page.getByRole('button', { name: '알고 있음 알겠어요' }).click();
  await expect(page.getByRole('button', { name: '알고 있음 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('broken images have a fallback and all primary screens fit the viewport', async ({ page }) => {
  await page.route('**/visuals/**', (route) => route.fulfill({ status: 404, body: '' }));
  for (const path of ['./', './#/deck/math-geometry/setup']) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await selectPictureCard(page);
  await finishSetup(page);
  await page.getByRole('button', { name: '그림 보이기', exact: true }).click();
  await expect(
    page.getByText('그림을 불러오지 못했어요. 단어와 설명으로 학습해 주세요.'),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '결과 보기', exact: true }).first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('published images load under the configured Pages path and survive direct reload', async ({
  page,
}) => {
  await page.goto('./#/deck/math-geometry/setup');
  await selectPictureCard(page);
  await finishSetup(page);
  const picture = page.locator('.study-card img');
  await expect(picture).toHaveCount(0);
  await page.getByRole('button', { name: '그림 보이기', exact: true }).click();
  await expect(picture).toBeVisible();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.reload();
  await expect(picture).toHaveCount(0);
  await page.getByRole('button', { name: '그림 보이기', exact: true }).click();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
});

test('existing sessions and completed history survive the rename and new defaults', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key)) return;
    const legacy = {
      id: 'legacy-session',
      deckId: 'kor-literature',
      deckTitle: '말에 색을 입히는 표현법',
      contentVersion: 'sample-2026-10-22-001',
      startedAt: '2026-10-22T10:00:00.000Z',
      cards: [
        {
          id: 'kor-lit-01',
          revision: 1,
          term: '직유법',
          definition: '이전 회차에서 보관한 설명',
          units: ['비유'],
        },
      ],
      currentIndex: 0,
      visibilityPreset: { term: false, visual: true, definition: true },
      ratings: { 'kor-lit-01': 'known' },
      order: 'random',
    };
    localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 1,
        activeByDeck: { 'kor-literature': legacy },
        historyByDeck: {
          'kor-literature': [
            { ...legacy, id: 'legacy-completed', completedAt: '2026-10-22T10:10:00.000Z' },
          ],
        },
      }),
    );
  }, storageKey);
  await page.goto('./#/deck/kor-literature/study');
  await expect(page.getByRole('button', { name: '단어 보이기', exact: true })).toBeVisible();
  await expect(page.getByText('이전 회차에서 보관한 설명', { exact: true })).toBeVisible();
  const before = await readProgress(page);
  await page.reload();
  await expect(page.getByTestId('study-card')).toBeVisible();
  expect(await readProgress(page)).toEqual(before);
  await page.getByRole('link', { name: '설정으로' }).click();
  await toVisibility(page);
  await expect(page.getByRole('button', { name: '단어 처음부터 표시' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '설명 가려두기' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect((await readProgress(page)).historyByDeck['kor-literature']).toHaveLength(1);
});

test('updated catalog versions preserve the active snapshot and explain the difference', async ({
  page,
}) => {
  await start(page);
  const firstCard = await page.getByTestId('study-card').getAttribute('data-card-id');
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key)!);
    progress.activeByDeck['kor-literature'].contentVersion = 'previous-release';
    localStorage.setItem(key, JSON.stringify(progress));
  }, storageKey);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('이번 회차는 시작할 때의 내용');
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstCard!);
});

test('setup keeps choices when moving between steps and validates the final preset', async ({
  page,
}) => {
  await page.goto(literature);
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await page.getByLabel('과장법').check();
  await page.getByLabel('직유법', { exact: false }).check();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('heading', { name: '어떤 순서로 볼까요?' })).toBeFocused();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: /가나다순/ }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: '단어 처음부터 표시' }).click();
  await page.getByRole('button', { name: '그림 가려두기' }).click();
  await expect(page.getByRole('status')).toContainText('그림 없는 카드가 포함');
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeDisabled();
  await page.getByRole('button', { name: '설명 가려두기' }).click();
  await page.getByRole('button', { name: '이전 설정' }).click();
  await expect(page.getByRole('button', { name: /가나다순/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '이전 설정' }).click();
  await expect(page.getByLabel('과장법')).toBeChecked();
  await expect(page.getByLabel('직유법')).toBeChecked();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(2);
  await toVisibility(page);
  await expect(page.getByRole('button', { name: '단어 가려두기' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('button', { name: '설명 처음부터 표시' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  await expect(page.getByTestId('study-card')).toBeVisible();
  const session = (await readProgress(page)).activeByDeck['kor-literature'];
  expect(session.cards.map((card: { term: string }) => card.term)).toEqual(['과장법', '직유법']);
  expect(session.visibilityPreset).toEqual({ term: false, visual: true, definition: true });
});

// Real browser touch input exercises touch-action and pointer cancellation, unlike
// synthetic DOM events which cannot expose accidental native scrolling/clicks.
async function touchGesture(
  page: Page,
  dx: number,
  dy = 0,
  cancel = false,
  target = '.study-term',
) {
  const locator = page.locator(target);
  await locator.scrollIntoViewIfNeeded();
  const box = (await locator.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 6; i++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / 6, y: y + (dy * i) / 6 }],
      });
    }
    await client.send('Input.dispatchTouchEvent', {
      type: cancel ? 'touchCancel' : 'touchEnd',
      touchPoints: [],
    });
  } finally {
    await client.detach();
  }
}

async function startTwoCards(page: Page) {
  await page.goto(literature);
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await page.getByLabel('과장법').check();
  await page.getByLabel('직유법').check();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: /가나다순/ }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  await expect(page.getByTestId('study-card')).toBeVisible();
}

test('touch navigation preserves ratings, resets visibility, and shows the hint only on the first card', async ({
  page,
  isMobile,
}) => {
  await startTwoCards(page);
  await expect(page.locator('.swipe-hint')).toHaveCount(0);
  const firstId = await page.getByTestId('study-card').getAttribute('data-card-id');
  await page.getByRole('button', { name: '알고 있음 알겠어요' }).click();
  if (isMobile) await expect(page.getByText('카드를 좌우로 밀어보세요')).toBeVisible();
  await page.getByRole('button', { name: '설명 보이기', exact: true }).click();
  await touchGesture(page, -100);
  await expect(page.getByTestId('study-card')).not.toHaveAttribute('data-card-id', firstId!);
  await expect(page.getByRole('button', { name: '설명 보이기', exact: true })).toBeVisible();
  await expect(page.locator('.swipe-hint')).toHaveCount(0);
  const lastId = await page.getByTestId('study-card').getAttribute('data-card-id');
  await page.getByRole('button', { name: '모름 한 번 더' }).click();
  await touchGesture(page, -100);
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', lastId!);
  expect((await readProgress(page)).historyByDeck).toEqual({});
  await touchGesture(page, 100);
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstId!);
  await expect(page.getByRole('button', { name: '알고 있음 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.swipe-hint')).toHaveCount(0);
  await touchGesture(page, 100);
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstId!);
  const before = await readProgress(page);
  await page.reload();
  await expect(page.getByTestId('study-card')).toBeVisible();
  await expect(page.locator('.swipe-hint')).toHaveCount(0);
  expect(await readProgress(page)).toEqual(before);
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('button', { name: '모름 한 번 더' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('short, vertical, and cancelled touches do not navigate or accidentally reveal content', async ({
  page,
}) => {
  await startTwoCards(page);
  const firstId = await page.getByTestId('study-card').getAttribute('data-card-id');
  await touchGesture(page, -25, 0, false, '.reveal-button');
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstId!);
  await expect(page.getByRole('button', { name: '설명 보이기', exact: true })).toBeVisible();
  await touchGesture(page, -80, -120);
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstId!);
  await touchGesture(page, -100, 0, true);
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', firstId!);
  await page.getByRole('button', { name: '설명 보이기', exact: true }).click();
  await expect(page.getByRole('button', { name: '설명 가리기', exact: true })).toBeVisible();
  // A swipe can begin on the large reveal button without treating it as a tap.
  await page.getByRole('button', { name: '설명 가리기', exact: true }).click();
  await touchGesture(page, -100, 0, false, '.reveal-button');
  await expect(page.getByTestId('study-card')).not.toHaveAttribute('data-card-id', firstId!);
  await expect(page.getByRole('button', { name: '설명 보이기', exact: true })).toBeVisible();
  expect(
    Object.keys((await readProgress(page)).activeByDeck['kor-literature'].ratings),
  ).toHaveLength(0);
  await page.getByRole('button', { name: '설명 보이기', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '설명 가리기', exact: true })).toBeVisible();
});
