import { test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const N_BOTS = 100;
const N_MOVES = 10000;
const DOWN_TIME = 10;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function move(page) {
  const direction = Math.round(Math.random() * 4);

  if (direction === 0) {
    await page.keyboard.down('ArrowLeft');
    await sleep(DOWN_TIME);
    await page.keyboard.up('ArrowLeft');
  } else if (direction === 1) {
    await page.keyboard.down('ArrowUp');
    await sleep(DOWN_TIME);
    await page.keyboard.up('ArrowUp');
  } else if (direction === 2) {
    await page.keyboard.down('ArrowRight');
    await sleep(DOWN_TIME);
    await page.keyboard.up('ArrowRight');
  } else if (direction === 3) {
    await page.keyboard.down('ArrowDown');
    await sleep(DOWN_TIME);
    await page.keyboard.up('ArrowDown');
  }
}

for (let n = 0; n < N_BOTS; ++n) {
  test(`Movement in browser ${n}`, async ({ page }) => {
    await page.goto('http://localhost:1234/');

    for (let i = 0; i < N_MOVES; ++i) {
      await move(page);
    }
  });
}
