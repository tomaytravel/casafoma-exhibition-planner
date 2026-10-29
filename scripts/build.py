from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'src';target=ROOT/'docs';target.mkdir(exist_ok=True);assets=target/'assets';assets.mkdir(exist_ok=True)
for p in source.glob('*.js'):shutil.copy2(p,assets/p.name)
for name in ['visualize.css','site.css']:shutil.copy2(source/name,assets/name)
markup=(source/'fragment.html').read_text();start=markup.index('<div class="viz-carousel"');end=markup.index('<div class="viz-controls"><label class="form-label">공간',start);carousel=markup[start:end];markup=markup[:start]+'<details class="site-designs"><summary>시트지 디자인 · 크기 조절</summary>'+carousel+'</details>'+markup[end:];html='''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="더 모라비안 카사포마 전시 공간 3D 배치 편집기"><meta name="referrer" content="strict-origin-when-cross-origin"><title>THE MORAVIAN | 전시 공간 배치</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./assets/visualize.css"><link rel="stylesheet" href="./assets/site.css"></head><body><header class="site-header"><div><h1>THE MORAVIAN</h1><p>카사포마 · 전시 공간 배치</p></div><span id="storage-status" class="text-small" role="status">변경사항은 이 브라우저에 자동 저장됩니다.</span></header>'''+markup+'''<script type="module" src="./assets/bootstrap.js"></script></body></html>'''
(target/'index.html').write_text(html);(target/'.nojekyll').touch()
print('Built docs/index.html')
