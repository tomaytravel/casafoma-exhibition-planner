const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:8051/';
const results = [];
(async () => {
  const executablePath = process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, acceptDownloads: true });
  page.setDefaultTimeout(12000);
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status() >= 400) requests.push(`${r.status()} ${r.url()}`); });
  const ui = k => page.locator(`[data-c="${k}"]`), prop = k => page.locator(`[data-p="${k}"]`);
  const snapshot = () => page.evaluate(() => window.openai.widgetState);
  const check = async (name, fn) => { await fn(); results.push(name); console.log('PASS', name); };
  const set = async (key, value) => { await prop(key).fill(String(value)); await prop(key).dispatchEvent('change'); };
  const add = async kind => { await ui('kind').selectOption(kind); await ui('add').click(); assert.equal(await ui('error').innerText(), ''); return ui('selection').inputValue(); };
  const data = async () => { const s = await snapshot(); return { items: s.privateContent.items, scene: s.privateContent.camera.sceneItems, camera:s.privateContent.camera }; };
  const response = await page.goto(url, {waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.locator('canvas').waitFor();
  await check('User JSON initial layout, two tables and 5+5 tasting props', async()=>{
    await ui('view').selectOption('1'); const s=await data();
    assert.equal(s.items.filter(i=>i[0]==='t').length,2);
    assert.equal(s.items.find(i=>i[1]===4)[4],2.55);
    assert.equal(s.items.find(i=>i[1]===5)[5],1.95);
    assert.equal(s.scene.filter(i=>i.support==='s8'&&i.kind==='wine-bottle').length,5);
    assert.equal(s.scene.filter(i=>i.support==='s8'&&i.kind==='wine-glass').length,5);
    assert.equal(s.scene.find(i=>i.id==='s5').dy,0);
  });
  await check('Main, annex, combined, top, roof, cutaway, ceiling and stair views',async()=>{
    for(const view of ['0','1','2']) await ui('view').selectOption(view);
    await ui('top').click(); await ui('top').click();
    await ui('cut').uncheck();await ui('cut').check();await ui('roof').check();await ui('roof').uncheck();
    await ui('ceiling').fill('2.9');await ui('ceiling').dispatchEvent('change');assert.equal((await data()).camera.height,2.9);
    await ui('stairs').click();assert.equal((await data()).camera.installView,'stairs');
    await ui('entrance').click();await ui('banners').click();await ui('banners').click();
  });
  await check('Real pointer dragging of table and 160cm silhouette, table 90-degree rotation',async()=>{
    await ui('view').selectOption('1');await ui('top').click();await ui('snap').check();
    await page.locator('canvas').scrollIntoViewIfNeeded();const box=await page.locator('canvas').boundingBox(),k=Math.min(box.width/(Math.hypot(7.457,5.65)*1.08),box.height/(7.457*1.27));
    const pos=(x,y)=>[box.x+box.width/2+(x-7.457/2)*k,box.y+box.height*.6+(y-5.65/2)*k];
    for(const [from,to,id]of [[[2.55,2],[2.55,2.8],4],[[3.2,1.3],[3.2,3.7],6]]){await page.mouse.move(...pos(...from));await page.mouse.down();await page.mouse.move(...pos(...to),{steps:12});await page.mouse.up();assert.equal(await ui('selection').inputValue(),String(id));assert.equal(Number(await prop('y').inputValue()),Math.round(to[1]*100));}
    await ui('selection').selectOption('4');await page.locator('[data-action=rotate]').click();assert.match(await page.locator('[data-action=rotate]').innerText(),/90°$/);
    await ui('top').click();
  });
  let artId;
  await check('Artwork canvas/A0-A4 size, wall-plane 90-degree rotation, wire mounting and delete',async()=>{
    artId=await add('art');await prop('family').selectOption('paper');assert.equal(await prop('size').locator('option').count(),5);
    for(const size of ['A0','A1','A2','A3','A4'])await prop('size').selectOption(size);
    await prop('family').selectOption('canvas');await prop('size').selectOption('50');await prop('variant').selectOption('P');
    await page.locator('[data-action=roll-art]').click();assert.match(await page.locator('[data-action=roll-art]').innerText(),/90°$/);assert.equal(await prop('mount').inputValue(),'wall');
    await prop('mount').selectOption('wire');await set('centerHeight',160);assert.equal(await ui('error').innerText(),'');
    await ui('duplicate').click();await ui('remove').click();await ui('selection').selectOption(artId);
  });
  await check('Fixtures in main/annex: independent width-depth-height and attached tasting props',async()=>{
    await ui('room').selectOption('main');const id=await add('scene:shelf-0');assert.equal(await prop('placementRoom').inputValue(),'main');
    await set('w',180);await set('d',60);await set('h',120);assert.equal(await ui('error').innerText(),'');
    let s=await data();const item=s.scene.find(i=>i.id===id);assert.equal(item.w,1.8);assert.equal(item.d,.6);assert.equal(item.h,1.2);assert.equal(s.scene.filter(i=>i.support===id).length,10);
    await prop('placementRoom').selectOption('annex');assert.equal(await ui('view').inputValue(),'1');
    s=await data();assert.ok(s.scene.filter(i=>i.support===id).every(i=>i.room==='annex'));
    const props=s.scene.filter(i=>i.support===id);for(let a=0;a<props.length;a++)for(let b=a+1;b<props.length;b++)assert.ok(Math.hypot(props[a].dx-props[b].dx,props[a].dy-props[b].dy)>.1);
    await ui('room').selectOption('main');await add('scene:display-0');assert.equal(await prop('name').inputValue(),'진열대');await set('w',160);await set('d',50);await set('h',100);
  });
  await check('X-banner, wine glass/bottle add-copy-remove and support selection',async()=>{
    await ui('room').selectOption('annex');const xb=await add('scene:x-banner');await ui('duplicate').click();await ui('remove').click();
    await ui('selection').selectOption('4');const bottle=await add('scene:wine-bottle');assert.equal(await prop('support').inputValue(),'4');
    const glass=await add('scene:wine-glass');await prop('support').selectOption('s8');assert.equal(await prop('support').inputValue(),'s8');
    await ui('duplicate').click();await ui('remove').click();await ui('selection').selectOption(xb);await ui('remove').click();
  });
  await check('Ctrl/Cmd undo and redo plus deletion persistence',async()=>{
    await ui('selection').selectOption(artId);await ui('remove').click();await page.keyboard.press('Control+z');assert.ok((await data()).items.some(i=>i[1]===Number(artId)));
    await page.keyboard.press('Control+Shift+z');assert.ok(!(await data()).items.some(i=>i[1]===Number(artId)));
    await page.keyboard.press('Meta+z');await page.keyboard.press('Meta+Shift+z');assert.ok(!(await data()).items.some(i=>i[1]===Number(artId)));
  });
  await check('Three vinyl studies, independent logo/type size, locked existing decals and initial-only horizontal placement',async()=>{
    await page.locator('.site-designs>summary').click();const select=page.getByLabel('시트지 비교안');for(const name of ['하단 확장형','우측 정렬형','우측 세로형'])await select.selectOption({label:name});
    const logo=page.locator('[data-study="3"][data-vinyl-size=logo]'),art=page.locator('[data-study="3"][data-vinyl-size=art]');await logo.fill('85');await logo.dispatchEvent('change');await art.fill('90');await art.dispatchEvent('change');
    await page.locator('[data-window-study="3"]').click();await ui('selection').selectOption('s5');assert.equal(await prop('dx').count(),0);assert.equal(await prop('dy').count(),0);await set('dz',5);assert.equal((await data()).scene.find(i=>i.id==='s5').dy,0);
    const id=await add('scene:window-logo');assert.equal(await prop('dx').count(),1);await set('dx',40);await page.locator('[data-action=confirm-vinyl]').click();assert.equal(await prop('dx').count(),0);await set('dz',10);const sticker=(await data()).scene.find(i=>i.id===id);assert.equal(sticker.dx,.4);assert.equal(sticker.dy,0);assert.equal(sticker.placementPending,false);
    await page.locator('.site-designs>summary').click();
  });
  await check('Browser storage reload, JSON round-trip, invalid import rollback and file download/upload',async()=>{
    const before=await data();await page.reload({waitUntil:'networkidle'});assert.deepEqual((await data()).items,before.items);assert.deepEqual((await data()).scene,before.scene);
    await page.locator('summary').filter({hasText:'배치 저장·불러오기'}).click();await ui('export').click();const text=await ui('json').inputValue(),doc=JSON.parse(text);assert.equal(doc.schema,'casafoma-layout-v1');
    await ui('json').fill('{"schema":"bad","items":[]}');await ui('import').click();assert.ok(await ui('error').innerText());assert.deepEqual((await data()).items,before.items);
    await ui('json').fill(text);await ui('import').click();assert.equal(await ui('error').innerText(),'');
    const downloadPromise=page.waitForEvent('download');await ui('download').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'moravian-layout.json');
    await ui('upload').setInputFiles({name:'layout.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.waitForTimeout(150);assert.equal(await ui('error').innerText(),'');
  });
  await check('360px mobile layout, dark theme and no HTTP/runtime errors',async()=>{
    await page.setViewportSize({width:360,height:1000});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.emulateMedia({colorScheme:'dark'});await page.waitForTimeout(100);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  });
  fs.mkdirSync('test-results',{recursive:true});
  await page.screenshot({path:'test-results/mobile-dark.png',fullPage:true});
  await page.setViewportSize({width:1280,height:1100});await page.emulateMedia({colorScheme:'light'});
  await page.evaluate(()=>localStorage.removeItem('moravian-exhibition-planner-v1'));await page.reload({waitUntil:'networkidle'});
  await page.screenshot({path:'test-results/desktop-initial.png',fullPage:true});
  fs.writeFileSync('test-results/browser-report.json',JSON.stringify({url,passed:results,errors,requests},null,2));
  console.log(`ALL ${results.length} BROWSER CHECKS PASSED ${url}`);
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
