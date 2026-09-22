import { expect, test, type Locator, type Page } from '@playwright/test';

const allowedFontFamilies = ['Instrument Serif', 'Outfit'];

async function waitForFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

function captureRemoteFontRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/i.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

function captureLocalFontRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

async function expectVisibleAction(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, 'primary action must have a rendered box').not.toBeNull();
  expect(box!.width, 'primary action must not collapse horizontally').toBeGreaterThanOrEqual(44);
  expect(box!.height, 'primary action must meet the 44px touch target').toBeGreaterThanOrEqual(44);
}

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 40) {
  for (let tabCount = 0; tabCount < maxTabs; tabCount += 1) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((element) => document.activeElement === element)) return;
  }

  throw new Error(`Could not reach ${await locator.evaluate((element) => element.outerHTML)} with Tab`);
}

async function expectVisibleFocus(locator: Locator) {
  await expect(locator).toBeFocused();

  const focusStyles = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    };
  });

  expect(
    focusStyles.outlineStyle !== 'none' && focusStyles.outlineWidth > 0 ||
      focusStyles.boxShadow !== 'none',
    'keyboard focus must have a visible outline or ring',
  ).toBe(true);
}

async function expectTypographySystem(page: Page) {
  const unexpectedFonts = await page.locator('body *:visible').evaluateAll(
    (elements, allowed) =>
      elements
        .map((element) => ({
          text: element.textContent?.trim().slice(0, 60),
          font: getComputedStyle(element).fontFamily,
        }))
        .filter(({ text, font }) => text && !allowed.some((name) => font.includes(name)))
        .slice(0, 10),
    allowedFontFamilies,
  );

  expect(unexpectedFonts, 'visible copy must use only the display or body font').toEqual([]);
}

async function hideDynamicCountdown(page: Page) {
  await page
    .getByText(/days/i)
    .first()
    .evaluate((element) => {
      const container = element.parentElement;
      if (container) container.style.visibility = 'hidden';
    })
    .catch(() => undefined);
}

const guestPages = [
  {
    name: 'story',
    path: '/story',
    heading: 'The Story So Far',
    content: 'The wedding',
  },
  {
    name: 'wedding-party',
    path: '/wedding-party',
    heading: 'The Wedding Party',
    content: 'Winslow',
  },
  {
    name: 'schedule',
    path: '/schedule',
    heading: 'The Schedule',
    content: 'The Wedding',
  },
  {
    name: 'travel',
    path: '/travel',
    heading: 'Travel & Lodging',
    content: 'Getting There',
  },
] as const;

test.describe('wedding site visual contract', () => {
  test('fonts are served locally without Google Fonts requests', async ({ page }) => {
    const remoteFontRequests = captureRemoteFontRequests(page);

    await page.goto('/');
    await waitForFonts(page);

    expect(remoteFontRequests, 'the wedding site must not request Google Fonts').toEqual([]);
  });

  test('accented guest copy stays in local approved font families', async ({ page }) => {
    const remoteFontRequests = captureRemoteFontRequests(page);
    const localFontRequests = captureLocalFontRequests(page);
    const displayText = 'Mārtiņš & Łukasz';
    const bodyText = 'A Māori celebration for José, Zoë, and São.';

    await page.goto('/');
    await page.evaluate(({ displayText, bodyText }) => {
      const fixture = document.createElement('section');
      fixture.dataset.testid = 'accented-font-fixture';
      fixture.className = 'fixed left-0 top-0 z-50 bg-ivory p-4';

      const displayCopy = document.createElement('h2');
      displayCopy.className = 'font-display';
      displayCopy.textContent = displayText;

      const bodyCopy = document.createElement('p');
      bodyCopy.className = 'font-body';
      bodyCopy.textContent = bodyText;

      fixture.append(displayCopy, bodyCopy);
      document.body.append(fixture);
    }, { displayText, bodyText });

    const fixture = page.getByTestId('accented-font-fixture');
    await expect(fixture).toBeVisible();
    await expect(fixture).toContainText(displayText);
    await expect(fixture).toContainText(bodyText);

    const fontState = await page.evaluate(async ({ displayText, bodyText }) => {
      const displayFaces = await document.fonts.load('400 48px "Instrument Serif"', displayText);
      const bodyFaces = await document.fonts.load('300 20px "Outfit"', bodyText);
      await document.fonts.ready;

      const displayElement = document.querySelector('[data-testid="accented-font-fixture"] h2');
      const bodyElement = document.querySelector('[data-testid="accented-font-fixture"] p');

      return {
        displayFamily: displayElement ? getComputedStyle(displayElement).fontFamily : '',
        bodyFamily: bodyElement ? getComputedStyle(bodyElement).fontFamily : '',
        displayLoaded: document.fonts.check('400 48px "Instrument Serif"', displayText),
        bodyLoaded: document.fonts.check('300 20px "Outfit"', bodyText),
        displayFaces: displayFaces.map((face) => ({ family: face.family, status: face.status })),
        bodyFaces: bodyFaces.map((face) => ({ family: face.family, status: face.status })),
      };
    }, { displayText, bodyText });

    expect(fontState.displayFamily).toContain('Instrument Serif');
    expect(fontState.bodyFamily).toContain('Outfit');
    expect(fontState.displayLoaded, 'Instrument Serif must cover the accented name').toBe(true);
    expect(fontState.bodyLoaded, 'Outfit must cover the accented guest copy').toBe(true);
    expect(fontState.displayFaces).toEqual(
      expect.arrayContaining([expect.objectContaining({ family: 'Instrument Serif', status: 'loaded' })]),
    );
    expect(fontState.bodyFaces).toEqual(
      expect.arrayContaining([expect.objectContaining({ family: 'Outfit', status: 'loaded' })]),
    );

    expect(remoteFontRequests, 'accented copy must not trigger Google Fonts requests').toEqual([]);
    expect(localFontRequests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
    expect(
      localFontRequests.some((url) => /instrument-serif-regular(?:-mobile)?-ext\.woff2(?:\?|$)/.test(url)),
      'Instrument Serif extended-Latin subset must be served locally',
    ).toBe(true);
    expect(
      localFontRequests.some((url) => /outfit(?:-mobile)?-ext\.woff2(?:\?|$)/.test(url)),
      'Outfit extended-Latin subset must be served locally',
    ).toBe(true);
  });

  test('accented italic guest copy uses the local Instrument Serif extended subset', async ({
    page,
  }, testInfo) => {
    const remoteFontRequests = captureRemoteFontRequests(page);
    const localFontRequests = captureLocalFontRequests(page);
    const italicText = 'Mārtiņš, Łukasz & Zoë';

    await page.goto('/');
    await page.evaluate((italicText) => {
      const fixture = document.createElement('section');
      fixture.dataset.testid = 'accented-italic-font-fixture';
      fixture.className = 'fixed left-0 top-0 z-50 bg-ivory p-4';

      const italicCopy = document.createElement('p');
      italicCopy.className = 'font-display italic';
      italicCopy.textContent = italicText;

      fixture.append(italicCopy);
      document.body.append(fixture);
    }, italicText);

    const fixture = page.getByTestId('accented-italic-font-fixture');
    await expect(fixture).toBeVisible();
    await expect(fixture).toContainText(italicText);

    const fontState = await page.evaluate(async (italicText) => {
      const italicFaces = await document.fonts.load('italic 48px "Instrument Serif"', italicText);
      await document.fonts.ready;

      const italicElement = document.querySelector(
        '[data-testid="accented-italic-font-fixture"] p',
      );

      return {
        family: italicElement ? getComputedStyle(italicElement).fontFamily : '',
        style: italicElement ? getComputedStyle(italicElement).fontStyle : '',
        loaded: document.fonts.check('italic 48px "Instrument Serif"', italicText),
        faces: italicFaces.map((face) => ({ family: face.family, style: face.style, status: face.status })),
      };
    }, italicText);

    expect(fontState.family).toContain('Instrument Serif');
    expect(fontState.style).toBe('italic');
    expect(fontState.loaded, 'Instrument Serif italic must cover the accented guest copy').toBe(true);
    expect(fontState.faces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          family: 'Instrument Serif',
          style: 'italic',
          status: 'loaded',
        }),
      ]),
    );

    expect(remoteFontRequests, 'accented italic copy must not trigger Google Fonts requests').toEqual([]);
    expect(localFontRequests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);

    const expectedSubset = testInfo.project.name === 'mobile'
      ? 'instrument-serif-italic-mobile-ext.woff2'
      : 'instrument-serif-italic-ext.woff2';
    expect(
      localFontRequests.some((url) => url.endsWith(`/fonts/${expectedSubset}`)),
      `Instrument Serif italic must load the local ${testInfo.project.name} extended-Latin subset`,
    ).toBe(true);
  });

  test('home keeps its typography and primary reply action', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForFonts(page);
    await hideDynamicCountdown(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jenn Wiles');
    await expectVisibleAction(page.getByRole('link', { name: /Kindly Reply/ }).filter({ visible: true }).first());
    await expectTypographySystem(page);
    await expect(page).toHaveScreenshot(`home-${testInfo.project.name}.png`, { fullPage: true });
  });

  test('RSVP form remains legible and is never submitted', async ({ page }, testInfo) => {
    let submissionAttempted = false;
    await page.route('**/api/rsvps', async (route) => {
      if (route.request().method() === 'POST') submissionAttempted = true;
      await route.abort();
    });

    await page.goto('/rsvp');
    await waitForFonts(page);
    await page.locator('input[name="names"]').fill('Visual Check Only');
    await page.locator('input[name="email"]').fill('visual-check@example.invalid');
    await page.locator('select[name="attendance"]').selectOption('declining');
    await page.locator('input[name="partySize"]').fill('0');

    await expectVisibleAction(page.getByRole('button', { name: 'Send Reply' }));
    await expectTypographySystem(page);
    await expect(page.locator('form')).toHaveScreenshot(`rsvp-${testInfo.project.name}.png`, {
      mask: [page.locator('header'), page.locator('.fixed.inset-0')],
    });
    expect(submissionAttempted, 'visual checks must not submit RSVP data').toBe(false);
  });

  test('responses state keeps protected actions visible without using real data', async ({ page }, testInfo) => {
    await page.addInitScript(() => sessionStorage.setItem('rsvp-admin-unlocked', 'true'));
    await page.route('**/api/rsvps/admin', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: {
            responses: 2,
            attendingParties: 1,
            attendingGuests: 2,
            decliningParties: 1,
          },
          responses: [
            {
              id: 1,
              names: 'Sample Guest',
              email: 'sample@example.invalid',
              attendance: 'attending',
              partySize: 2,
              dietaryNotes: 'Vegetarian',
              songRequest: 'Sample song',
              message: 'Sample message',
              submittedAt: '2026-09-13T12:00:00.000Z',
            },
            {
              id: 2,
              names: 'Example Guest',
              email: 'example@example.invalid',
              attendance: 'declining',
              partySize: 0,
              submittedAt: '2026-09-13T12:00:00.000Z',
            },
          ],
        }),
      }),
    );

    await page.goto('/responses');
    await waitForFonts(page);
    await expect(page.getByText('Total Responses')).toBeVisible();
    await expectVisibleAction(page.getByRole('link', { name: 'Export CSV' }));
    await expect(page.getByRole('button', { name: 'Lock Session' })).toBeVisible();
    await expectTypographySystem(page);
    await expect(page).toHaveScreenshot(`responses-${testInfo.project.name}.png`, { fullPage: true });
  });

  test('mobile menu keeps every navigation target tappable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile-only state');

    await page.goto('/');
    await waitForFonts(page);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();

    const menuLinks = page.locator('.fixed.inset-0 a');
    await expect(menuLinks).toHaveCount(6);
    for (const link of await menuLinks.all()) await expectVisibleAction(link);
    await expectTypographySystem(page);
    await expect(page).toHaveScreenshot('mobile-menu.png');
  });

  test('desktop navigation is reachable and activates with the keyboard', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only state');

    await page.goto('/story');
    await waitForFonts(page);

    const navLinks = [
      page.getByRole('link', { name: 'Welcome', exact: true }),
      page.getByRole('link', { name: 'Story', exact: true }),
      page.getByRole('link', { name: 'Wedding Party', exact: true }),
      page.getByRole('link', { name: 'Schedule', exact: true }),
      page.getByRole('link', { name: 'Travel', exact: true }),
      page.getByRole('link', { name: 'RSVP', exact: true }),
    ];

    for (const link of navLinks) {
      await tabUntilFocused(page, link);
      await expectVisibleFocus(link);
    }

    await page.keyboard.press('Tab');
    expect(await page.locator('header :focus').count(), 'Tab must leave the desktop navigation').toBe(0);

    await navLinks.at(-1)!.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/rsvp$/);
  });

  test('mobile menu opens, closes, and releases keyboard focus without a trap', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile-only state');

    await page.goto('/');
    await waitForFonts(page);

    const openMenu = page.getByRole('button', { name: 'Open menu' });
    await tabUntilFocused(page, openMenu);
    await expectVisibleFocus(openMenu);
    await page.keyboard.press('Enter');

    const closeMenu = page.getByRole('button', { name: 'Close menu' });
    const menu = page.locator('#mobile-menu');
    const menuLinks = menu.getByRole('link');

    await expect(closeMenu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menuLinks).toHaveCount(6);

    for (const link of await menuLinks.all()) {
      await page.keyboard.press('Tab');
      await expectVisibleFocus(link);
    }

    await page.keyboard.press('Tab');
    expect(await menu.locator(':focus').count(), 'Tab must leave the open menu instead of trapping focus').toBe(0);

    await closeMenu.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu.locator('a').first()).toHaveAttribute('tabindex', '-1');
  });

  test('RSVP controls are keyboard reachable without submitting guest data', async ({ page }) => {
    let submissionAttempted = false;
    await page.route('**/api/rsvps', async (route) => {
      if (route.request().method() === 'POST') submissionAttempted = true;
      await route.abort();
    });

    await page.goto('/rsvp');
    await waitForFonts(page);

    const formControls = [
      page.locator('input[name="names"]'),
      page.locator('input[name="email"]'),
      page.locator('select[name="attendance"]'),
      page.locator('input[name="partySize"]'),
      page.locator('input[name="dietaryNotes"]'),
      page.locator('input[name="songRequest"]'),
      page.locator('textarea[name="message"]'),
      page.getByRole('button', { name: 'Send Reply' }),
    ];

    for (const control of formControls) {
      await tabUntilFocused(page, control);
      await expectVisibleFocus(control);
    }

    expect(submissionAttempted, 'keyboard checks must not submit RSVP data').toBe(false);
  });

  test('schedule calendar link is keyboard reachable and activation is safely intercepted', async ({ page }) => {
    let calendarRequested = false;
    await page.route('**/jenn-and-anna-wedding.ics', async (route) => {
      calendarRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/calendar',
        body: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n',
      });
    });

    await page.goto('/schedule');
    await waitForFonts(page);

    const calendarLink = page.getByRole('link', { name: 'Add date to calendar' });
    await tabUntilFocused(page, calendarLink);
    await expectVisibleFocus(calendarLink);

    await calendarLink.press('Enter');
    expect(calendarRequested, 'keyboard activation must request the calendar link').toBe(true);
    await expect(page).toHaveURL(/\/schedule$/);
  });

  for (const guestPage of guestPages) {
    test(`${guestPage.name} page keeps its primary content available`, async ({ page }, testInfo) => {
      await page.goto(guestPage.path);
      await waitForFonts(page);

      await expect(page.getByRole('heading', { level: 2 })).toContainText(guestPage.heading);
      await expect(page.getByText(guestPage.content, { exact: true }).first()).toBeVisible();

      if (guestPage.name === 'schedule') {
        await expectVisibleAction(page.getByRole('link', { name: 'Add date to calendar' }));
        await expect(page.getByText('Attire', { exact: true })).toBeVisible();
      }

      if (guestPage.name === 'wedding-party') {
        await expect(page.getByText('Bear', { exact: true })).toBeVisible();
      }

      if (guestPage.name === 'travel') {
        await expect(page.getByText('Where to Stay', { exact: true })).toBeVisible();
      }

      await expectTypographySystem(page);
      await expect(page).toHaveScreenshot(`${guestPage.name}-${testInfo.project.name}.png`, {
        fullPage: true,
      });
    });
  }
});