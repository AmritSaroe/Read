/**
 * Welcome article — pre-seeded so the app opens in a populated state
 * for UI exploration before real fetching is tested on device.
 */
export const WELCOME_ARTICLE = {
  id: 'welcome-001',
  addedAt: new Date().toISOString(),
  originalUrl: 'https://example.com',
  title: 'Welcome to Read — your distraction-free reading space',
  byline: 'The Read Team',
  siteName: 'Read',
  excerpt: 'Explore the app — try switching themes, scrolling to see the progress bar, and selecting text to highlight.',
  thumbnail: null,
  textContent: `
    Read strips away everything that gets in the way — ads, popups, sidebars, cookie banners — and leaves you with just the words.

    You're looking at the reading view right now. The top bar fades away as you scroll down so nothing competes for your attention. Tap anywhere in the article to bring it back.

    At the very bottom of the screen you'll always see a thin progress bar showing how far through the article you are. It never hides, even when the top chrome does.

    Try selecting a word or sentence — a small popover will appear above your selection with three actions: Highlight, Copy, and Share. Highlight is listed first because this app treats it as the primary action. When you tap it, the selected text gets a coloured background that persists every time you open the article.

    To try the theme switcher, tap the back arrow and look at the top-right of the Library screen. You'll see a small segmented control with three segments: a sun, a moon, and a contrast circle. Each one sets the theme directly. The subtext below it tells you whether you're in automatic (system-matched) mode or have made an explicit choice.

    Light mode uses a clean white background with near-black text. Dark mode uses a warm near-black — not pure #000 — to be easier on the eyes in low light. Sepia uses a cream background with warm brown text, designed for long reading sessions.

    When you're ready, add a real article using the + button in the Library. Paste any newspaper URL and the app will fetch the page, extract just the article content using Mozilla's Readability engine (the same technology behind Firefox Reader View), and add it to your library. CORS proxy fetching works from the browser for most sites; on Android, the app uses native HTTP and bypasses CORS entirely.

    A few things that are not yet wired up: the Aa button opens a font settings panel (coming soon), and the archive button removes the article from your library. Swipe gestures are intentionally absent on the reading screen since scroll is already the primary gesture and swipe-to-archive would conflict with normal reading.

    That's the full tour. Enjoy reading without the clutter.
  `.trim(),
  content: `
    <p>Read strips away everything that gets in the way — ads, popups, sidebars, cookie banners — and leaves you with just the words.</p>

    <p>You're looking at the reading view right now. The top bar fades away as you scroll down so nothing competes for your attention. Tap anywhere in the article to bring it back.</p>

    <h2>The progress bar</h2>

    <p>At the very bottom of the screen you'll always see a thin progress bar showing how far through the article you are. It never hides, even when the top chrome does.</p>

    <h2>Text selection &amp; highlights</h2>

    <p>Try selecting a word or sentence — a small popover will appear above your selection with three actions: <strong>Highlight</strong>, Copy, and Share. Highlight is listed first because this app treats it as the primary action. When you tap it, the selected text gets a coloured background that persists every time you open the article.</p>

    <blockquote>Highlighting is the primary action, not a secondary one. That's why it comes before Copy.</blockquote>

    <h2>Themes</h2>

    <p>To try the theme switcher, tap the back arrow and look at the top-right of the Library screen. You'll see a small segmented control with three segments: a sun, a moon, and a contrast circle. Each one sets the theme directly. The subtext below it tells you whether you're in automatic (system-matched) mode or have made an explicit choice.</p>

    <p><strong>Light</strong> mode uses a clean white background with near-black text. <strong>Dark</strong> mode uses a warm near-black — not pure #000 — to be easier on the eyes in low light. <strong>Sepia</strong> uses a cream background with warm brown text, designed for long reading sessions.</p>

    <h2>Adding articles</h2>

    <p>When you're ready, add a real article using the <strong>+</strong> button in the Library. Paste any newspaper URL and the app will fetch the page, extract just the article content using Mozilla's Readability engine (the same technology behind Firefox Reader View), and add it to your library.</p>

    <p>CORS proxy fetching works from the browser for most sites; on Android, the app uses native HTTP and bypasses CORS entirely, so all URLs will work.</p>

    <h2>What's coming</h2>

    <p>A few things that are not yet wired up: the <em>Aa</em> button opens a font settings panel, and the archive button removes the article from your library. Swipe gestures are intentionally absent on the reading screen — scroll is already the primary gesture and swipe-to-archive would conflict with normal reading.</p>

    <p>That's the full tour. Enjoy reading without the clutter.</p>
  `.trim(),
};
