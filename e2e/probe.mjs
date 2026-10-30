import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
await p.route('**/*', r => r.request().url().includes('localhost') ? r.continue() : r.abort());
await p.goto('http://localhost:4171/');
for (const c of ['#000000','#ffffff','#808080']) {
  await p.evaluate((c) => { localStorage.setItem('palette-custom', JSON.stringify({primary:c,secondary:c})); }, c);
  await p.reload();
  console.log(c, await p.evaluate(() => { const a=document.querySelector('.post p a'); const s=getComputedStyle(document.documentElement); return [getComputedStyle(a).color, getComputedStyle(document.body).backgroundColor, s.getPropertyValue('--jc-accent'), document.documentElement.style.cssText]; }));
}
await b.close();
