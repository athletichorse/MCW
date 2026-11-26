import sys,json,os,re,time,subprocess
sys.path.insert(0,'.'); from gql import *; from media_plan import P
D=json.load(open('newprod.json'))
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower().replace('&','and')).strip('-')
files={}
for part in sorted(os.listdir('newimg')):
    for prod in os.listdir('newimg/'+part):
        for col in os.listdir(f'newimg/{part}/{prod}'):
            files.setdefault(prod,{})[col]=sorted(os.listdir(f'newimg/{part}/{prod}/{col}'),key=lambda x:int(re.search(r'#(\d+)',x).group(1)))
            files[prod][col]=[f'newimg/{part}/{prod}/{col}/{f}' for f in files[prod][col]]
def upload(path,fname):
    r=gql('mutation($i:[StagedUploadInput!]!){stagedUploadsCreate(input:$i){stagedTargets{url resourceUrl parameters{name value}} userErrors{message}}}',{'i':[{'resource':'IMAGE','filename':fname,'mimeType':'image/jpeg','httpMethod':'POST','fileSize':str(os.path.getsize(path))}]})
    t=r['data']['stagedUploadsCreate']['stagedTargets'][0]
    a=['curl','-s','-o','/dev/null','-w','%{http_code}','-X','POST',t['url']]
    for p in t['parameters']: a+=['--form-string',f"{p['name']}={p['value']}"]
    a+=['-F',f'file=@{path}']
    for k in range(3):
        if subprocess.run(a,capture_output=True,text=True).stdout in('201','204'): return t['resourceUrl']
        time.sleep(3)
    raise Exception('upload failed '+path)
def run(name):
    pl=P[name]; p=D[name]['p']; pid=p['id']; title=p['title'].replace(' - ',' ').strip()
    old=[m['id'] for m in p['media']['nodes'] if m.get('image')]
    # 1 upload + create
    created={}  # colour -> [media ids]
    for kind,val in pl['order']:
        if kind!='N': continue
        inputs=[]
        for i,f in enumerate(files[name][val]):
            view=re.search(r'#\d+ - (\w+)',f).group(1)
            fname=f"{slug(title)}-{slug(val)}-{slug(view)}.jpg"
            alt=(f"{title} in {val} – {pl['desc']}, handmade in Egypt by MIM Creative Wear" if i==0
                 else f"{title} in {val} – {view.lower()} view, {pl['desc']} by MIM Creative Wear")
            inputs.append({'originalSource':upload(f,fname),'alt':alt,'mediaContentType':'IMAGE'})
        r=gql('mutation($id:ID!,$m:[CreateMediaInput!]!){productCreateMedia(productId:$id,media:$m){media{id} mediaUserErrors{message}}}',{'id':pid,'m':inputs})
        d=r['data']['productCreateMedia']; assert not d['mediaUserErrors'],d['mediaUserErrors']
        created[val]=[m['id'] for m in d['media']]
    # 2 wait ready
    allnew=[i for v in created.values() for i in v]
    for t in range(60):
        r=gql('query($id:ID!){product(id:$id){media(first:120){nodes{id status}}}}',{'id':pid})['data']['product']['media']['nodes']
        st={m['id']:m['status'] for m in r}
        if all(st.get(i)=='READY' for i in allnew): break
        if any(st.get(i)=='FAILED' for i in allnew): raise Exception('media failed')
        time.sleep(3)
    # 3 variant images (before deleting old ones)
    vmap={}
    for col,src in pl['var'].items():
        vmap[col]= old[src[1]-1] if isinstance(src,tuple) else created[src][0]
    if vmap:
        vs=[]
        for v in p['variants']['nodes']:
            c=[s['value'] for s in v['selectedOptions'] if s['name'].lower() in('color','colour')]
            if c and c[0] in vmap: vs.append({'id':v['id'],'mediaId':vmap[c[0]]})
        r=gql('mutation($p:ID!,$v:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$p,variants:$v){userErrors{field message}}}',{'p':pid,'v':vs})
        assert not r['data']['productVariantsBulkUpdate']['userErrors'],r
    # 4 delete replaced
    keep={old[v-1] for k,v in pl['order'] if k=='O'}
    dele=[m for m in old if m not in keep]
    if dele:
        r=gql('mutation($id:ID!,$m:[ID!]!){productDeleteMedia(productId:$id,mediaIds:$m){deletedMediaIds mediaUserErrors{message}}}',{'id':pid,'m':dele})
        assert not r['data']['productDeleteMedia']['mediaUserErrors'],r
    # 5 order
    final=[]
    for k,v in pl['order']: final+= created[v] if k=='N' else [old[v-1]]
    moves=[{'id':m,'newPosition':str(i)} for i,m in enumerate(final)]
    r=gql('mutation($id:ID!,$m:[MoveInput!]!){productReorderMedia(id:$id,moves:$m){job{id} mediaUserErrors{message}}}',{'id':pid,'m':moves})
    assert not r['data']['productReorderMedia']['mediaUserErrors'],r
    time.sleep(4)
    got=[m['id'] for m in gql('query($id:ID!){product(id:$id){media(first:120){nodes{id}}}}',{'id':pid})['data']['product']['media']['nodes']]
    return {'product':name,'handle':p['handle'],'new':len(allnew),'deleted':len(dele),'order_ok':got==final,'final_count':len(got)}
if __name__=='__main__':
    res=[]
    for n in sys.argv[1:]:
        try: r=run(n)
        except Exception as e: r={'product':n,'error':str(e)[:300]}
        print(json.dumps(r,ensure_ascii=False),flush=True); res.append(r)
    json.dump(res,open('apply_log_%d.json'%int(time.time()),'w'),ensure_ascii=False)
