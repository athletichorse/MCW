#!/usr/bin/env python3
"""Keep Mim Creative Wear ads relevant to the current season.

Meta product-set filters can only match a product's name, so this script reads
every product's NAME + DESCRIPTION + TYPE, flags off-season items by keyword,
and writes them into the product set filter as a retailer_id exclusion list.
It also checks the text (ad body, IG caption, Page post) of every active ad.

Usage:
  python3 scripts/seasonal_check.py catalog            # report only
  python3 scripts/seasonal_check.py catalog --apply    # update the product set
  python3 scripts/seasonal_check.py ads                # flag active ads
  add --season winter|spring|summer|autumn to override the date.

The Graph API token is injected by the environment's network proxy; never pass it here.
Text checks can't see images: always look at the ad thumbnails printed by `ads` too.
"""
import argparse, datetime, json, os, re, subprocess, urllib.parse

G = "https://graph.facebook.com/v21.0"
CFG = json.load(open(os.path.join(os.path.dirname(__file__), "seasons.json")))


def get(path, **params):
    url = path if path.startswith("http") else f"{G}/{path}?{urllib.parse.urlencode(params)}"
    out = subprocess.run(["curl", "-sg", url], capture_output=True, text=True).stdout
    return json.loads(out)


def get_all(path, **params):
    d = get(path, **params)
    rows = d.get("data", [])
    while d.get("paging", {}).get("next"):
        d = get(d["paging"]["next"])
        rows += d.get("data", [])
    if "error" in d:
        raise SystemExit(d["error"]["message"])
    return rows


def post(path, **fields):
    args = ["curl", "-s", "-X", "POST", f"{G}/{path}"]
    for k, v in fields.items():
        args += ["--form-string", f"{k}={v}"]
    return json.loads(subprocess.run(args, capture_output=True, text=True).stdout)


def current_season(override=None):
    if override:
        return override
    m = datetime.date.today().month
    return next(s for s, c in CFG["seasons"].items() if m in c["months"])


def hits(text, season, ptype=""):
    c = CFG["seasons"][season]
    t = (text or "").lower()
    found = []
    for kw in c["off_season"]:
        if ptype in c.get("exempt_types", {}).get(kw, []):
            continue
        if re.search(r"(?<![a-z])" + re.escape(kw.lower()), t):
            found.append(kw)
    return found


def hits_in_season(text, season):
    t = (text or "").lower()
    return [k for k in CFG["seasons"][season].get("in_season", []) if k in t]


def catalog(season, apply):
    prods = get_all(f"{CFG['catalog_id']}/products",
                    fields="retailer_id,name,description,product_type,availability", limit=200)
    excl, report = set(CFG["force_exclude_retailer_ids"]), {}
    for p in prods:
        ptype = p.get("product_type", "")
        if p["retailer_id"] in CFG["force_include_retailer_ids"] or ptype in CFG.get("year_round_types", []):
            continue
        # A keyword in the NAME always excludes. A keyword found only in the DESCRIPTION
        # is ignored for exempt types, or when the description also says it's in season
        # (e.g. "soft knit", "mid-season").
        h = hits(p.get("name"), season, ptype)
        if not h:
            h = hits(p.get("description"), season, ptype)
            if h and hits_in_season(p.get("description"), season):
                h = []
        if h:
            excl.add(p["retailer_id"])
            report.setdefault(p["name"], set()).update(h)
    print(f"Season: {season}. {len(prods)} products scanned, {len(excl)} variants excluded "
          f"({len(report)} products):")
    for n, h in sorted(report.items()):
        print(f"  - {n}  [{', '.join(sorted(h))}]")
    flt = {"and": [{"availability": {"eq": "in stock"}},
                   {"retailer_id": {"is_not_any": sorted(excl)}}]}
    if apply:
        r = post(CFG["product_set_id"], filter=json.dumps(flt),
                 name=f"MCW – In stock – In season ({season.title()})")
        print("Applied:", r)
        print("Product set count:", get(CFG["product_set_id"], fields="product_count").get("product_count"))
        kept = get_all(f"{CFG['product_set_id']}/products", fields="name,product_type", limit=200)
        print("Now showing:", " | ".join(sorted({k["name"] for k in kept})))


def ads(season):
    rows = get_all(f"{CFG['ad_account']}/ads", limit=100,
                   fields="name,effective_status,adset{name},creative{body,title,thumbnail_url,"
                          "effective_instagram_media_id,effective_object_story_id,product_set_id}",
                   effective_status=json.dumps(["ACTIVE", "PENDING_REVIEW", "IN_PROCESS"]))
    for a in rows:
        c = a.get("creative", {})
        texts = [c.get("body"), c.get("title")]
        if c.get("effective_instagram_media_id"):
            texts.append(get(c["effective_instagram_media_id"], fields="caption").get("caption"))
        if c.get("product_set_id"):
            texts.append(f"[catalog ad → product set {c['product_set_id']}: run `catalog`]")
        h = hits(" ".join(t for t in texts if t), season)
        flag = "OFF-SEASON? " + ", ".join(h) if h else "ok (text)"
        print(f"{a['adset']['name']} | {a['name']} | {flag}")
        print(f"    thumbnail (check visually): {c.get('thumbnail_url', '')[:120]}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["catalog", "ads"])
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--season")
    a = ap.parse_args()
    s = current_season(a.season)
    catalog(s, a.apply) if a.mode == "catalog" else ads(s)
