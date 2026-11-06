# Hearth & Crumb

A cozy, accessibility-first fantasy bakery RPG that runs in any modern web browser. Bake enchanted treats, serve a town of many magical peoples, make friends, and wake the old Hearthstone. You can play with a keyboard, a mouse, touch, or a screen reader, entirely at your own pace.

It is plain HTML, CSS, and JavaScript. There is no build step, no server, and no account. Progress saves in the browser's local storage.

## Play it locally

Open `index.html` in a browser. That's it.

## Host it free on GitHub Pages

1. Create a new public repository on GitHub, for example `hearth-and-crumb`.
2. Upload every file in this folder to the repository, keeping the `js` folder. You can drag and drop them on the repository page, or use git:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/hearth-and-crumb.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**. Under "Build and deployment", set **Source** to "Deploy from a branch", choose the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute or two, the game is live at `https://YOUR-USERNAME.github.io/hearth-and-crumb/`.

## What's in the MVP

- One bakery and café, one compact town with 5 locations: Moonwell Market, Elder Oak Square, Whispering Orchard, Lanternmere Library, and the River Path.
- 6 neighbors from 6 peoples: Humans, Duskwing, Emberkin, Mossborn, Tidewrought, and Cairnish, plus visiting travelers. Each neighbor has their own personality, hopes, likes, and dislikes, and people from the same background don't always agree.
- 12 recipes and 8 ingredients, each with descriptions, flavors, skill requirements, and a magical effect described in text.
- A day cycle: morning prep, shop hours (turn-based, with no timers), an afternoon in town, and an evening summary.
- 1 main quest ("The Quiet Hearth", which ends with a teaser for the future inn or gathering hall) and 4 side quests.
- 3 skills (Baking, Brewing, Hospitality), paid lessons, and 4 shop upgrades.
- Friendships with text labels and numbers, daily talks, and gifts.
- A journal with an event log, day summaries, and a lore glossary.
- Automatic saving, plus a save code you can copy to back up or move your game.

## Accessibility

- Every action works with the keyboard. Focus is always visible, and it moves to the new section heading when you change sections.
- Semantic headings, landmarks, labelled form controls, and native `<dialog>` conversations.
- Results are announced through a polite live region and also shown on screen and in the journal.
- Settings for text size (up to 200%), warm, night, and high-contrast themes, reduced motion, optional sound (off by default), and extra text spacing. The game follows your system's reduced-motion and contrast preferences the first time it runs.
- No information is carried by color, sound, or animation alone, and nothing is timed.
- Automated checks: axe-core reports no WCAG 2.1 AA or best-practice violations on any screen in any of the three themes at 200% text, and nothing scrolls sideways at narrow widths.

Automated checks don't replace testing with real people. Please test with NVDA, JAWS, or VoiceOver users, and report anything that gets in the way.

## Files

- `index.html`: the page shell
- `styles.css`: themes and layout
- `js/data.js`: all game content (recipes, people, quests, lore). Edit this file to add or change content.
- `js/game.js`: game logic and the interface
