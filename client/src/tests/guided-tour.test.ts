// Playwright test for guided tour functionality
import { test, expect } from '@playwright/test';

test.describe('Guided Tour', () => {
  test('should complete tour steps', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/companies/test-company');
    
    // Start the tour
    await page.click('[data-testid="tour-button"]');
    
    // Check first step is visible
    await expect(page.locator('.tour-card')).toBeVisible();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    
    // Navigate through all steps
    await page.click('text=Next');
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    
    await page.click('text=Next');
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();
    
    await page.click('text=Next');
    await expect(page.locator('text=Step 4 of 5')).toBeVisible();
    
    await page.click('text=Next');
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();
    
    // Finish tour
    await page.click('text=Finish');
    await expect(page.locator('.tour-card')).not.toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/companies/test-company');
    await page.click('[data-testid="tour-button"]');
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    
    // Use escape to exit
    await page.keyboard.press('Escape');
    await expect(page.locator('.tour-card')).not.toBeVisible();
  });

  test('should persist completion state', async ({ page }) => {
    await page.goto('/companies/test-company');
    
    // Complete tour
    await page.click('[data-testid="tour-button"]');
    await page.click('text=Don\'t show this tour again');
    
    // Refresh page and check tour doesn't auto-start
    await page.reload();
    await expect(page.locator('.tour-card')).not.toBeVisible();
    
    // But should still be available via replay
    await page.click('text=Replay tour');
    await expect(page.locator('.tour-card')).toBeVisible();
  });
});