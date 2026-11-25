# Mim Creative Wear – Meta ads rules

## Seasonal relevance (always apply)
Every ad, creative and catalog product set in an active ad set must fit the current season in Egypt.

| Season | Months | Allowed | Never show |
|---|---|---|---|
| Winter | Nov–Feb | Jackets, kimonos, vests, ponchos, cardigans, scarves/shawls, knit dresses, bags & pouches | Summer/sleeveless/linen/cotton-voile dresses & tops, beach sets, swimwear (maillot/bikini), kaftans, shorts, sandals |
| Spring | Mar–Apr | Mid-season jackets, kimonos, light scarves, long-sleeve dresses, bags | Heavy knits, swimwear |
| Summer | May–Sep | Linen, cotton voile, sleeveless dresses, kaftans, beach sets, bags | Heavy knits, ponchos, winter jackets |
| Autumn | Oct | Mid-season jackets, kimonos, scarves, long-sleeve dresses, bags | Swimwear, beach sets |

How to apply:
- **Match on NAME + DESCRIPTION, never the name alone.** Many summer items (e.g. "MIM Signature Dress", "Tree of Life Cyano Dress") only reveal sleeveless/linen/voile in the description. Meta product-set filters can't search descriptions, so use the script:
  - `python3 scripts/seasonal_check.py catalog` reads all products in catalog `1556470569917729`, flags off-season items, and with `--apply` writes them into product set `1138358438822594` as a `retailer_id` exclusion list (and renames the set to the season).
  - `python3 scripts/seasonal_check.py ads` checks every active ad's body, title and IG caption, and prints thumbnails. Text can't show the garment, so **always look at each thumbnail/video frame too**.
  - Keywords, exemptions (scarves, layering jackets), year-round types (bags, pouches) and "in season" overrides (knit, mid-season) are in `scripts/seasons.json`. Add new keywords or `force_include/exclude_retailer_ids` there instead of hand-editing the filter.
- Run both checks: before creating or editing any ad, at every scheduled campaign check, after new products are added, and at each season change (Mar 1, May 1, Oct 1, Nov 1). Then pause off-season ads.

## Account basics
- Business `319567885242190`, ad account `act_2414102409349593` (EGP, Africa/Cairo), Page `562565533754895`, Instagram `17841403780813879` (@mimcreativewear), pixel `942389988869614`.
- Meta Graph API token is injected by the environment's network secret for graph.facebook.com – never print or store it.
- Ask the user before publishing, paying, or increasing budget.
