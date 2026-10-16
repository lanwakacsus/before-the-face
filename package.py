from pathlib import Path
import base64, json, re, zipfile
root = Path(__file__).resolve().parent
out = root.parent / 'output'
out.mkdir(exist_ok=True)
assets = {name: 'data:image/png;base64,' + base64.b64encode((root/'assets'/f'{name}.png').read_bytes()).decode() for name in ['cafe','alex','jamie','rowan','maya','daniel','sam']}
scene_names = ['neighborhood','alex-books','ben-noodles','morgan-chair','maya-cupboard','daniel-walk','sam-cat']
scenes = {name: 'data:image/png;base64,' + base64.b64encode((root/'assets'/f'{name}.png').read_bytes()).decode() for name in scene_names}
html = (root/'index.html').read_text()
css = (root/'style.css').read_text().replace("url('assets/cafe.png')", 'var(--cafe-image)')
css += '\n:root{--cafe-image:url("' + assets['cafe'] + '")}\n'
html = re.sub(r'<link rel="stylesheet" href="style.css[^\"]*">', lambda _: '<style>'+css+'</style>', html)
for name in ['conversations','story','app']:
    source = (root/f'{name}.js').read_text()
    if name == 'app':
        source = 'window.PORTRAITS='+json.dumps({k:v for k,v in assets.items() if k != 'cafe'})+';\nwindow.SCENE_IMAGES='+json.dumps(scenes)+';\n'+source
    html = re.sub(r'<script src="'+name+r'.js[^\"]*"></script>', lambda _, code=source: '<script>'+code+'</script>', html)
(out/'Before the Face.html').write_text(html)
with zipfile.ZipFile(out/'before-the-face-project.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in root.rglob('*'):
        if f.is_file(): z.write(f,Path('before-the-face')/f.relative_to(root))
assert not re.search(r'<script[^>]+src=',html)
assert 'assets/cafe.png' not in html
assert html.count('data:image/png;base64,') == 14
print('Packaged offline game with 14 embedded images and the editable project archive.')
