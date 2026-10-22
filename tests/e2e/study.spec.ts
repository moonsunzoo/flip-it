import { expect, test, type Page } from '@playwright/test';

const literature = './#/deck/kor-literature/setup';
const storageKey = 'know-or-nope:progress:v1';
async function start(page: Page) {
  await page.goto(literature);
  await page.getByRole('button', { name: '학습 시작하기', exact: true }).click();
  await expect(page.getByTestId('study-card')).toBeVisible();
}
async function readProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), storageKey);
}

test('catalog filters by subject and opens settings before studying', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('한 장씩');
  await expect(page.locator('.deck-card')).toHaveCount(3);
  await page.getByRole('button', { name: '수학' }).click();
  await expect(page.locator('.deck-card')).toHaveCount(1);
  await page.getByRole('link', { name: '학습 설정하기' }).click();
  await expect(page).toHaveURL(/setup$/);
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeVisible();
  await expect(page.getByTestId('study-card')).toHaveCount(0);
});

test('zero cards and empty initial visibility are blocked; selected topics form the session', async ({
  page,
}) => {
  await page.goto(literature);
  await page.getByRole('button', { name: '직접 선택', exact: true }).click();
  await page.getByRole('button', { name: '모두 해제' }).click();
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeDisabled();
  await page.getByRole('button', { name: '주제별 선택' }).click();
  await page.getByLabel('강조').uncheck();
  await page.getByLabel('변화').uncheck();
  await page.getByRole('button', { name: '그림 처음부터 표시' }).click();
  await page.getByRole('button', { name: '설명 처음부터 표시' }).click();
  await expect(page.getByRole('button', { name: '학습 시작하기' })).toBeDisabled();
  await page.getByRole('button', { name: '설명 가려두기' }).click();
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  const progress = await readProgress(page);
  expect(progress.activeByDeck['kor-literature'].cards).toHaveLength(3);
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
  await page.getByRole('button', { name: '단어 보이기', exact: true }).click();
  await expect(page.getByRole('button', { name: '설명 가리기', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '모름 Nope, 한 번 더' }).click();
  await page.getByRole('button', { name: '알고 있음 Know, 알겠어요' }).click();
  await expect(page.getByRole('button', { name: '알고 있음 Know, 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('button', { name: '단어 보이기', exact: true })).toBeVisible();
  const before = await readProgress(page);
  const currentId = await page.getByTestId('study-card').getAttribute('data-card-id');
  await page.reload();
  await expect(page.getByTestId('study-card')).toHaveAttribute('data-card-id', currentId!);
  expect(await readProgress(page)).toEqual(before);
  await page.getByRole('button', { name: '이전', exact: true }).click();
  await expect(page.getByRole('button', { name: '알고 있음 Know, 알겠어요' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '판정 취소', exact: true }).click();
  await expect(page.getByRole('button', { name: '알고 있음 Know, 알겠어요' })).toHaveAttribute(
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
  await page.getByRole('button', { name: '학습 시작하기' }).click();
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
  await page.getByRole('button', { name: '모름 Nope, 한 번 더' }).click();
  await page.goto('./#/deck/math-geometry/setup');
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  await page.getByRole('button', { name: '알고 있음 Know, 알겠어요' }).click();
  expect(Object.keys((await readProgress(page)).activeByDeck)).toHaveLength(2);
  await page.goto(literature);
  const original = (await readProgress(page)).activeByDeck['kor-literature'].id;
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  await expect(page).toHaveURL(/setup$/);
  expect((await readProgress(page)).activeByDeck['kor-literature'].id).toBe(original);
  await page.getByRole('button', { name: '이어서 학습', exact: true }).click();
  await expect(page.getByRole('button', { name: '모름 Nope, 한 번 더' })).toHaveAttribute(
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
  await page.getByRole('button', { name: '알고 있음 Know, 알겠어요' }).click();
  await expect(page.getByRole('button', { name: '알고 있음 Know, 알겠어요' })).toHaveAttribute(
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
  await page.getByRole('button', { name: '학습 시작하기' }).click();
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
  await page.getByRole('button', { name: '학습 시작하기' }).click();
  const picture = page.locator('.study-card img');
  await expect(picture).toBeVisible();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.reload();
  await expect
    .poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
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
