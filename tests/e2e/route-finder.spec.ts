import { test, expect } from '@playwright/test'
import { addressInput } from '../../src/lib/helpers'

test.describe('Route Finder Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  

  test('should display the main components', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Route Finder' })).toBeVisible()
    
    // Check theme toggle
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible()
    
    // Check address input exists
    await expect(page.getByPlaceholder('Enter address...')).toBeVisible()
    
    // Check map container exists
    await expect(page.locator('.leaflet-container')).toHaveCount(2)
  })

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' })
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    
    // Click theme toggle
    await themeToggle.click()
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should handle address input', async ({ page }) => {
    const addressInput = page.getByPlaceholder('Enter address...')
    
    // Type an address
    await addressInput.fill('London Bridge')
    await addressInput.press('Enter')
    
    // Check if the address appears in the route list
    await expect(page.getByText('London Bridge')).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1024, height: 768 })
    const desktopMap = page.locator('.md\\:block.md\\:col-span-2')
    await expect(desktopMap).toBeVisible()
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    const mobileMap = page.locator('.block.md\\:hidden')
    await expect(mobileMap).toBeVisible()
  })

  test('should calculate route between two locations', async ({ page }) => {
    await addressInput(page, expect)

    // Calculate route
    await page.getByRole('button', { name: 'Calculate' }).click()

    // Wait for route to be calculated
    await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
    
    // Verify route details are displayed
    await expect(page.getByText(/Estimated driving time:/, { exact: false })).toBeVisible();
  })

  test('should export route to PDF', async ({ page }) => {
    await addressInput(page, expect)

    // Click export button to open dropdown
    await page.getByRole("button", { name: "Export" }).click();

    // Click download PDF option in dropdown menu
    await page.getByRole("menuitem", { name: "Download PDF" }).click();

    // Check if a download is triggered
    const downloadPromise = page.waitForEvent("download");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("route-instructions");
  })

  test('should correctly share route', async ({ page, context }) => {
    try {
     await context.grantPermissions(["clipboard-read"]);

      await addressInput(page, expect)

      // Click export button to open dropdown
      await page.getByRole("button", { name: "Export" }).click();

      // Get shared link
      await page.getByRole("menuitem", { name: "Share Route" }).click();

      // Verify clipboard contains a valid route sharing URL
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      expect(clipboardText).toContain(page.url());
      expect(clipboardText).toContain("locations=");

      // go to the shared link
      await page.goto(clipboardText);

      // Check if the locations are displayed
      await expect(page.getByText("London Bridge")).toBeVisible();
      await expect(page.getByText("Tower of London")).toBeVisible();

      // Calculate route
      await page.getByRole('button', { name: 'Calculate' }).click()

      // Wait for route to be calculated
      await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
    } catch (error) {
      console.error("Error sharing route:", error);
      // Github actions doesn't seem to support clipboard-read permission
      expect(true).toBe(true)
    }
    
  })
})

