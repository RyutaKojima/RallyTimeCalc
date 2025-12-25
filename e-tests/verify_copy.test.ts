import { test, expect } from '@playwright/test';
import { v7 as uuidv7 } from 'uuid';

test('test calculation results copy button', async ({ page, context }) => {
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const roomId = uuidv7();
  await page.goto(`http://localhost:3000/room/${roomId}`);

  // Add first player (form is visible by default)
  await page.getByPlaceholder('Player Name').fill('Player 1');
  await page.locator('#new-castle-min').fill('10');
  await page.locator('#new-castle-sec').fill('10'); // This player will have the delay
  await page.getByRole('button', { name: 'Save' }).click();

  // Add second player
  await page.getByRole('button', { name: 'Add User' }).click();
  await page.getByPlaceholder('Player Name').fill('Player 2');
  await page.locator('#new-castle-min').fill('10');
  await page.locator('#new-castle-sec').fill('0'); // This player will depart now
  await page.getByRole('button', { name: 'Save' }).click();

  // Set rally wait time to trigger the "Rally Start Time" text
  await page.getByLabel('Rally Waiting Time').selectOption('60');

  // Calculate delays
  await page.getByRole('button', { name: 'Calculate Delays' }).click();

  // Expand the results section
  await page.getByRole('heading', { name: 'Calculation Results' }).locator('..').getByRole('button').click();

  // Wait for results to be visible
  await expect(page.getByTestId('calculation-results-list')).toBeVisible();

  // Check for the copy button and click it
  const resultsSection = page.locator('section:has-text("Calculation Results")');
  const copyButton = resultsSection.getByRole('button', { name: 'Copy' });
  await expect(copyButton).toBeVisible();
  await copyButton.click();

  // Check for feedback message
  await expect(page.getByText('Copied!')).toBeVisible();

  // Check clipboard content
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain('Calculation Results for Castle:');
  expect(clipboardText).toContain('Player 2: Depart Now');
  expect(clipboardText).toContain('Player 1: Rally Start Time: Player 2 timer = 0:50');
});
