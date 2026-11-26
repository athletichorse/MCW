"""Daily monitor and product refresh for the Mim Creative Wear PMax campaign.

Usage:
  python3 mim_ads/daily.py report
  python3 mim_ads/daily.py refresh products.json          # dry run
  python3 mim_ads/daily.py refresh products.json --apply  # make changes
  python3 mim_ads/daily.py rebuild-state products.json    # new machine: recreate .secrets/state.json

products.json: list of Shopify products, newest first:
  [{"handle", "title", "inStock": bool, "offSeason": bool, "images": [{"url","width","height"}]}]

Hard rules baked in: never touches budgets, bidding, targeting, conversions,
links or other accounts. Only swaps creatives (images/text) in the asset groups.
"""
import sys, json, io, base64, urllib.request
from ads import q, call, state, save_state, errors

BUDGET_CAP_MICROS = 100_000_000  # 100 EGP/day
NEW_GROUP = 'AG3 | New arrivals'
NEW_COUNT = 6          # products featured in the New arrivals group
MIN_HEIGHT = 1000      # only use high resolution photos
MAX_IMAGES = 20        # Google limit per asset group (all image types)


def egp(m):
    return round(int(m or 0) / 1e6, 2)


# ---------------------------------------------------------------- report
def report():
    s = state(); cid = s['campaign']
    warn = []
    c = q(f"SELECT campaign.status, campaign.primary_status, campaign.primary_status_reasons, "
          f"campaign_budget.amount_micros FROM campaign WHERE campaign.id = {cid}")[0]
    budget = int(c['campaignBudget']['amountMicros'])
    print(f"Campaign: {c['campaign']['status']} / {c['campaign'].get('primaryStatus')} "
          f"{c['campaign'].get('primaryStatusReasons', [])}")
    print(f"Budget: {egp(budget)} EGP/day")
    if budget > BUDGET_CAP_MICROS:
        warn.append(f'BUDGET ABOVE CAP: {egp(budget)} EGP/day')
    for label, rng in (('Yesterday', 'YESTERDAY'), ('Last 7 days', 'LAST_7_DAYS'), ('This month', 'THIS_MONTH')):
        r = q(f"SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, "
              f"metrics.conversions_value FROM campaign WHERE campaign.id = {cid} AND segments.date DURING {rng}")
        m = r[0]['metrics'] if r else {}
        cost = egp(m.get('costMicros')); conv = float(m.get('conversions', 0)); val = float(m.get('conversionsValue', 0))
        roas = f"{val / cost:.2f}" if cost else '-'
        print(f"{label}: cost {cost} EGP, impr {m.get('impressions', 0)}, clicks {m.get('clicks', 0)}, "
              f"purchases {conv:g}, value {val:.0f} EGP, ROAS {roas}")
        if rng == 'YESTERDAY' and cost > 2 * egp(budget):
            warn.append(f'Yesterday spend {cost} EGP is above 2x budget')
    print('Asset groups:')
    for x in q(f"SELECT asset_group.name, asset_group.primary_status, asset_group.primary_status_reasons, "
               f"asset_group.ad_strength FROM asset_group WHERE campaign.id = {cid} AND asset_group.status != 'REMOVED'"):
        g = x['assetGroup']
        print(f"  {g['name']}: {g.get('primaryStatus')} {g.get('primaryStatusReasons', [])} strength {g.get('adStrength')}")
    r = q(f"SELECT asset_group.name, metrics.cost_micros, metrics.clicks, metrics.conversions, metrics.conversions_value "
          f"FROM asset_group WHERE campaign.id = {cid} AND segments.date DURING LAST_7_DAYS")
    if r:
        print('Asset groups, last 7 days:')
        for x in r:
            m = x['metrics']
            print(f"  {x['assetGroup']['name']}: cost {egp(m.get('costMicros'))} EGP, clicks {m.get('clicks', 0)}, "
                  f"purchases {float(m.get('conversions', 0)):g}, value {float(m.get('conversionsValue', 0)):.0f} EGP")
    bad = q(f"SELECT asset_group.name, asset.name, asset.text_asset.text, asset_group_asset.field_type, "
            f"asset_group_asset.primary_status FROM asset_group_asset WHERE campaign.id = {cid} "
            f"AND asset_group_asset.primary_status = 'NOT_ELIGIBLE'")
    for x in bad:
        a = x['asset']
        warn.append(f"Disapproved/not eligible asset in {x['assetGroup']['name']}: "
                    f"{a.get('name') or a.get('textAsset', {}).get('text')}")
    print('WARNINGS:' if warn else 'No warnings.')
    for w in warn:
        print('  ' + w)


# ---------------------------------------------------------------- images
def _fetch(url):
    from PIL import Image
    return Image.open(io.BytesIO(urllib.request.urlopen(url).read())).convert('RGB')


def _jpeg(im):
    b = io.BytesIO(); im.save(b, 'JPEG', quality=90); return b.getvalue()


def crop_portrait(im, top=0.04):
    w, h = im.size; ch = int(w * 5 / 4); y = min(int(h * top), h - ch)
    return im.crop((0, max(y, 0), w, max(y, 0) + ch))


def crop_square(im, top=0.05):
    w, h = im.size; y = min(int(h * top), h - w)
    return im.crop((0, max(y, 0), w, max(y, 0) + w))


def triptych(ims):
    from PIL import Image
    W, H = 1200, 628; pw = W // 3; out = Image.new('RGB', (W, H), 'white')
    for i, im in enumerate(ims[:3]):
        w, h = im.size; ch = int(w * H / pw); y = min(int(h * 0.05), h - ch)
        out.paste(im.crop((0, y, w, y + ch)).resize((pw, H)), (i * pw, 0))
    return out


def best_image(p):
    imgs = [i for i in p.get('images', []) if (i.get('height') or 0) >= MIN_HEIGHT and i['height'] > i['width']]
    return imgs[0] if imgs else None


# ---------------------------------------------------------------- refresh
def refresh(products_path, apply):
    s = state(); cid = s['campaign']; A = s['assets']
    products = json.load(open(products_path))
    in_stock = {p['handle'] for p in products if p.get('inStock')}
    title = {p['handle']: p['title'] for p in products}
    # season rule: products marked offSeason (see season.py) never get new ads
    usable = [p for p in products if p.get('inStock') and not p.get('offSeason') and best_image(p)]
    target = usable[:NEW_COUNT]
    target_h = [p['handle'] for p in target]
    print('New arrivals target:', ', '.join(title[h] for h in target_h))

    links = q(f"SELECT asset_group.resource_name, asset_group.name, asset.resource_name, asset.type, "
              f"asset_group_asset.field_type, asset_group_asset.resource_name FROM asset_group_asset "
              f"WHERE campaign.id = {cid} AND asset_group_asset.status != 'REMOVED'")
    by_group = {}
    for x in links:
        by_group.setdefault(x['assetGroup']['name'], []).append(x)

    ops_remove, ops_add, notes = [], [], []
    new_assets = []  # (tempname, op, meta)
    tmp_id = [0]

    def tmp():
        tmp_id[0] -= 1
        return f"customers/{s['customer']}/assets/{tmp_id[0]}"

    def add_image(group_rn, im, field, handles, name):
        rn = tmp()
        new_assets.append({'assetOperation': {'create': {'resourceName': rn, 'name': name, 'type': 'IMAGE',
                           'imageAsset': {'data': base64.b64encode(_jpeg(im)).decode()}}}})
        ops_add.append({'assetGroupAssetOperation': {'create': {'assetGroup': group_rn, 'asset': rn, 'fieldType': field}}})
        A[rn] = {'kind': 'landscape' if field == 'MARKETING_IMAGE' else 'image', 'handles': handles, 'name': name}

    def add_text(group_rn, text, field, handles):
        rn = tmp()
        new_assets.append({'assetOperation': {'create': {'resourceName': rn, 'textAsset': {'text': text}}}})
        ops_add.append({'assetGroupAssetOperation': {'create': {'assetGroup': group_rn, 'asset': rn, 'fieldType': field}}})
        A[rn] = {'kind': 'text', 'handles': handles, 'text': text}

    cache = {}

    def photo(h):
        if h not in cache:
            p = next(p for p in products if p['handle'] == h)
            cache[h] = _fetch(best_image(p)['url'])
        return cache[h]

    for gname, rows in by_group.items():
        grn = rows[0]['assetGroup']['resourceName']
        count = lambda f: sum(1 for r in rows if r['assetGroupAsset']['fieldType'] == f)
        n_sq, n_ls = count('SQUARE_MARKETING_IMAGE'), count('MARKETING_IMAGE')
        n_img = sum(1 for r in rows if r['asset']['type'] == 'IMAGE')
        is_new = gname == NEW_GROUP
        keep_h = set(target_h) if is_new else in_stock
        present = set()
        for r in rows:
            meta = A.get(r['asset']['resourceName'])
            if not meta:
                continue
            f = r['assetGroupAsset']['fieldType']
            stale = [h for h in meta['handles'] if h not in keep_h]
            if not stale:
                present.update(meta['handles']) if meta['kind'] == 'image' else None
                continue
            if meta['kind'] == 'landscape':
                pool = [h for h in (target_h if is_new else [p['handle'] for p in usable])]
                if len(pool) >= 3:
                    add_image(grn, triptych([photo(h) for h in pool[:3]]), 'MARKETING_IMAGE', pool[:3], 'MIM ls ' + ','.join(pool[:3]))
                    ops_remove.append(r['assetGroupAsset']['resourceName'])
                    notes.append(f"{gname}: replace landscape with sold out/old item(s) {stale}")
                else:
                    notes.append(f"{gname}: landscape has {stale} but not enough products to rebuild")
                continue
            if f == 'SQUARE_MARKETING_IMAGE' and n_sq <= 1:
                notes.append(f"{gname}: kept last square image ({stale})")
                continue
            if meta['kind'] == 'text' and is_new:
                ops_remove.append(r['assetGroupAsset']['resourceName'])
                notes.append(f"{gname}: remove text naming {stale}: {meta['text']}")
                continue
            if meta['kind'] == 'image':
                ops_remove.append(r['assetGroupAsset']['resourceName'])
                n_img -= 1
                if f == 'SQUARE_MARKETING_IMAGE':
                    n_sq -= 1
                notes.append(f"{gname}: remove image of {stale}")

        if is_new:
            n_head = count('HEADLINE') - sum(1 for r in rows if r['asset']['resourceName'] in A and A[r['asset']['resourceName']]['kind'] == 'text'
                                             and r['assetGroupAsset']['fieldType'] == 'HEADLINE'
                                             and any(h not in keep_h for h in A[r['asset']['resourceName']]['handles']))
            named = {h for r in rows for h in A.get(r['asset']['resourceName'], {}).get('handles', [])
                     if A.get(r['asset']['resourceName'], {}).get('kind') == 'text' and h in keep_h}
            for h in target_h:
                if h not in present and n_img + 2 <= MAX_IMAGES:
                    im = photo(h)
                    add_image(grn, crop_portrait(im), 'PORTRAIT_MARKETING_IMAGE', [h], f'MIM p45 {h}')
                    add_image(grn, crop_square(im), 'SQUARE_MARKETING_IMAGE', [h], f'MIM sq {h}')
                    n_img += 2
                    notes.append(f"{gname}: add photos of {title[h]}")
                if h not in named and n_head < 15:
                    for t in (f"New: {title[h]}", f"Just In: {title[h]}", f"{title[h]}, Just In"):
                        if len(t) <= 30:
                            add_text(grn, t, 'HEADLINE', [h]); n_head += 1
                            notes.append(f"{gname}: add headline '{t}'"); break
            # refresh the product-naming description and long headline
            names = [title[h] for h in target_h[:3]]
            if names and not any(A.get(r['asset']['resourceName'], {}).get('kind') == 'text'
                                 and r['assetGroupAsset']['fieldType'] == 'DESCRIPTION'
                                 and set(A[r['asset']['resourceName']]['handles']) <= keep_h
                                 and len(A[r['asset']['resourceName']]['handles']) > 0 for r in rows):
                d = f"Meet the {', '.join(names[:-1])} and {names[-1]}. New, hand-printed, limited." if len(names) > 1 else f"Meet the {names[0]}. New, hand-printed, limited."
                if len(d) <= 90:
                    add_text(grn, d, 'DESCRIPTION', target_h[:3]); notes.append(f"{gname}: add description '{d}'")
            if len(names) >= 2 and not any(A.get(r['asset']['resourceName'], {}).get('kind') == 'text'
                                           and r['assetGroupAsset']['fieldType'] == 'LONG_HEADLINE'
                                           and set(A[r['asset']['resourceName']]['handles']) <= keep_h
                                           and A[r['asset']['resourceName']]['handles'] for r in rows):
                lh = f"New hand-printed arrivals: the {names[0]}, {names[1]} and more"
                if len(lh) <= 90:
                    add_text(grn, lh, 'LONG_HEADLINE', target_h[:2]); notes.append(f"{gname}: add long headline '{lh}'")

    if not notes:
        print('No changes needed.')
        return
    print('\n'.join(notes))
    if not apply:
        print('(dry run, nothing changed)')
        return
    # add first, then remove, so minimum asset counts are always met
    ops = new_assets + ops_add
    if ops:
        r = call('googleAds:mutate', {'mutateOperations': ops})
        if errors(r):
            raise SystemExit('Add failed: ' + errors(r))
        res = r['mutateOperationResponses']
        for i, op in enumerate(new_assets):
            tmp_rn = op['assetOperation']['create']['resourceName']
            A[res[i]['assetResult']['resourceName']] = A.pop(tmp_rn)
    if ops_remove:
        r = call('googleAds:mutate', {'mutateOperations': [{'assetGroupAssetOperation': {'remove': rn}} for rn in ops_remove]})
        if errors(r):
            print('Some removals failed: ' + errors(r))
    s['assets'] = {k: v for k, v in A.items() if '/-' not in k}
    save_state(s)
    print('Applied.')


# ---------------------------------------------------------------- rebuild state
CAMPAIGN_NAME = 'MIM | PMax | Sales | EG+IT+DE'
OLD_LANDSCAPES = {  # first build, named by theme
    'ls_craft': ['bashera-tree-bo2ga', 'bashera-tree-jacket', 'inside-out-vest'],
    'ls_elite': ['bashera-tree-jacket', 'tunic-dress-hand-stitching', 'scarf-poncho'],
    'ls_new': ['scarf-poncho', 'cozy-collar', 'inside-out-vest'],
    'ls_back': ['scarf-poncho', 'bashera-tree-bo2ga', 'cozy-collar'],
    'ls_intl': ['scarf-poncho', 'tunic-dress-hand-stitching', 'bashera-tree-jacket']}


def rebuild_state(products_path):
    import os, re
    from ads import STATE_PATH, ROOT
    cust, login = os.environ.get('GOOGLE_ADS_CUSTOMER_ID'), os.environ.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
    if not (cust and login):
        raise SystemExit('Set GOOGLE_ADS_CUSTOMER_ID and GOOGLE_ADS_LOGIN_CUSTOMER_ID first.')
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    json.dump({'customer': cust, 'login': login, 'campaign': '', 'groups': {}, 'assets': {}}, open(STATE_PATH, 'w'))
    camp = q(f"SELECT campaign.id FROM campaign WHERE campaign.name = '{CAMPAIGN_NAME}' AND campaign.status != 'REMOVED'")[0]['campaign']['id']
    products = json.load(open(products_path))
    stems = {}
    for p in products:
        stems[p['handle']] = p['handle']
        for i in p.get('images', []):
            stems[re.sub(r'\.(jpe?g|png|webp)$', '', i['url'].split('/')[-1].split('?')[0])] = p['handle']
    rows = q(f"SELECT asset_group.resource_name, asset_group.name, asset.resource_name, asset.name, asset.type, "
             f"asset.text_asset.text, asset_group_asset.field_type FROM asset_group_asset "
             f"WHERE campaign.id = {camp} AND asset_group_asset.status != 'REMOVED'")
    groups, assets = {}, {}
    for x in rows:
        groups[x['assetGroup']['name']] = x['assetGroup']['resourceName']
        a = x['asset']; rn = a['resourceName']
        if a['type'] == 'TEXT':
            if x['assetGroup']['name'] != NEW_GROUP:
                continue
            t = a['textAsset']['text'].lower()
            hs = [p['handle'] for p in products if p['title'].lower() in t]
            if hs:
                assets[rn] = {'kind': 'text', 'handles': hs, 'text': a['textAsset']['text']}
            continue
        nm = a.get('name', '').replace('MIM ', '')
        if nm in OLD_LANDSCAPES:
            assets[rn] = {'kind': 'landscape', 'handles': OLD_LANDSCAPES[nm], 'name': nm}
        elif nm.startswith('ls '):
            assets[rn] = {'kind': 'landscape', 'handles': nm[3:].split(','), 'name': nm}
        else:
            key = re.sub(r'^(p45|sq)[_ ]', '', nm)
            if key in stems:
                assets[rn] = {'kind': 'image', 'handles': [stems[key]], 'name': nm}
    save_state({'customer': cust, 'login': login, 'campaign': camp, 'groups': groups, 'assets': assets})
    print(f'State rebuilt: {len(groups)} asset groups, {len(assets)} mapped assets.')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'report'
    if cmd == 'report':
        report()
    elif cmd == 'rebuild-state':
        rebuild_state(sys.argv[2])
    elif cmd == 'refresh':
        refresh(sys.argv[2], '--apply' in sys.argv)
    else:
        print(__doc__)
