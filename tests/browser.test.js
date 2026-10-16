// Optional Playwright regression runner. Adjust these two machine-specific paths when moving the project.
const {chromium}=require('/Users/lance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Helium.app/Contents/MacOS/Helium'});
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const click=a=>page.locator(`[data-action="${a}"]`).first().click();
 const choose=async i=>{await page.locator(`[data-action="answer"][data-index="${i}"]`).click();if(await page.locator('[data-action="skip-messages"]').count())await click('skip-messages');};
 const open=async id=>{for(let attempt=0;attempt<80;attempt++){if(await page.locator(`[data-action="open"][data-id="${id}"]`).count()){await page.locator(`[data-action="open"][data-id="${id}"]`).click();return;}if(await page.locator('[data-action="keep"]').count())await click('keep');else await click('rest');}throw Error('No available slot');};
 await page.goto(process.argv.includes('--offline')?'file://'+path.resolve(__dirname,'../../output/Before the Face.html'):'http://127.0.0.1:4317/');
 await click('start');assert.equal(await page.locator('.person-card').count(),6);assert.equal(await page.locator('.contact-photo').count(),0);
 await open('maya');assert.equal(await page.locator('[data-action="answer"]').count(),5);assert.match(await page.locator('.thread-messages').innerText(),/Free for a quick chat/);
 await choose(0);const transcript=await page.locator('.thread-messages').innerText();await page.reload();assert.equal(await page.locator('.thread-messages').innerText(),transcript);
 for(const index of [1,2,0])await choose(index);assert.match(await page.locator('.scene-location .kicker').innerText(),/DAY 1/);await click('close-chat');assert.match(await page.locator('main h1').innerText(),/Evening/);
 await open('ben');for(let i=0;i<4;i++)await choose(0);await click('close-chat');assert.match(await page.locator('main h1').innerText(),/Tuesday/);
 for(let scene=0;scene<3;scene++){await open('maya');for(let i=0;i<4;i++)await choose(0);await click('close-chat');}
 assert.match(await page.locator('.appointment-list').innerText(),/Maya/);await open('maya');assert.equal(await page.locator('.portrait').count(),0);await click('walk');await click('skip');await page.waitForFunction(()=>document.querySelector('.portrait')?.naturalWidth>0);assert.equal(await page.locator('[data-action="answer"]').count(),5);
 for(let i=0;i<4;i++)await choose(0);await click('close-chat');await page.locator('[data-action="person"][data-id="maya"]').click();assert.equal(await page.locator('.journal-entry').count(),5);await click('close');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await open('sam');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await click('pause');await click('home');await click('resume');assert.equal(await page.locator('[data-action="answer"]').count(),5);
 assert.deepEqual(errors,[]);await browser.close();console.log('Passed: six characters, multi-exchange conversations, persistence, independent routes, calendar meeting, portrait, five replies, history, pause, and mobile layout.');
})().catch(e=>{console.error(e);process.exit(1)});
