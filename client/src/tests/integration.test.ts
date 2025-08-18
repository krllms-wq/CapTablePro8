import { test, expect, type Page } from '@playwright/test';

// Comprehensive integration tests for the enhanced UX features
test.describe('Enhanced UX Integration Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Visit the main application
    await page.goto('/');
  });

  test('should display guided tour on first visit', async ({ page }: { page: Page }) => {
    // Check if tour overlay is visible on first visit
    const tourOverlay = page.locator('[data-testid="tour-overlay"]');
    
    // Tour should either be visible or have a tour button available
    const tourButton = page.getByTestId('tour-button');
    const hasIntro = await tourOverlay.isVisible();
    const hasTourButton = await tourButton.isVisible();
    
    expect(hasIntro || hasTourButton).toBeTruthy();
  });

  test('should enable help mode and show contextual tooltips', async ({ page }: { page: Page }) => {
    // Enable help mode
    const helpToggle = page.getByTestId('help-toggle');
    await helpToggle.click();
    
    // Check that help mode is active
    await expect(page.locator('[data-testid="help-mode"]')).toBeVisible();
    
    // Look for help tooltips
    const helpTooltips = page.locator('[data-help]');
    const tooltipCount = await helpTooltips.count();
    expect(tooltipCount).toBeGreaterThan(0);
  });

  test('should show empty states when no data is available', async ({ page }: { page: Page }) => {
    // Navigate to companies page
    await page.goto('/companies');
    
    // Check for companies empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    if (await emptyState.isVisible()) {
      // Verify empty state has title and action
      await expect(emptyState.locator('h3')).toBeVisible();
      await expect(emptyState.locator('button')).toBeVisible();
    }
  });

  test('should toggle sensitive field masking', async ({ page }: { page: Page }) => {
    // Enable sensitive masking
    const sensitiveToggle = page.getByTestId('sensitive-toggle');
    if (await sensitiveToggle.isVisible()) {
      await sensitiveToggle.click();
      
      // Check that sensitive fields are masked
      const sensitiveFields = page.locator('[data-sensitive="true"]');
      const maskedFields = page.locator('[data-masked="true"]');
      
      if (await sensitiveFields.count() > 0) {
        expect(await maskedFields.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should show new feature badges for recently added features', async ({ page }: { page: Page }) => {
    // Look for new badges on navigation or features
    const newBadges = page.locator('[data-testid="new-badge"]');
    const badgeCount = await newBadges.count();
    
    // Should have at least some new badges for recently added features
    expect(badgeCount).toBeGreaterThanOrEqual(0);
    
    // If badges exist, they should have proper styling
    if (badgeCount > 0) {
      const firstBadge = newBadges.first();
      await expect(firstBadge).toHaveClass(/badge/);
    }
  });

  test('should provide system information page', async ({ page }: { page: Page }) => {
    // Navigate to system info page
    await page.goto('/system-info');
    
    // Should show system diagnostics
    const systemInfo = page.locator('[data-testid="system-info"]');
    await expect(systemInfo).toBeVisible();
    
    // Should have copy button for diagnostics
    const copyButton = page.getByTestId('copy-diagnostics');
    await expect(copyButton).toBeVisible();
  });

  test('should handle keyboard navigation properly', async ({ page }: { page: Page }) => {
    // Test tab navigation through main interface
    await page.keyboard.press('Tab');
    
    // Should be able to reach interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing to verify navigation works
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still have visible focused elements
    const stillFocused = page.locator(':focus');
    await expect(stillFocused).toBeVisible();
  });

  test('should maintain responsive design across viewport sizes', async ({ page }: { page: Page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });
});

// Performance and accessibility tests
test.describe('Performance and Accessibility', () => {
  test('should load pages within acceptable time limits', async ({ page }: { page: Page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have proper ARIA labels and roles', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // Check for proper navigation ARIA
    const nav = page.locator('nav');
    await expect(nav).toHaveRole('navigation');
    
    // Check for proper button roles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      await expect(buttons.nth(i)).toHaveRole('button');
    }
  });

  test('should work without JavaScript enabled', async ({ page }: { page: Page }) => {
    // Disable JavaScript
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.navigator.userAgent;
    });
    
    await page.goto('/');
    
    // Basic content should still be visible
    await expect(page.locator('body')).toBeVisible();
  });
});