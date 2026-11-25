"""Minimal Google Ads REST client for Mim Creative Wear.

Secrets come from env vars (GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
GOOGLE_ADS_LOGIN_CUSTOMER_ID). Asset/state data lives in .secrets/state.json. If the refresh token env var is missing, it falls
back to .secrets/google-ads-refresh-token (gitignored). Never print them.
"""
import os, json, urllib.request, urllib.parse, urllib.error

V = 'v26'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_PATH = os.path.join(ROOT, '.secrets', 'state.json')  # gitignored
_AT = None


def _refresh_token():
    t = os.environ.get('GOOGLE_ADS_REFRESH_TOKEN')
    if t:
        return t
    p = os.path.join(ROOT, '.secrets', 'google-ads-refresh-token')
    if os.path.exists(p):
        return open(p).read().strip()
    raise SystemExit('Missing GOOGLE_ADS_REFRESH_TOKEN (env var or .secrets file).')


def token():
    global _AT
    if not _AT:
        d = urllib.parse.urlencode(dict(
            client_id=os.environ['GOOGLE_ADS_CLIENT_ID'],
            client_secret=os.environ['GOOGLE_ADS_CLIENT_SECRET'],
            refresh_token=_refresh_token(), grant_type='refresh_token')).encode()
        _AT = json.load(urllib.request.urlopen('https://oauth2.googleapis.com/token', d))['access_token']
    return _AT


def state():
    s = json.load(open(STATE_PATH))
    # account IDs come from env vars when set, so none are stored in git
    s['customer'] = os.environ.get('GOOGLE_ADS_CUSTOMER_ID', s.get('customer'))
    s['login'] = os.environ.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID', s.get('login'))
    return s


def save_state(s):
    json.dump(s, open(STATE_PATH, 'w'), indent=1)


def call(path, body, cid=None, login=None):
    s = state()
    cid = cid or s['customer']
    login = login or s['login']
    req = urllib.request.Request(
        f'https://googleads.googleapis.com/{V}/customers/{cid}/{path}',
        data=json.dumps(body).encode(),
        headers={'Authorization': 'Bearer ' + token(), 'login-customer-id': login,
                 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'ERROR': json.load(e)}


def q(query, **kw):
    out, page = [], None
    while True:
        body = {'query': query}
        if page:
            body['pageToken'] = page
        r = call('googleAds:search', body, **kw)
        if 'ERROR' in r:
            raise RuntimeError(json.dumps(r['ERROR'])[:1500])
        out += r.get('results', [])
        page = r.get('nextPageToken')
        if not page:
            return out


def errors(r):
    if 'ERROR' not in r:
        return None
    e = r['ERROR']['error']
    det = e.get('details', [{}])[0].get('errors', [])
    return '; '.join(f"{json.dumps(x.get('errorCode'))} {x.get('message')}" for x in det) or e.get('message')
