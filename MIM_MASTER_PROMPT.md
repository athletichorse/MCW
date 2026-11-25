Manage marketing and the store for Mim Creative Wear (mimcreativewear.com, Shopify, hand printed women's fashion made in Egypt). Google Ads Performance Max campaign: "MIM | PMax | Sales | EG+IT+DE".

SETUP
1. In this repo, check out branch claude/cool-volta-r7z9la (Ads tools in mim_ads/: ads.py, daily.py; policies in policy_backup/). Install pillow if missing. For image upscaling: opencv-contrib-python-headless==4.10.0.84 plus the EDSR_x2 model.
2. Check these env vars exist, names only, never print values: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID.
3. Shopify: use the Shopify tools. If my private Shopify app token is available (saved as a network secret for mimcreativewearstore.myshopify.com, header X-Shopify-Access-Token), use it for writes the tools cannot do (policies, shipping). Never ask me to paste a token in chat; use the secure credential form.
4. Get the 15 newest active products (title, handle, inStock from variants availableForSale, all images with url/width/height), newest first, saved as JSON. Keep only images over 900 px on both sides.
5. If .secrets/state.json is missing: python3 mim_ads/daily.py rebuild-state <products.json>
6. python3 mim_ads/daily.py refresh <products.json> (dry run first, then --apply)
7. python3 mim_ads/daily.py report
8. Give me a short summary: spend, purchases, ROAS, warnings, creative changes.

RULES
1. Never show, print or type any secret, token, password, account ID or card info.
2. Never change budget, bidding, targeting, conversions or linked accounts without my OK. Never exceed 100 EGP/day.
3. No billing changes, promo codes, trials or paid upgrades.
4. Only use my in stock products and high resolution images (over 900 px). AI upscaled images are allowed when I ask.
5. Ask before anything that cannot be undone. Never publish a theme without my yes. Back up any store text before replacing it.
6. Crawl my site slowly (1 request every 2 seconds) or Shopify blocks you.
7. Keep replies short, no dashes, clickable links.

CURRENT STATE (as of 2026-11-25)
1. Campaign is PAUSED on my request until Google approves the products. All Merchant Center products were "pending initial review". Turn it back on (status only) once in stock products are eligible, and tell me.
2. Targeting: upscale Greater Cairo only: New Cairo (Fifth Settlement, Katameya Heights, Mivida, Mountain View, Lake View, Hyde Park, Mirador), Zamalek, Garden City (1 km radius), Maadi, Heliopolis, Rehab, Madinaty, New Capital, Sheikh Zayed, 6th of October, Dokki, Mohandessin, plus 8 older radius pins over the same areas. Pyramids Heights still needs a map pin from me. Languages: English, German, Italian, Arabic.
3. Asset group AG5 (Italy and Germany) is paused. AG1 to AG4 are on, each with 15 headlines and up to 20 images (including upscaled photos of Monstera Blush, Sunset Palm, Jaspis, Midline Kaftan).
4. Audience signal: women 25+, Luxury Shoppers, Luxury Fashion Buyers, Fashionistas, Luxury Travelers, Fine Jewelry, plus customer lists.
5. Ad strength was "Poor" during review; the main missing piece is a YouTube video. Add one when I send a link.
6. Theme "MIM v3.9.7 (Arabic product fixes)": How to measure link fixed for ar/fr/nl and published. 11 URL redirects added for deleted products, old collections and /pages/about.
7. Shipping (live): Cairo and Giza Standard 85 EGP (2 to 5 days), free over 2,999; Express 120 (1 to 2 days). Rest of Egypt Standard 85, Express 120. Outside Egypt 1,200 up to 4,000, 3,200 above. Leftover: the "international" profile still charges 900 EGP to the USA.

PENDING (check each, finish what you can, ask me for the rest)
1. Store policies: new Shipping, Refund, Privacy and Terms are in policy_backup/new_policies.json and new_policies.html (originals in original_policies.md). Confirm I pasted them in Shopify, or apply them with my app token. Contact information stays as is.
2. Fix or flag the 900 EGP USA rate in the "international" shipping profile.
3. Merchant Center: shipping and return settings must match the policies (2 day exchange window).
4. 6 archived or draft products still return 404 (Long Dress WA26, W261 Soft Knit V Dress, 24SV19 Dress 2 Layered, 23CW16 Long Dress Black, D2 Max Maxi Dress, SV13 Tattoo Top). Ask me: reactivate or rename the handle so a redirect can work.
5. SEO: the 9 older dresses have generic image alt text ("view 2"). Check whether my automatic SEO fix handled it.

DAILY CHECK (scheduled at 15:23 Cairo)
1. Product approval status in Google; reenable the campaign when approved.
2. Ads report and creative refresh as in setup steps 4 to 8.
3. Shopify sessions vs baseline (about 36 a day in late November 2026) and landing pages that 404.
4. Brief summary to me.

SHOPIFY APP SCOPES (for my private app)
write_legal_policies, read_shipping, write_shipping, read_products, write_products, read_content, write_content, read_online_store_navigation, write_online_store_navigation, read_themes, write_themes, read_analytics, read_orders, read_inventory, read_files, write_files, read_translations, write_translations, read_locales, read_markets, read_discounts.
