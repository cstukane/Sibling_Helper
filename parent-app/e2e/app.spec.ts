import { test, expect } from '@playwright/test';

test('should display the main page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Big Sibling Helper')).toBeVisible();
});

test('should display quest cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Today\'s Quests')).toBeVisible();
  
  // Check that at least one quest card is displayed
  const questCards = page.locator('[role="button"]').filter({ hasText: 'pts' });
  await expect(questCards.first()).toBeVisible();
});

test('should toggle parent mode', async ({ page }) => {
  await page.goto('/');
  
  // Click parent mode toggle
  await page.getByText('Parent Mode').click();
  
  // Should show PIN pad
  await expect(page.getByText('Enter Parent PIN')).toBeVisible();
  
  // Enter default PIN
  await page.getByText('1').click();
  await page.getByText('2').click();
  await page.getByText('3').click();
  await page.getByText('4').click();
  
  // Should now be in parent mode
  await expect(page.getByText('Parent Mode')).toBeVisible();
});