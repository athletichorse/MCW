# MIM Creative Wear (mimcreativewear.com) — store conventions

Shopify store, currency EGP, Egypt. Languages: EN (default), FR, NL, AR.
Theme work happens on an unpublished copy (the connector cannot write the live theme); the owner publishes.

## New products and images — always set these up
When a product or image is added (or found missing these), fill in:

1. **Product type** (drives Find My Size): one of `Dress`, `Top`, `Pants & Skirts`, `Jackets & Kimonos`,
   `Scarves & Shawls`, `Jumpsuit`, `Bags`, `Pouches & Sleeves`, `Home`.
   Find My Size shows automatically on every type except Bags, Pouches & Sleeves and Home.
2. **Tags / categorisation**: print technique (`cyano`, `eco print`, `Block print`, `botanical`, `hand printed`),
   season (`summer essential` or `winter vibes`), and material (`Linen`, `cotton`, `VISCOSE`, `canvas`, `knit`).
   These feed the Shop-by-print tabs and the weather-aware homepage shelf.
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
