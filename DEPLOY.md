# Deploying jskjs.org

Two parts: put the code on **GitHub** (github.com/kchecker/jskjs), then publish the website on **Hostinger**. There is no GitHub Pages site — jskjs.org on Hostinger is the only website.

---

## Part 1 — Create the GitHub repository

1. Sign in to GitHub as **kchecker** → **New repository**.
2. Name: `jskjs`. Visibility: **Public**. Do **not** add a README, licence or .gitignore (the project already has them). Click **Create repository**.
3. On your computer, unzip `jskjs-repo.zip`, open a terminal in that folder and run:

   ```bash
   git init -b main
   git add -A
   git commit -m "jsKjs 1.0.0"
   git remote add origin https://github.com/kchecker/jskjs.git
   git push -u origin main
   ```

   (Or with GitHub Desktop: *File → Add local repository → Publish repository*.)
4. Optional polish on the repo page: ⚙ next to **About** → Website `https://jskjs.org`, topics `jquery htmx alpinejs gsap javascript vibe-coding`.
5. Create a release: **Releases → Draft a new release → tag `v1.0.0`** → title "jsKjs 1.0.0" → paste `CHANGELOG.md` → **Publish**.

The **Actions** tab will run two workflows on every push: `CI` (unit tests) and `Build site for Hostinger`, which builds the website and pushes it to a branch called `hostinger`.

---

## Part 2 — Publish on Hostinger

### Before you start
- In hPanel, point the domain **jskjs.org** at your hosting plan (Domains → DNS / nameservers).
- Turn on **SSL** for jskjs.org (hPanel → Security → SSL → install the free certificate). Do this first — the site's `.htaccess` redirects every visit to HTTPS.
- Check **PHP 8.1 or newer** (hPanel → Advanced → PHP Configuration). The demo endpoints use `str_contains`.

### Option A — upload the zip (simplest, recommended for launch day)
1. hPanel → **Websites → Manage → File Manager** → open `public_html`.
2. Delete the default `default.php` / `index.php` placeholder if present.
3. **Upload** `jskjs-org-hostinger.zip`, right-click it → **Extract** into `public_html`, then delete the zip.
4. Make sure hidden files came across: `public_html/.htaccess` must exist (File Manager → Settings → show hidden files).
5. Visit https://jskjs.org — then https://jskjs.org/api/ping.php should print `pong`.

To update later: build again (or download the `hostinger` branch as a zip from GitHub) and repeat.

### Option B — automatic deploys from GitHub
After Part 1, the `Build site for Hostinger` workflow keeps a ready-to-serve `hostinger` branch up to date.
1. hPanel → **Websites → Dashboard → Advanced → Git**.
2. **Connect with GitHub**, authorise Hostinger for the `kchecker/jskjs` repository.
3. Repository `kchecker/jskjs`, **branch `hostinger`**, directory `public_html` → **Deploy**.
4. Turn **Auto-deployment** on. Every push to `main` now rebuilds and republishes the site.

Note: deploying overwrites files in `public_html`, so use an empty `public_html` for the first deploy.

---

## Part 3 — Search engines and analytics

1. **Google Search Console** → Add property → **Domain** `jskjs.org` → add the TXT record it gives you in hPanel DNS → Verify.
2. Search Console → **Sitemaps** → submit `https://jskjs.org/sitemap.xml` (75 pages).
3. **Bing Webmaster Tools** → Import from Google Search Console (one click).
4. Google Analytics (`G-1LYDFZTTQZ`) is already on every page — check **Realtime** after your first visit.
5. Test a page in the [Rich Results Test](https://search.google.com/test/rich-results) and a share preview with any Open Graph checker — every page has its own 1200×630 image.

---

## Checklist after going live
- [ ] https://jskjs.org loads over HTTPS, `www.` redirects to the bare domain
- [ ] https://jskjs.org/api/ping.php → `pong`; the live search on the home page returns results
- [ ] https://jskjs.org/cdn/1.0.0/jskjs.min.js loads, and the CDN page's SRI snippet works from another site
- [ ] https://jskjs.org/nothing-here shows the custom 404 page
- [ ] https://jskjs.org/download/ drum roll reveals github.com/kchecker/jskjs (repo must be public)
- [ ] Sitemap submitted in Search Console
