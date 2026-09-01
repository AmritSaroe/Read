/**
 * Welcome article — pre-seeded so the app opens in a populated state
 * for UI exploration before real fetching is tested on device.
 */
export const WELCOME_ARTICLE = {
  id: 'welcome-001',
  addedAt: new Date().toISOString(),
  originalUrl: 'https://example.com',
  title: 'The Quiet Rebellion of Deep Reading',
  byline: 'The Read Team',
  siteName: 'Read',
  excerpt: 'In an age of endless notifications and infinite feeds, choosing to sit still and read a single article is a radical act of focus.',
  thumbnail: null,
  textContent: `In an age of endless notifications, algorithmic feeds, and ephemeral micro-content, choosing to sit down and read a single article without interruption is quietly rebellious. It is a deliberate act of focus in a world designed to distract you. Every time you open an article on the modern web, you are immediately assaulted. Banners slide down from the ceiling. Chat bubbles pop up from the floor. Modals demand your email address before you've even read the first paragraph. The text itself is sliced into tiny fragments, separated by aggressive advertisements designed to pull your eyes away from the words. The medium is no longer just the message; the medium is a marketplace, and your attention is the product.

Reclaiming the Page
Read was built as a sanctuary from the noise. It is a digital quiet room. When you strip away the frantic architecture of the modern web, you are left with something profound: typography, space, and thought. A well-crafted sentence doesn't need to compete with a blinking banner ad. It only asks for your time.

"Reading is not a passive consumption of words, but an active collaboration with the author's mind."

The interface of this app was designed with a single goal: to disappear. As you scroll, the top bar fades away. There are no share buttons flashing at the bottom, no suggested articles begging for your next click. There is only the text, formatted in a way that respects the mechanics of the human eye.

The Mechanics of Focus
Try switching to Sepia mode if you are reading a long essay; the reduced contrast is significantly softer on your retinas during extended sessions. If you are reading at night, the Dark mode uses a warm charcoal rather than a harsh, pure black. If you find a sentence that resonates, simply long-press to select it. The highlight function is built to feel tactile and immediate, letting you anchor important thoughts without breaking your flow.

We built this because we love the web, but we missed the joy of getting lost in a good piece of writing. So go ahead. Add your favorite long-form articles, essays, and news stories. Take a deep breath, and just read.`,
  content: `
    <p>In an age of endless notifications, algorithmic feeds, and ephemeral micro-content, choosing to sit down and read a single article without interruption is quietly rebellious. It is a deliberate act of focus in a world designed to distract you.</p>

    <p>Every time you open an article on the modern web, you are immediately assaulted. Banners slide down from the ceiling. Chat bubbles pop up from the floor. Modals demand your email address before you've even read the first paragraph. The text itself is sliced into tiny fragments, separated by aggressive advertisements designed to pull your eyes away from the words.</p>

    <p>The medium is no longer just the message; the medium is a marketplace, and your attention is the product.</p>

    <h2>Reclaiming the Page</h2>

    <p><em>Read</em> was built as a sanctuary from the noise. It is a digital quiet room.</p>

    <p>When you strip away the frantic architecture of the modern web, you are left with something profound: typography, space, and thought. A well-crafted sentence doesn't need to compete with a blinking banner ad. It only asks for your time.</p>

    <blockquote>“Reading is not a passive consumption of words, but an active collaboration with the author's mind.”</blockquote>

    <p>The interface of this app was designed with a single goal: to disappear. As you scroll, the top bar fades away. There are no share buttons flashing at the bottom, no suggested articles begging for your next click. There is only the text, formatted in a way that respects the mechanics of the human eye.</p>

    <h2>The Mechanics of Focus</h2>

    <p>Try switching to <strong>Sepia</strong> mode if you are reading a long essay; the reduced contrast is significantly softer on your retinas during extended sessions. If you are reading at night, the <strong>Dark</strong> mode uses a warm charcoal rather than a harsh, pure black.</p>

    <p>If you find a sentence that resonates, simply long-press to select it. The native highlight function is built to feel tactile and immediate, letting you anchor important thoughts without breaking your flow.</p>

    <p>We built this because we love the web, but we missed the joy of getting lost in a good piece of writing. So go ahead. Add your favorite long-form articles, essays, and news stories. Take a deep breath, and just read.</p>
  `.trim(),
};
