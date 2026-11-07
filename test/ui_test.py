"""Clicks through the main flows of the web UI in a phone-sized Chromium and saves screenshots."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

WEB = Path(sys.argv[1]).resolve()
OUT = Path(sys.argv[2]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="fa-IR")
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.goto((WEB / "index.html").as_uri())
    page.wait_for_timeout(1200)
    shot = lambda n, full=False: page.screenshot(path=str(OUT / f"{n}.png"), full_page=full)
    click = lambda sel: (page.click(sel), page.wait_for_timeout(250))

    shot("01_onboarding")
    for _ in range(3):
        click("[data-a=onbNext]")
    shot("02_setup", True)
    page.fill("[data-f='p.name']", "سارا")
    click("[data-a=onbDone]")
    page.fill("#goalText", "می‌خواهم تا پایان شهریور ۱۲ کتاب بخوانم")
    page.dispatch_event("#goalText", "input")
    page.wait_for_timeout(200)
    shot("03_new_goal")
    click("[data-a=goalNext]")
    shot("04_wizard_S")
    click("[data-a=wNext]")
    shot("05_wizard_M")
    click("[data-a=wNext]")
    shot("06_wizard_A", True)
    click("[data-a=wNext]")
    page.fill("#whyIn", "می‌خواهم ذهنم فعال‌تر و آرام‌تر باشد")
    page.dispatch_event("#whyIn", "input")
    click("[data-a=wNext]")
    shot("07_wizard_T", True)
    click("[data-a=wNext]")
    page.wait_for_timeout(300)
    shot("08_result", True)
    click("[data-a=createGoal]")
    shot("09_goal_detail", True)
    click("[data-a=back]")
    shot("10_today", True)
    # complete the most important action
    page.click(".hero [data-a=done]")
    page.wait_for_timeout(500)
    shot("11_celebrate")
    page.evaluate("Sheet.close()")
    page.click(".occ:not(.done)")
    page.wait_for_timeout(300)
    shot("12_occ_menu")
    page.evaluate("Sheet.close()")

    # second goal in a different category through the coach
    click("[data-a=tab][data-x=coach]")
    page.fill("#coachIn", "میخوام ۵ کیلو کم کنم در ۳ ماه")
    click("[data-a=coachSend]")
    shot("13_coach")
    click("[data-a=coachGoal]")
    click("[data-a=wNext]")
    page.fill("[data-f='d.startValue']", "۸۲")
    page.dispatch_event("[data-f='d.startValue']", "input")
    shot("14_wizard_weight")
    for _ in range(4):
        click("[data-a=wNext]")
    shot("15_result_weight", True)
    click("[data-a=createGoal]")
    page.evaluate("Sheet.close()")
    click("[data-a=back]")

    # travel 10 days into the past so adaptive rules and history have data
    page.evaluate("""() => {
      const shift = (s) => D.add(s, -10);
      for (const g of S.goals) { g.startDate = shift(g.startDate); g.deadline = shift(g.deadline); g.createdAt -= 10*864e5; g.logs.forEach(l => l.date = shift(l.date)); }
      for (const m of S.milestones) { m.start = shift(m.start); m.end = shift(m.end); }
      for (const a of S.actions) { a.createdAt -= 10*864e5; if (a.from) a.from = shift(a.from); if (a.rec.date) a.rec.date = shift(a.rec.date); }
      const occ = {}; for (const [k, v] of Object.entries(S.occ)) { const i = k.lastIndexOf('|'); occ[k.slice(0, i) + '|' + shift(k.slice(i+1))] = v; } S.occ = occ;
      S.xp.forEach(x => x.day = shift(x.day));
      // mark a few past days done for the reading action
      const read = S.actions.find(a => a.title.includes('مطالعه') && a.kind === 'task' && a.rec.type !== 'once');
      for (const d of [-9, -8, -6]) S.occ[read.id + '|' + D.add(D.today(), d)] = { status: 'done', at: Date.now() };
      commit(); render();
    }""")
    page.wait_for_timeout(300)
    click("[data-a=tab][data-x=today]")
    shot("16_today_with_history", True)
    click("[data-a=tab][data-x=progress]")
    shot("17_progress", True)
    click("[data-a=go][data-x=adaptive]")
    shot("18_adaptive", True)
    click("[data-a=back]")
    click("[data-a=tab][data-x=goals]")
    shot("19_goals", True)
    page.click(".goal")
    page.wait_for_timeout(300)
    page.click(".tl-item")
    page.wait_for_timeout(300)
    shot("20_milestone", True)
    page.click("[data-a=go][data-x=action]")
    page.wait_for_timeout(300)
    shot("21_action", True)
    page.evaluate("Nav.tab('settings')")
    page.wait_for_timeout(250)
    shot("22_settings", True)
    click("[data-a=theme][data-x=dark]")
    click("[data-a=tab][data-x=today]")
    shot("23_today_dark", True)
    click("[data-a=tab][data-x=coach]")
    click("[data-a=coachQuick][data-x='عقب افتادم']")
    shot("24_coach_dark")
    b.close()

print("\n".join(errors) if errors else "NO CONSOLE ERRORS")
