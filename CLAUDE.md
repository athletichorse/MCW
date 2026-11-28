# MIM Creative Wear (mimcreativewear.com) — store conventions

Shopify store, currency EGP, Egypt. Languages: EN (default), FR, NL, AR.
Theme edits go straight to the LIVE theme (owner's standing instruction, repeated 25–28 Nov 2026: "don't ask me to publish, edit live").
The Shopify connector can't write the live theme, so use the owner's "Mim Claude App": env vars `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`
→ client-credentials token (POST /admin/oauth/access_token, ~24h) → `themeFilesUpsert` on the MAIN theme. Back up every file first (`theme-backup/`).

## New products and images — always set these up
When a product or image is added (or found missing these), fill in:

1. **Product type** (drives Find My Size): one of `Dress`, `Top`, `Pants & Skirts`, `Jackets & Kimonos`,
   `Scarves & Shawls`, `Jumpsuit`, `Bags`, `Pouches & Sleeves`, `Home`.
   Find My Size shows only when the product has a Size option with real sizes to choose between
   (XS–3XL or 1–4); it recommends within that product's own sizes. Free size, one size or no size option = no finder
   (free-size pieces show the small "Free size, made to fit most" note instead). Never on Bags, Pouches & Sleeves, Home.
2. **Tags / categorisation**: print technique (`cyano`, `eco print`, `Block print`, `botanical`, `hand printed`),
   season (`summer essential` or `winter vibes`), and material (`Linen`, `cotton`, `VISCOSE`, `canvas`, `knit`).
   These feed the Shop-by-print tabs and the weather-aware homepage shelf.
   The print collections are smart collections on exact tags: cyano needs `cyano` + `sunprinted`, eco needs `eco`,
   block needs `block`, botanical `botanical`, hand-printed `Hand printed` (cyano, botanical, hand-printed hide sold-out).
   **Channels**: publish every active product to all sales channels (Online Store, Facebook & Instagram, Google & YouTube,
   BOTIT, Instagram Shop AI, Inbox), unless the owner has deliberately hidden it.
3. **SEO title** (≤ 60 chars): `{Name} | {Print} {Type} from Egypt – MIM`, falling back to
   `{Name} | Handmade in Egypt – MIM` or `{Name} – MIM`. Strip internal style codes (e.g. `N1/U`, `22S20`).
4. **SEO description** (≤ 155 chars): `{Name} – a {print} {material} {type}, handmade in Egypt by MIM Creative Wear.`
   then sizes (`Sizes XS–3XL`, `Relaxed sizes 1–3` or `Free size`) and
   `Cash on delivery in Egypt & worldwide shipping.` if it fits.
5. **Image alt text**: `{Product name} – {colour/print} – view N`; first image describes the garment and print.
   Uploaded files (banners, editorial): describe what is in the image plus "MIM Creative Wear".
6. **Collections**: add to the matching category collection (dresses, tops, pants, cardigan-more,
   scarves-shawls, bags-more) and print collection (cyano, eco-print, block-print, botanical, hand-printed).
7. **Translations**: add FR / NL / AR versions of title, SEO title and SEO description.
   Option names (Size, Color…) and colour names stay **English in the product data** (swatches and variant matching
   depend on it); the theme shows them in the visitor's language through `snippets/mim-tr.liquid`. When a new colour
   name appears, add it to the FR/NL/AR maps in `mim-tr` (format `english lowercase::translation`).

8. **Category tag** (the category collections are smart collections driven by these exact tags):
   `Dresses` (Dress, Jumpsuit), `Tops`, `pant` (Pants & Skirts), `jacket` (Jackets & Kimonos),
   `Scarves`, `Bags & more` (Bags, Pouches & Sleeves).
9. **Colour option** named `Color` with plain colour names (e.g. `Cobalt Blue`, `Off White`) so swatches,
   colour dots and cross-sell colour matching work. Unknown names still get a multicolour swatch.

10. **Google Merchant**: vendor `MIM Creative Wear`; Shopify taxonomy `category` set (Dresses aa-1-4, Tops aa-1-13,
    Blouses aa-1-13-1, Pants aa-1-12, Kimono jackets aa-1-23-1-2, Ponchos aa-1-10-2-8, Vests aa-1-10-6, Coats & jackets
    aa-1-10-2, Scarves aa-2-26, Tote bags lb-13, Crossbody aa-5-4-7, Shoulder bags aa-5-4-19, Handbags aa-5-4,
    Laptop sleeves el-7-8-2-4, Tablet sleeves el-7-8-4-3, Pencil cases os-3-16, Pouches lb-3, Cushion covers hg-3-14);
    metafields `mm-google-shopping.gender` (female; unisex for pouches/sleeves/home), `age_group` adult, `condition` new,
    `custom_product` true (boolean, handmade, no GTIN).
11. **Alt text template** (no style codes): first photo `{Name} – {print} {type}, handmade in Egypt by MIM Creative Wear`,
    others `{Name} – {print} {type} by MIM Creative Wear, view N of M`.
13. **Fabric** (metafield `custom.fabric`, English): read it from the description ("Fabric Composition:", "Fabric:", "Material:" or the text)
    and use one of the standard labels: `Cotton & natural viscose`, `Cotton voile`, `100% cotton`, `Cotton`, `Linen`, `Hand-loomed linen`,
    `Linen with cotton lining`, `Canvas`, `Canvas with cotton lining`, `Canvas & cotton`, `Cotton canvas`, `Cotton cashmere`,
    `Cotton & linen`, `Silk`, `Knit`. Leave it empty if the description doesn't say. A new label needs FR/NL/AR added in `snippets/mim-fabric.liquid`.
    The product page shows it in a light-teal rounded box under the price (`mim-fabric`). List as of 25 Nov 2026: `content/product_fabrics.json`.
12. Empty collections and the Wishlist page carry `seo.hidden = 1` (noindex); remove it when a collection gets products.

Never overwrite a field the owner already filled in by hand.

## Hand-printed only
The owner sells hand-printed pieces only. On 25 Oct 2026 the 34 plain pieces (no print at all) were set to Draft at
the owner's request (list in `.taste-skill/drafted-plain.json`). Borderline pieces (embroidered, colour-block,
woven ikat, hand-dyed, sprayed) were kept live on purpose. Never re-activate a drafted plain piece. When a new
upload has no print at all, tell the owner instead of featuring it; don't change its status yourself.

## Storefront rules (built into the theme — keep them when editing)
- **Every language**: any text added to the theme needs EN/FR/NL/AR (case on `request.locale.iso_code`, or `mim-tr`).
  Arabic sort labels come from `mim-sort-name`. Judge.me's widget text is set in the Judge.me app, not the theme.
- **Speed first**: never add images or extra requests to always-loaded UI (header, menus, drawers, footer).
  Images only where the visitor came to see products, and lazy-loaded below the first screen.
- **Cross-sell** ("Complete the look", "Bought together", snippet `mim-xsell`): only complementary categories
  (dress → kimonos, scarves, bags; top → pants, kimonos, scarves; …), in stock, scored by same print +4,
  shared colour +2, same fabric tag +1, same season tag +1.
- **Search**: results must contain every query word in title, type, option values or category/print tags
  (word-start match, plurals → singular); instant search searches title, type, variants and tags only.
- **Quick add**: chips show Size when it has several values, else the option with most values (usually Color);
  single-variant products get one Add button. On desktop it opens only from the + button.
- **Desktop header**: Home, Shop, Prints, Sale, About us, Contact us (small), Shop all (highlighted only on its
  page); language = current code + dropdown. Latest drops stays out of the desktop bar.
  Dawn's menu CSS (list-menu, mega-menu) is copied into `mim.css` so the bar never breaks while the page loads.
  Desktop "Find our stores" chip sits top-left of the hero, above the headline (never over photos).
- **Phone header**: menu + search left, logo centred, small language code + bag right; the account link lives
  only in the side menu. **Side menu** (rebuilt in v3.9.3, `snippets/header-drawer.liquid`, element `mim-menu`,
  classes `mmn-*`, nothing shared with Dawn's drawer): fixed full-height panel that slides in wherever the page is
  scrolled, rows animate in. Order: search box → Shop all button + New in / Sale pills → Shop (category text tiles,
  open by default) → Prints (colour-dot chips) → About MIM & help (Our Story, How to Measure, FAQs, Contact, Our stores
  as icon tiles) → Log in (with icon) + language switch → WhatsApp/Instagram/Email icons. One section open at a time.
  **No images in the menu** (no product photos, no logo image): it must add nothing to page load.
  Don't patch it with rules from the old drawer (`mim-drawer-extra`, `.menu-drawer`), which is no longer used.
- **Colour photos (rule)**: on the product page only the selected colour's photos show (gallery, counter and zoom;
  `#MimColorMedia` in main-product + mim-v35.js). So when adding photos: upload them **grouped by colour, in the same
  order as the colours**, and set each colour variant's image to the first photo of its group (every colour variant must
  have one). A colour owns its variant photo and every photo after it up to the next colour's.
- **Product photo zoom**: tapping a photo opens a sideways-swipe gallery of all photos on the tapped one, ‹ n / N ›.
- **Card colour dots**: the selected ring is drawn inside the dot (never clipped).
- **Sold-out cards** (`.mim-card.is-soldout`): photo greyscale and faded, text faded, "Sold out" badge readable.
- **Alignment**: everything (breadcrumbs, product photo, rails' first card, contact map text) starts on the page margin
  (1.5rem phone / 5rem desktop). Phone header slots are 44px; the language code is a 32px circle in the body font.
- **Photo sizes (rule, every page with product photos: cards on homepage/collection/category/search pages, product gallery,
  zoom, homepage slider)**: on 3x phones ask for about 2x-sharp photos by adding a `(min-resolution: 2.5dppx)` entry to the
  image `sizes` (cards `27vw` → 360w, gallery `66vw - 2.7rem` → 713w, zoom `66vw` + an 825w option, slider tiles 36vw/27vw).
  All collection and category pages use `mim-card`, so new collections get this automatically; any new section or snippet
  that shows product photos must do the same. The product gallery fetches the next photos once the page has loaded
  (mim-v35.js), so swiping never waits.
- **Homepage order (26 Nov 2026)**: store strip → featured slider → marquee → **Shop by category** (`mim-categories`, tile grid 2 cols phone /
  4 desktop, in shopping order: New in, Dresses, Kimonos & Jackets, Tops, Pants, Scarves & Shawls, Bags, Pouches & Sleeves; each tile uses a chosen
  in-stock product's model photo and has EN/FR/NL/AR titles; no piece counts) → Latest drops → Best sellers → Prints → weather shelf → accessories → …
  Earlier note, kept for the Latest drops style: store strip → featured slider → marquee → **Latest drops** (first product rail, collection `latest`,
  style `latest`: light-teal band, white "Just dropped" pill with a teal pulsing dot, filled teal "Shop latest" button) → weather shelf → …
- **Speed**: homepage sections after the first two use `content-visibility:auto`; the drawer stylesheet loads non-blocking.
- **Product rails** (homepage `.mim-rail__track`, `.mim-cats__rail`): one ‹ 1 / N › counter under each rail (no top arrows).
- **Card stars** (`mim-card`): gold stars + (count) under the title, from the `reviews.rating` / `reviews.rating_count`
  metafields Judge.me syncs; shown only once a piece has a published review.
- **No "Buy it now" button** (owner removed it for speed, 27 Oct 2026): `show_dynamic_checkout` stays false. One Facebook pixel
  only (the Facebook & Instagram app's, 1307043316161430); the extra custom pixel was deleted.
- **Prices without decimals (25 Nov 2026)**: the theme never shows `.00`. Use `money_without_trailing_zeros` (never plain `money`),
  `money_with_currency | replace: '.00 EGP', ' EGP'`, and `money_without_currency | append: '#' | replace: '.00#', '' | remove_last: '#'`.
  JS prices go through `money()` in `assets/mim.js`, which drops `.00`. The ship bar rounds the amount still needed up to a whole pound.
  Checkout and emails follow the store currency format (Settings → General), which only the owner can change.
- **Side menu shipping note**: a "Free delivery over 2,999 EGP · Applies to Cairo & Giza" card sits above Log in (`.mmn__ship`, 4 languages, no image).
- **Content pages** (`sections/mim-page.liquid`): FAQ pages show the page body as animated accordions (questions = `h6.tt-title`,
  `p.tt-title`, `h3` or `h6`), with search, quick facts (shipping/free delivery/exchanges/payment, 4 languages, keep in line with Shipping
  below), and a WhatsApp help card. Other pages get scroll-reveal and a sticky chapter chip bar when they have 3+ headings.
  FAQPage JSON-LD (`mim-schema`) reads the same questions.
- **Size guide page** (`/pages/how-to-measure`, `snippets/mim-size-guide.liquid`, rendered by `mim-page`): runs our own Find My Size
  model in page mode (`mim-size-finder-core` with `page_mode: true, garment_in:`), garment tabs (dress/top/pants → `setGarment`),
  a size chart drawn from the model's CHART in `mim-size-finder.js` (keep both in sync), cm/in toggle, relaxed 1–4 mapping, and the
  recommended row highlighted from the finder's `mim:size` event. Animated how-to-measure steps; the old image sits in a fold.
- **Policy pages** (`snippets/mim-policy.liquid`, only when `request.page_type == 'policy'`): MIM header and accordion sections built from
  the policy's own headings (h1–h6, bold-only paragraphs, bare `<strong>`), with Open all / Close all.
- **Fabric box (rule, 25 Nov 2026)**: every product page shows the fabric under the price in a light-teal rounded box
  (`snippets/mim-fabric.liquid`, rendered in the price block of `main-product`), label "Fabric" + value in the visitor's language.
  The value comes from metafield `custom.fabric`, read from the product description (see rule 13); hidden when empty.
  Keep it when editing the product page, and keep every fabric label translated in FR/NL/AR.
- **Bought together** (`mim-fbt`): the current piece is highlighted (teal border, tinted card, "This item" pill, bigger photo); add-ons are
  compact. Options are chip buttons (one row per option, sold-out values crossed out), never dropdowns; a single value shows as one chip.
- **Footer**: no light gap under it. `html` background is the footer ink colour; the room for the sticky add-to-cart bar sits inside the dark footer.
- **Gallery arrows**: when the selected colour has a single photo, the slider arrows and counter are hidden (`mim-one` in mim-v35.js).
- **Product page**: one-photo slider with arrows and "1 / N" counter; Judge.me star badge under the title and
  review widget below the product; gold stars (#D4AF37).

## Homepage SEO (Online Store → Preferences — owner edits manually)
- Title: Hand-Printed Women's Clothing Made in Egypt | MIM Creative Wear
- Description: Shop hand-printed dresses, kimonos, tops, scarves & bags made in Egypt with cyanotype, eco & block prints. Sizes XS–3XL. Cash on delivery & worldwide shipping.

## Shipping (set 25 Nov 2026)
- Egypt Standard (2–5 days): Cairo & Giza 85 EGP (incl. 6th of October, Helwan), free over 2,999 EGP in Cairo & Giza only;
  Alexandria 120 EGP; rest of Egypt 150 EGP. Express 120 EGP (1–2 days) in Cairo & Giza only. Local pickup off.
  Set in both delivery profiles that cover Egypt ("General profile" zones 1–7 and "Eu"). Keep the shipping policy, FAQ and the FAQ
  quick facts (`mim-page`, a1) in line, in 4 languages.
- Worldwide (all other countries): 1,200 EGP up to 4,000 EGP order, 3,200 EGP above. Charged in EGP (payment gateway is single-currency).
  International prices are +40% (Global market price list). Theme free-shipping bar (`mim-ship-bar`) must match 2,999.

## Policies, FAQ and blog (25 Nov 2026)
- The 4 store policies (shipping, refund, privacy, terms) were published from `content/policies_en.json`, with FR/NL/AR
  translations from `content/policy_translations_fr_nl_ar.py`. If a policy changes, update all 4 languages (h3 headings feed the accordions).
- The FAQ page body (EN) and its FR/NL/AR translations come from `content/faq_en_fr_nl_ar.py` (h3 questions). Keep it in line with
  Shipping above and the policies.
- The only blog post ("How To Measure ?") is unpublished; `/blogs/news/how-to-measure` 301-redirects to `/pages/how-to-measure`,
  and the empty blog carries `seo.hidden = 1`. Remove that if posts are added.
- Backups of everything replaced are in `policy_backup/`.

## Stores (used on the contact page map and the "Find our stores" buttons)
- MIM Creative Wear Office — Ghoneim St., 2nd floor, apt. 2, off El Gameya St., opposite Mamlouk, Fustat, Cairo. 012 22116237. Google Maps: "Mim Creative Wear Office".
- MIM Creative Wear (CSA Maadi) — 4 Road 21, CSA, Maadi, Cairo. 011 02220008. Google Maps: "Mim creative wear (CSA Maadi)".

## Daily rule
A scheduled task ("MIM daily product & image setup", 9:31 Cairo) wakes this session each day and applies the
"New products and images" rules above to anything new or missing.
