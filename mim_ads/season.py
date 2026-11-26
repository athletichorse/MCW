"""Season rule for the MIM PMax campaign: keep every ad in season.

Egypt seasons: winter = November to March, summer = April to October.
In winter, exclude products tagged summer ("summer essential", "Summer essentials",
"summer 2026", Summerdress, Beachdress, Resortwear, Vacationwear, Poolside attire...)
unless they also carry "winter vibes". In summer, exclude products tagged "winter vibes"
unless they also carry a summer tag. Bags, pouches, pencil cases and laptop/tablet
cases are all season and are never excluded.

Usage:
  python3 mim_ads/season.py check  <offseason_ids.json>   # report groups out of rule
  python3 mim_ads/season.py apply  <offseason_ids.json>   # rebuild listing filters

offseason_ids.json: list of Shopify product ids (numbers as strings) that are out of
season right now. Build it each run from Shopify tags (see rule above).
Also: never add images or text naming off season products; daily.py refresh skips
products whose "season" field is off season.
"""
import sys, json, datetime
from ads import q, call, state, errors


def current_season(d=None):
    m = (d or datetime.date.today()).month
    return 'winter' if m in (11, 12, 1, 2, 3) else 'summer'


def wanted_exclusions(cid, ids):
    ids = set(map(str, ids))
    items = [x['shoppingProduct']['itemId'] for x in
             q(f"SELECT shopping_product.item_id FROM shopping_product WHERE campaign.id={cid}")]
    return sorted({i.lower() for i in items if len(i.split('_')) > 2 and i.split('_')[2] in ids})


def group_exclusions(gid):
    rows = q(f"SELECT asset_group_listing_group_filter.type, asset_group_listing_group_filter.case_value.product_item_id.value "
             f"FROM asset_group_listing_group_filter WHERE asset_group.id={gid}")
    return {r['assetGroupListingGroupFilter'].get('caseValue', {}).get('productItemId', {}).get('value', '').lower()
            for r in rows if r['assetGroupListingGroupFilter']['type'] == 'UNIT_EXCLUDED'}


def rebuild(cu, grn, gid, excl):
    roots = [x['assetGroupListingGroupFilter']['resourceName'] for x in
             q(f"SELECT asset_group_listing_group_filter.resource_name, asset_group_listing_group_filter.parent_listing_group_filter "
               f"FROM asset_group_listing_group_filter WHERE asset_group.id={gid}")
             if not x['assetGroupListingGroupFilter'].get('parentListingGroupFilter')]
    base = f'customers/{cu}/assetGroupListingGroupFilters/{gid}~'
    ops = [{'assetGroupListingGroupFilterOperation': {'remove': r}} for r in roots]
    if not excl:
        ops.append({'assetGroupListingGroupFilterOperation': {'create': {'resourceName': base + '-1', 'assetGroup': grn,
                    'type': 'UNIT_INCLUDED', 'listingSource': 'SHOPPING'}}})
    else:
        ops.append({'assetGroupListingGroupFilterOperation': {'create': {'resourceName': base + '-1', 'assetGroup': grn,
                    'type': 'SUBDIVISION', 'listingSource': 'SHOPPING'}}})
        for i, it in enumerate(excl):
            ops.append({'assetGroupListingGroupFilterOperation': {'create': {'resourceName': f'{base}-{i + 2}', 'assetGroup': grn,
                        'type': 'UNIT_EXCLUDED', 'listingSource': 'SHOPPING', 'parentListingGroupFilter': base + '-1',
                        'caseValue': {'productItemId': {'value': it}}}}})
        ops.append({'assetGroupListingGroupFilterOperation': {'create': {'resourceName': f'{base}-{len(excl) + 2}', 'assetGroup': grn,
                    'type': 'UNIT_INCLUDED', 'listingSource': 'SHOPPING', 'parentListingGroupFilter': base + '-1',
                    'caseValue': {'productItemId': {}}}}})
    return errors(call('googleAds:mutate', {'mutateOperations': ops}))


def main():
    cmd, path = sys.argv[1], sys.argv[2]
    s = state(); cid = s['campaign']; cu = s['customer']
    excl = wanted_exclusions(cid, json.load(open(path)))
    print(f'Season: {current_season()}. Off season feed items: {len(excl)}')
    ok = True
    for g in q(f"SELECT asset_group.resource_name, asset_group.name, asset_group.id FROM asset_group WHERE campaign.id={cid}"):
        gid, grn, name = g['assetGroup']['id'], g['assetGroup']['resourceName'], g['assetGroup']['name']
        if group_exclusions(gid) == set(excl):
            print(f'  {name}: in season')
            continue
        ok = False
        if cmd == 'apply':
            err = rebuild(cu, grn, gid, excl)
            print(f'  {name}: ' + (f'FAILED {err[:200]}' if err else 'fixed'))
            ok = ok or not err
        else:
            print(f'  {name}: NEEDS FIX')
    sys.exit(0 if ok or cmd == 'apply' else 1)


if __name__ == '__main__':
    main()
