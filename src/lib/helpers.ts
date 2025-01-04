import { Expect, Page } from "@playwright/test";

export async function addressInput(page: Page, expect: Expect) {
    const addressInput = page.getByPlaceholder("Enter address...");
    await addressInput.fill("London Bridge");
    await addressInput.press("Enter");
    await expect(page.getByText("London Bridge")).toBeVisible();

    // Add second location
    await addressInput.fill("Tower of London");
    await addressInput.press("Enter");
    await expect(page.getByText("Tower of London")).toBeVisible();
}