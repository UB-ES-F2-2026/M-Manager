import { expect, test, type Browser, type Page, type TestInfo } from "@playwright/test";

/**
 * Full journey of two real users in two browsers, against a real Convex backend:
 * sign up (US1.1) → add an expense (US2.1) → budget at 85 % with the warning (US3.1)
 * → create a group and join it with the code (US4.1) → shared expense (US4.2)
 * → balances and «Saldar deute» (US4.3), with both screens updating live.
 */

const PASSWORD = "Secret123!";
/** Unique per run, so the test can run again against the same deployment. */
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const ANA = `Ana E2E ${RUN_ID}`;
const BERT = `Bert E2E ${RUN_ID}`;
const GROUP = `Viatge E2E ${RUN_ID}`;

/** `Intl` writes "85,00 €" with a non-breaking space before the euro sign. */
function euros(amount: string): RegExp {
  return new RegExp(`${amount.replace(".", "\\.")}\\s€`);
}

/** A second, independent browser (own cookies and session) with the same phone settings. */
async function openSecondBrowser(browser: Browser, testInfo: TestInfo): Promise<Page> {
  const { baseURL, locale, timezoneId, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } =
    testInfo.project.use;
  const context = await browser.newContext({
    baseURL,
    locale,
    timezoneId,
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  });
  return context.newPage();
}

/** The group detail block under the heading `title` («Membres», «Balanços»…). */
function section(page: Page, title: string) {
  return page.locator("section").filter({ has: page.getByRole("heading", { name: title }) });
}

async function signUp(page: Page, name: string): Promise<void> {
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@e2e.m-manager.test`;
  await page.goto("/register");
  await page.getByLabel("Nom").fill(name);
  await page.getByLabel("Correu electrònic").fill(email);
  await page.getByLabel("Contrasenya", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear compte" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Afegir moviment" })).toBeVisible();
}

test("sign up, expense, budget, group and settle up", async ({ page, browser }, testInfo) => {
  await test.step("US1.1 · Ana creates her account and lands on the home screen", async () => {
    await signUp(page, ANA);
  });

  await test.step("US2.1 · Ana adds an 85 € restaurant expense", async () => {
    await page.getByRole("link", { name: "Afegir moviment" }).click();
    await expect(page.getByRole("heading", { name: "Nou moviment" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Despesa" })).toHaveAttribute("aria-checked", "true");
    await page.getByLabel("Import").fill("85");
    await page.getByLabel("Categoria").selectOption({ label: "Restaurants" });
    await page.getByLabel("Concepte").fill("Sopar d'aniversari");
    await page.getByRole("button", { name: "Desar moviment" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Sopar d'aniversari")).toBeVisible();
  });

  await test.step("US3.1 · a 100 € budget shows 85 %, the amber bar and the 80 % warning", async () => {
    await page.goto("/budgets/new");
    await page.getByLabel("Categoria").selectOption({ label: "Restaurants" });
    await page.getByLabel("Límit mensual").fill("100");
    await page.getByRole("button", { name: "Desar pressupost" }).click();

    await expect(page).toHaveURL(/\/budgets$/);
    const bar = page.getByRole("progressbar", { name: "Pressupost de Restaurants" });
    await expect(bar).toHaveAttribute("aria-valuetext", "85%");
    await expect(bar.locator("div")).toHaveClass(/bg-strength-3/);
    await expect(page.getByText("Has arribat al 80% del pressupost.")).toBeVisible();
    await expect(page.getByText(/85,00\s€ \/ 100,00\s€/)).toBeVisible();

    // The same budget appears in the «Pressupostos» section of the home screen.
    await page.goto("/");
    await expect(page.getByRole("progressbar", { name: "Pressupost de Restaurants" })).toHaveAttribute(
      "aria-valuetext",
      "85%",
    );
  });

  let groupCode = "";
  await test.step("US4.1 · Ana creates a group and gets its invite code", async () => {
    await page.goto("/groups");
    // The empty list repeats the link; the main button is the first one.
    await page.getByRole("link", { name: "Crear un grup" }).first().click();
    await page.getByLabel("Nom").fill(GROUP);
    await page.getByRole("button", { name: "Crear grup" }).click();

    await expect(page.getByRole("heading", { name: GROUP })).toBeVisible();
    groupCode = (await page.getByText("Codi del grup").locator("xpath=following-sibling::p").innerText()).trim();
    expect(groupCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  const bert = await openSecondBrowser(browser, testInfo);

  await test.step("US4.1 · Bert signs up in another browser and joins with the code", async () => {
    await signUp(bert, BERT);
    await bert.goto("/groups/join");
    await bert.getByLabel("Codi del grup").fill(groupCode);
    await bert.getByRole("button", { name: "Unir-me" }).click();

    await expect(bert.getByRole("heading", { name: GROUP })).toBeVisible();
    // Ana's screen shows the new member without reloading (Convex reactive query).
    await expect(section(page, "Membres").getByText(BERT, { exact: true })).toBeVisible();
  });

  await test.step("US4.2 · Ana pays a 60 € dinner split equally between both", async () => {
    await page.getByRole("link", { name: "Afegir despesa" }).click();
    await page.getByLabel("Concepte").fill("Sopar del grup");
    await page.getByLabel("Import").fill("60");
    await expect(page.getByRole("radio", { name: "Igual" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Desar despesa" }).click();

    await expect(page.getByRole("heading", { name: GROUP })).toBeVisible();
    await expect(page.getByText("Sopar del grup")).toBeVisible();
  });

  await test.step("US4.3 · both see who owes whom: «Bert paga a Ana 30,00 €»", async () => {
    for (const screen of [page, bert]) {
      const card = screen.getByRole("listitem").filter({ hasText: `${BERT} paga a ${ANA}` });
      await expect(card).toContainText(euros("30,00"));
      const balances = section(screen, "Balanços");
      await expect(balances.getByRole("listitem").filter({ hasText: ANA })).toContainText("Li deuen");
      await expect(balances.getByRole("listitem").filter({ hasText: BERT })).toContainText("Deu");
    }
  });

  await test.step("US4.3 · Bert settles the debt and both screens show everyone even", async () => {
    await bert.getByRole("button", { name: "Saldar deute" }).click();
    const dialog = bert.getByRole("alertdialog", { name: "Saldar deute" });
    await expect(dialog).toContainText(`Es registrarà que ${BERT} ha pagat`);
    await dialog.getByRole("button", { name: "Confirmar pagament" }).click();
    await expect(dialog).toBeHidden();

    for (const screen of [bert, page]) {
      await expect(screen.getByText("No hi ha deutes pendents.")).toBeVisible();
      const balances = section(screen, "Balanços");
      await expect(balances.getByText("En pau")).toHaveCount(2);
      // Settling records a payment; the expense history stays as it was.
      await expect(screen.getByText("Sopar del grup")).toBeVisible();
    }
  });

  await bert.context().close();
});
