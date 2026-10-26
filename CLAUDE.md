# MIM Creative Wear (mimcreativewear.com) — store conventions

Shopify store, currency EGP, Egypt. Languages: EN (default), FR, NL, AR.
Theme work happens on an unpublished copy (the connector cannot write the live theme); the owner publishes.

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

8. **Category tag** (the category collections are smart collections driven by these exact tags):
   `Dresses` (Dress, Jumpsuit), `Tops`, `pant` (Pants & Skirts), `jacket` (Jackets & Kimonos),
   `Scarves`, `Bags & more` (Bags, Pouches & Sleeves).
9. **Colour option** named `Color` with plain colour names (e.g. `Cobalt Blue`, `Off White`) so swatches,
   colour dots and cross-sell colour matching work. Unknown names still get a multicolour swatch.

Never overwrite a field the owner already filled in by hand.

## Hand-printed only
The owner sells hand-printed pieces only. On 25 Oct 2026 the 34 plain pieces (no print at all) were set to Draft at
the owner's request (list in `.taste-skill/drafted-plain.json`). Borderline pieces (embroidered, colour-block,
woven ikat, hand-dyed, sprayed) were kept live on purpose. Never re-activate a drafted plain piece. When a new
upload has no print at all, tell the owner instead of featuring it; don't change its status yourself.

## Storefront rules (built into the theme — keep them when editing)
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
  scrolled, rows animate in. Order: search box → Shop all button + New in / Sale pills → Shop (category photo tiles,
  open by default) → Prints (colour-dot chips) → About MIM & help (Our Story, How to Measure, FAQs, Contact, Our stores
  as icon tiles) → Log in (with icon) + language switch → WhatsApp/Instagram/Email icons. One section open at a time.
  Don't patch it with rules from the old drawer (`mim-drawer-extra`, `.menu-drawer`), which is no longer used.
- **Product photo zoom**: tapping a photo opens a sideways-swipe gallery of all photos on the tapped one, ‹ n / N ›.
- **Card colour dots**: the selected ring is drawn inside the dot (never clipped).
- **Sold-out cards** (`.mim-card.is-soldout`): photo greyscale and faded, text faded, "Sold out" badge readable.
- **Alignment**: everything (breadcrumbs, product photo, rails' first card, contact map text) starts on the page margin
  (1.5rem phone / 5rem desktop). Phone header slots are 44px; the language code is a 32px circle in the body font.
- **Speed**: homepage sections after the first two use `content-visibility:auto`; the drawer stylesheet loads non-blocking.
- **Product rails** (homepage `.mim-rail__track`, `.mim-cats__rail`): one ‹ 1 / N › counter under each rail (no top arrows).
- **Card stars** (`mim-card`): gold stars + (count) under the title, from the `reviews.rating` / `reviews.rating_count`
  metafields Judge.me syncs; shown only once a piece has a published review.
- **Product page**: one-photo slider with arrows and "1 / N" counter; Judge.me star badge under the title and
  review widget below the product; gold stars (#D4AF37).

## Homepage SEO (Online Store → Preferences — owner edits manually)
- Title: Hand-Printed Women's Clothing Made in Egypt | MIM Creative Wear
- Description: Shop hand-printed dresses, kimonos, tops, scarves & bags made in Egypt with cyanotype, eco & block prints. Sizes XS–3XL. Cash on delivery & worldwide shipping.

## Stores (used on the contact page map and the "Find our stores" buttons)
- MIM Creative Wear Office — Ghoneim St., 2nd floor, apt. 2, off El Gameya St., opposite Mamlouk, Fustat, Cairo. 012 22116237. Google Maps: "Mim Creative Wear Office".
- MIM Creative Wear (CSA Maadi) — 4 Road 21, CSA, Maadi, Cairo. 011 02220008. Google Maps: "Mim creative wear (CSA Maadi)".

## Daily rule
A scheduled task ("MIM daily product & image setup", 9:31 Cairo) wakes this session each day and applies the
"New products and images" rules above to anything new or missing.
