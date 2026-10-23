/* Single source of truth for site-wide values */
module.exports = {
  SITE: 'https://jskjs.org',
  GITHUB: 'https://github.com/kchecker/jskjs',
  GITHUB_ZIP: 'https://github.com/kchecker/jskjs/archive/refs/heads/main.zip',
  VERSION: '1.0.0',
  RELEASE_DATE: 'October 2026',
  YEAR: 2026,
  // Change attribution here — it updates every page, JSON-LD and meta tag.
  AUTHORS: 'Karan Checker and Claude (Fable 5 / Opus 4.8)',
  AUTHOR_PEOPLE: [{ '@type': 'Person', name: 'Karan Checker', url: 'https://github.com/kchecker' }],
  ASSET_V: '20261023',
  KJ_GZ_KB: '8.1', // overwritten at build from the real minified file
  // Measured with gzip -9 on the official minified builds (npm, October 2026)
  SIZES: [
    { name: 'jQuery', ver: '4.0.0', gz: 27392 },
    { name: 'htmx', ver: '2.0.11', gz: 16838 },
    { name: 'Alpine.js', ver: '3.17.5', gz: 19911 },
    { name: 'GSAP core', ver: '3.15.0', gz: 28268 },
  ],
  GA: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-1LYDFZTTQZ"></script>
<script>   window.dataLayer = window.dataLayer || [];   function gtag(){dataLayer.push(arguments);}   gtag('js', new Date());    gtag('config', 'G-1LYDFZTTQZ'); </script>`,
};
