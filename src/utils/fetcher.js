import { CapacitorHttp } from '@capacitor/core';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { Capacitor } from '@capacitor/core';
import { log, Category, isEnabled } from './logger';

// Dev-only local proxy: routes through Vite's server middleware, no CORS issues.
// The Vite server fetches the URL server-side and forwards the response.
async function fetchViaProxy(url) {
  const proxyUrl = `/proxy/${url}`;
  log.info(Category.FETCH, `Using local Vite dev proxy`, { url, proxyUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    if (!html || html.length < 500) {
      throw new Error(`Response too short (${html?.length ?? 0} bytes)`);
    }

    log.info(Category.FETCH, `Local proxy success`, { bytes: html.length });
    return html;
  } catch (err) {
    clearTimeout(timeoutId);
    log.error(Category.FETCH, `Local proxy failed`, { error: err.message });
    throw new Error(
      `Local proxy failed: ${err.message}. Make sure the dev server is running (npm run dev). ` +
      `On Android/iOS the app bypasses CORS natively.`
    );
  }
}


function extractThumbnail(doc) {
  const og = doc.querySelector('meta[property="og:image"]');
  if (og?.content) return og.content;
  const tw = doc.querySelector('meta[name="twitter:image"]');
  if (tw?.content) return tw.content;
  const img = doc.querySelector('article img, .article img, main img');
  if (img?.src) return img.src;
  return null;
}

/**
 * Parses the Next.js __NEXT_DATA__ payload that LiveMint (and many HT Media properties)
 * embed in their pages. This bypasses Readability entirely and reconstructs a
 * semantically correct, clean HTML document from the structured API data.
 *
 * Handles: paragraph, image, heading, list, quote, alsoread, embed, listicleElement
 */
function parseNextData(doc) {
  const scriptTag = doc.getElementById('__NEXT_DATA__');
  if (!scriptTag) return null;

  try {
    const data = JSON.parse(scriptTag.textContent);
    const storyDetails = data?.props?.pageProps?.storyDetails;

    if (!storyDetails || !Array.isArray(storyDetails.listElement)) return null;

    log.info(Category.PARSE, `Found Next.js structured data payload`, {
      elements: storyDetails.listElement.length,
    });

    const parts = [];

    for (const el of storyDetails.listElement) {
      // Skip paywalled elements
      if (el.paywallElement) continue;

      switch (el.type) {
        case 'paragraph': {
          const body = el.paragraph?.body;
          if (body) parts.push(body); // already wrapped in <p>...</p>
          break;
        }

        case 'heading': {
          const text = el.heading?.title || el.title || el.heading?.body;
          if (text) parts.push(`<h2>${text}</h2>`);
          break;
        }

        case 'image': {
          // Pick the highest quality image available
          const imgs = el.image?.images ?? {};
          const imgUrl =
            imgs['1600x900'] ||
            imgs['fullImage'] ||
            imgs['1200x900'] ||
            imgs['bigImage'] ||
            imgs['optimize'] ||
            el.image?.imageUrl;
          const caption = el.image?.caption?.trim() || '';
          const credit = el.image?.imageCredit?.trim() || '';
          const alt = caption || el.image?.alternateText || el.title || '';

          if (imgUrl) {
            const creditHtml = credit ? ` <span class="img-credit">${credit}</span>` : '';
            const captionHtml = caption || credit
              ? `<figcaption>${caption}${creditHtml}</figcaption>`
              : '';
            parts.push(`<figure><img src="${imgUrl}" alt="${alt}" />${captionHtml}</figure>`);
          }
          break;
        }

        case 'list': {
          const items = el.listItems ?? el.list?.items ?? [];
          if (items.length) {
            const liHtml = items.map(li => `<li>${li}</li>`).join('');
            parts.push(`<ul>${liHtml}</ul>`);
          }
          break;
        }

        case 'listicleElement': {
          // Numbered callout cards (e.g. "5 things you should know")
          const title = el.title || el.listicleElement?.title;
          const body = el.listicleElement?.paragraph?.body || el.listicleElement?.body;
          if (title || body) {
            const titleHtml = title ? `<h3>${title}</h3>` : '';
            parts.push(`<div class="listicle-item">${titleHtml}${body || ''}</div>`);
          }
          break;
        }

        case 'quote': {
          const text = el.quote?.body || el.quote?.title || el.title;
          const author = el.quote?.author || el.quote?.source;
          if (text) {
            const authorHtml = author ? `<cite>— ${author}</cite>` : '';
            parts.push(`<blockquote>${text}${authorHtml}</blockquote>`);
          }
          break;
        }

        case 'alsoread': {
          // Render as a tasteful "Also Read" callout instead of a raw link
          const linkTitle = el.alsoread?.title || el.title;
          const linkUrl = el.alsoread?.pageUrl || el.alsoread?.url;
          if (linkTitle && linkUrl) {
            parts.push(
              `<aside class="also-read"><span class="also-read-label">Also Read</span>` +
              `<a href="${linkUrl}">${linkTitle}</a></aside>`
            );
          }
          break;
        }

        case 'embed': {
          // Skip social embeds (Twitter, Instagram) — they require JS to render
          // and would break the clean reading experience
          break;
        }

        default:
          log.debug(Category.PARSE, `Unhandled element type: ${el.type}`);
      }
    }

    const html = parts.join('');

    return {
      title: storyDetails.headline || storyDetails.title,
      byline:
        storyDetails.authorDetails?.map(a => a.name).join(', ') ||
        storyDetails.createdBy ||
        '',
      content: html,
      textContent: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      length: html.length,
      excerpt: storyDetails.summary || storyDetails.quickReadSummary || '',
      siteName: storyDetails.publication || 'LiveMint',
    };
  } catch (err) {
    log.warn(Category.PARSE, `Failed to parse __NEXT_DATA__ payload`, { error: err.message });
  }
  return null;
}


export async function fetchAndParseArticle(url) {
  const fetchStart = Date.now();
  log.info(Category.FETCH, `fetchAndParseArticle called`, {
    url,
    platform: Capacitor.getPlatform(),
    loggingEnabled: isEnabled(),
  });

  try {
    let htmlContent = '';

    if (Capacitor.getPlatform() !== 'web') {
      log.info(Category.FETCH, `Using CapacitorHttp (native, no CORS)`, { url });
      const reqStart = Date.now();
      const response = await CapacitorHttp.get({
        url,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        },
      });
      log.info(Category.FETCH, `CapacitorHttp response`, {
        status: response.status,
        bytes: response.data?.length ?? 0,
        elapsed_ms: Date.now() - reqStart,
      });
      htmlContent = response.data;
    } else {
      htmlContent = await fetchViaProxy(url);
    }

    // Fix relative URLs
    const parseStart = Date.now();
    log.debug(Category.PARSE, `Parsing HTML with DOMParser`, { htmlBytes: htmlContent.length });
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const base = doc.createElement('base');
    base.href = url;
    doc.head.prepend(base);

    const thumbnail = extractThumbnail(doc);
    log.debug(Category.PARSE, `Thumbnail extracted`, { thumbnail });

    let article = parseNextData(doc);
    
    if (article) {
      log.debug(Category.PARSE, `Parsed successfully from Next.js payload`);
    } else {
      log.debug(Category.PARSE, `Running Readability as fallback`);
      const reader = new Readability(doc, { charThreshold: 100, keepClasses: false });
      article = reader.parse();
    }

    if (!article) {
      log.error(Category.PARSE, `Readability returned null`, { url });
      throw new Error('Could not extract article content. The page may require JavaScript to render.');
    }

    log.info(Category.PARSE, `Readability success`, {
      title: article.title,
      byline: article.byline,
      siteName: article.siteName,
      length: article.length,
      excerptLength: article.excerpt?.length ?? 0,
      elapsed_ms: Date.now() - parseStart,
    });

    const cleanHtml = DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: [
        'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'cite', 'strong', 'em', 'b', 'i',
        'a', 'img', 'figure', 'figcaption', 'mark', 'code', 'pre',
        'aside', 'div', 'span',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    });

    log.info(Category.FETCH, `fetchAndParseArticle complete`, {
      url,
      total_elapsed_ms: Date.now() - fetchStart,
    });

    return {
      title: article.title,
      byline: article.byline,
      dir: article.dir,
      content: cleanHtml,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      siteName: article.siteName,
      thumbnail,
      originalUrl: url,
    };
  } catch (error) {
    log.error(Category.FETCH, `fetchAndParseArticle failed`, {
      url,
      error: error.message,
      stack: error.stack,
      elapsed_ms: Date.now() - fetchStart,
    });
    throw error;
  }
}
