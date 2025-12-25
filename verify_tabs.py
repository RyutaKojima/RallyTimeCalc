
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to the homepage
        await page.goto("http://localhost:3000/")

        # Click the create room button
        await page.get_by_role("button", name="Create a New Room").click()

        # Wait for the navigation to the room page and get the URL
        await page.wait_for_url("**/room/**")

        # Verify the "Relative Time" tab is visible
        relative_time_tab = page.get_by_role("button", name="Relative Time")
        await expect(relative_time_tab).to_be_visible()

        # Click the "Absolute Time" tab
        await page.get_by_role("button", name="Absolute Time").click()

        # Take a screenshot
        await page.screenshot(path="tab_names_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
