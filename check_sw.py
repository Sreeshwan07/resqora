import asyncio
from playwright.async_api import async_playwright
B="http://127.0.0.1:4399"
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(headless=True)
        ctx=await br.new_context(viewport={"width":1280,"height":1800})
        pg=await ctx.new_page()
        errs=[]
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        await pg.goto(B, wait_until="domcontentloaded")
        await pg.evaluate("navigator.serviceWorker.register('/sw.js',{scope:'/'})")
        await pg.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
        info=await pg.evaluate("""async()=>{const r=await navigator.serviceWorker.getRegistrations();
          return {count:r.length, scripts:r.map(x=>x.active&&x.active.scriptURL), scope:r[0]&&r[0].scope};}""")
        print("TEST1/3 registered:", info)
        for _ in range(3):
            await pg.reload(wait_until="domcontentloaded")
        print("TEST8 after 3 reloads:", await pg.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistrations();return r.length;}"))
        print("online body:", (await pg.inner_text("body"))[:30])
        await ctx.set_offline(True)
        await pg.goto(B+"/dashboard", wait_until="domcontentloaded")
        print("TEST4 offline /dashboard:", await pg.title(), "|", (await pg.inner_text("body"))[:60].replace("\n"," "))
        await pg.goto(B+"/", wait_until="domcontentloaded")
        print("TEST4 offline cached /:", (await pg.inner_text("body"))[:40].replace("\n"," "))
        await pg.screenshot(path="/tmp/browser/sw/offline.png")
        await ctx.set_offline(False)
        await pg.goto(B+"/", wait_until="domcontentloaded")
        print("TEST5 back online:", (await pg.inner_text("body"))[:40])
        api=await pg.evaluate("async()=>{const r=await fetch('/api/public/push-config');return [r.status, await r.text()];}")
        print("api not cached by SW (fresh):", api)
        print("caches:", await pg.evaluate("async()=>await caches.keys()"))
        print("console errors:", errs[:5])
        await br.close()
asyncio.run(main())
