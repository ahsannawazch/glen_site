# Glen Private Label Service: website

Static site (HTML + CSS + vanilla JS, no build step). Built from `glen-final.html` with the client's supplied images.
Upload the contents of this folder (not the folder itself) to `public_html` on Hostinger.

```
index.html            the home page
skincare-line/, factory/, packaging/, certifications/   one static page each (index.html); the first three open from the hero tiles
assets/css, js        styles and behaviour
assets/img            optimised images (WebP, two sizes each), logos, favicons, share image
assets/fonts          Inter (self-hosted, SIL OFL), so no Google Fonts request
worker/               contact-form handler (Cloudflare Worker + Resend). Do NOT upload to Hostinger
robots.txt, sitemap.xml, .htaccess, favicon.ico
```

Preview locally: `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

## Before launch (open items)

| # | Item | Where |
|---|------|-------|
| 1 | **Contact form is not connected.** Deploy `worker/` (below), then paste its URL into `data-endpoint=""` on `<form id="cform">`. Until then the form shows its error message (it never fakes success). | `index.html` |
| 2 | **Confirm the domain.** `glenprivatelabel.com` is assumed from the email address. It is used in canonical, Open Graph, JSON-LD, robots.txt, sitemap.xml and `worker/wrangler.toml`. Search-and-replace if different. | several |
| 3 | **Testimonials are final** — 18 real quotes from `testimonials.pdf` published verbatim. The other two supplied drafts were **dropped at the client's direction (2 Nov)**. No star ratings shown (the PDF has none). Portfolio spellings now match the client's PDF: Aylin Organics, Ecrin Cosmetics, Fleek Pure. | `index.html` |
| 4 | **Claims status (2 Nov)**: "Pakistan's #1" and "6+ countries" — client confirmed keep as-is. Founding year — client left it open; the site keeps "Since 1984" until decided. "200+ Active Formulas" — restored per developer, still unconfirmed. Certifications still need scans/numbers. Stats are client-supplied: 1,500+ brands served, 1,000+ finished-product brands, 500+ bulk clients, 10,000 pcs/day, 250,000 pcs/month, 100 tons/month. "8 Services" vs "Six Product Categories" — **resolved**: hero bar now says 6 Services (client decision). | copy |
| 5 | **Several photos look AI-generated** (factory, lab, shop-window renders). The certificate-wall and office photos — removed in Oct — were **re-added on 5 Nov at the client's insistence**, now in their own **"The Glen Office"** block on the factory page (not under "On the Production Floor"). The office sign reads "Since 1966" against the page's 1984, accepted for now, to be resolved. Factory-page image captions were removed on 5 Nov (client request); real photos are still better for a factory page. | sub-pages |
| 5b | **Certification badges placed but unverified.** The five supplied badges are in the **About collage** on the home page (DRAP in the wide box, ISO + PCSIR and GMP + Halal in the two lower boxes), with a **"Check Certification Details →"** button linking to the new **`/certifications/` page** (added 5 Nov: each badge with its issuing body / standard description, using only public facts about the bodies plus existing site copy). **Removed from the factory page on 5 Nov (client feedback: not needed there).** Badge wording ("ISO 9001:2015 Certified", "100% Halal Certified", "GMP Certified") is stronger than the old tags ("ISO-Grade", "GMP Compliant"). Still needed from the client for the page: certificate numbers, exact issuing bodies/registrars, scope, validity dates. | home page, certifications page |
| 5c | **Sub-page text is the mockup's own copy, reused.** Each page has `DATA NEEDED` comments marking what the client must supply (specs, capacity, pack types, catalogue, permissions). | `skincare-line/`, `factory/`, `packaging/` |
| 6 | **Permissions**: four third-party brands in Portfolio (Aylin, Ecrin, FleekPure, Cosmeze) and the Shopify logo in one image. | portfolio / services |
| 7 | **No privacy policy / terms** yet, though the form collects personal data. | footer |
| 8 | Share image (`og-image.jpg`) and favicons were generated from the logo/hero; ask the designers for proper ones. | assets/img |
| 9 | Phone/WhatsApp `+92 300 123 4567` was kept as the client confirmed it is real; send a test message before launch. | several |
| 10 | Analytics not installed. | |
| 11 | `.htaccess` is untested on the client's plan. Try it on a staging subdomain first, delete it if it causes a 500 error. | `.htaccess` |

## Contact form (Cloudflare Worker + Resend, both free at this volume)

1. Resend: create an account, verify the sending domain (adds DNS records), create an API key.
2. In `worker/`: `npx wrangler login`, edit the three variables in `wrangler.toml`, then
   `npx wrangler secret put RESEND_API_KEY` and `npx wrangler deploy`.
3. Put the resulting `https://….workers.dev` URL in `data-endpoint` on the form.
4. Submit a real enquiry from the live site and check it arrives, and that Reply goes to the visitor.

The worker only accepts requests from `ALLOWED_ORIGINS`, drops bot submissions (hidden field, too-fast submit), blocks header injection, and sends plain text only.

## Changes from the mockup

**Bugs fixed:** form stayed visible after submit; hamburger icon never fully became an X; ticker jumped when looping; testimonials 4 and 5 unreachable on phones (carousel now sized from the layout, with swipe); double gap above hero; "Get a Quote" button in the phone menu had invisible text; service-card links were dead (they now jump to the form with that category chosen); copyright year now automatic.

**Added:** working form submit with validation and error states; keyboard focus styles, skip link, ARIA for menu/FAQ/carousel, form labels; reduced-motion support; SEO tags and structured data; lazy-loaded responsive images; self-hosted font.

**Pages (added 25 Oct)**
- The three hero tiles are placeholders again, as in the mockup, and each now links to its own page: `skincare-line/`, `factory/`, `packaging/`. The About collage is back to the mockup's placeholders too.
- Tile behaviour: at rest the labels look exactly as in the mockup (faint capitals on the gradient). On hover, or keyboard focus, a solid chip with an arrow appears; clicking or tapping opens the page. `.htaccess` blocks `README.md` and `worker/` so internal notes are not served if uploaded.
- Each page: breadcrumb, header with photo, content from the mockup's copy, gallery, links to the other two pages, quote button. Quote buttons open the home-page form with the category chosen (`/?category=Skincare#contact`).
- Footer links point to the pages; sitemap lists them. Nav and mobile menu links go to the home-page sections.
- Pages are plain static HTML (no build step). To add a fourth page, copy one folder and edit it.

**Content changes you should know about**
- Portfolio: six invented projects became the four real brands supplied. Filters changed to All / Skincare / Body Care / Hair Removal (categories inferred from the product labels, so correct them if needed). 2×2 grid.
- Form category list gained Packaging & Labeling, Product Photography and Shopify Store Setup, to match the service cards.
- Small text colours darkened slightly to meet WCAG AA contrast (the original light brown was 2.9:1 on peach).

Left as the client wrote it: all headline claims, counts ("Six Product Categories" vs "8 Services"), FAQ answers.
