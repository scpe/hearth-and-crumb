/* Hearth & Crumb — game engine and accessible interface. No frameworks, no build step. */
'use strict';

(function () {
  const D = window.HC_DATA;
  const SAVE_KEY = 'hearth-and-crumb-save-v1';
  const SETTINGS_KEY = 'hearth-and-crumb-settings-v1';
  const NPC_IDS = Object.keys(D.NPCS);
  const QUEST_IDS = Object.keys(D.QUESTS);
  const PHASE_NAMES = { morning: 'Morning', open: 'Shop open', afternoon: 'Afternoon', evening: 'Evening' };

  const VIEWS = [
    { id: 'home', label: 'Bakery' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'pantry', label: 'Pantry' },
    { id: 'counter', label: 'Counter' },
    { id: 'town', label: 'Town' },
    { id: 'quests', label: 'Quests' },
    { id: 'friends', label: 'Neighbors' },
    { id: 'improve', label: 'Improve' },
    { id: 'journal', label: 'Journal' },
    { id: 'settings', label: 'Settings' },
    { id: 'help', label: 'Help' }
  ];

  let state = null;
  let view = 'title';
  let townLoc = null;
  let settings = loadSettings();
  let pending = []; // messages gathered during one action, announced together
  let lastSaveText = '';

  const $ = (sel) => document.querySelector(sel);
  const mainEl = $('#main');
  const liveEl = $('#live');
  const navEl = $('#game-nav');
  const statusEl = $('#status-bar');
  const dialogEl = $('#dialog');

  /* ---------- small helpers ---------- */

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'fid') el.dataset.fid = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const btn = (label, onclick, extra = {}) => h('button', Object.assign({ type: 'button', onclick }, extra), label);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const listText = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const tagText = (tags) => listText(tags.map((t) => D.TAGS[t]));
  const recipeName = (id) => D.RECIPES[id].name;
  const ingName = (id) => D.INGREDIENTS[id].name;

  function say(msg) { if (msg) pending.push(msg); }

  function announce(msg) {
    if (!msg) return;
    liveEl.textContent = '';
    // A short delay makes screen readers re-read even identical messages.
    setTimeout(() => { liveEl.textContent = msg; }, 50);
  }

  function addLog(text) {
    if (!state) return;
    state.log.push({ day: state.day, text });
    if (state.log.length > 300) state.log.splice(0, state.log.length - 300);
  }

  /* ---------- settings ---------- */

  function defaultSettings() {
    const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
    return {
      textScale: 100,
      theme: mm('(prefers-contrast: more)') ? 'contrast' : (mm('(prefers-color-scheme: dark)') ? 'night' : 'warm'),
      reducedMotion: mm('(prefers-reduced-motion: reduce)'),
      sound: false,
      spacing: false,
      tips: true
    };
  }
  function loadSettings() {
    try { return Object.assign(defaultSettings(), JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (e) { return defaultSettings(); }
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* storage unavailable */ }
    applySettings();
  }
  function applySettings() {
    const r = document.documentElement;
    r.style.fontSize = settings.textScale + '%';
    r.dataset.theme = settings.theme;
    r.classList.toggle('reduce-motion', !!settings.reducedMotion);
    r.classList.toggle('wide-spacing', !!settings.spacing);
  }

  let audioCtx = null;
  function chime(kind) {
    if (!settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === 'quest' ? [523, 659, 784] : kind === 'soft' ? [440] : [587, 784];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        const t = audioCtx.currentTime + i * 0.12;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.connect(g).connect(audioCtx.destination);
        o.start(t); o.stop(t + 0.5);
      });
    } catch (e) { /* sound is optional */ }
  }

  /* ---------- saving ---------- */

  function readSave() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function saveGame(manual) {
    if (!state) return false;
    try {
      state.savedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      lastSaveText = `Saved on Day ${state.day}, ${PHASE_NAMES[state.phase]}, at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
      if (manual) say('Game saved. ' + lastSaveText);
      return true;
    } catch (e) {
      lastSaveText = 'Saving failed. Your browser may be blocking storage. You can copy a save code from Settings.';
      if (manual) say(lastSaveText);
      return false;
    }
  }

  /* ---------- game state ---------- */

  function freshToday() {
    return { coinsEarned: 0, coinsSpent: 0, served: 0, declined: 0, baked: {}, rel: {}, notes: [] };
  }

  function newGame(name, bakeryName) {
    const quests = {};
    QUEST_IDS.forEach((id) => { quests[id] = { status: D.QUESTS[id].main ? 'active' : 'notstarted', stage: 0 }; });
    state = {
      version: 1,
      name: name || 'Baker',
      bakery: bakeryName || 'Hearth & Crumb',
      day: 1,
      phase: 'morning',
      coins: D.START.coins,
      inv: Object.assign({}, D.START.inventory),
      baked: {},
      keyItems: [],
      known: Object.keys(D.RECIPES).filter((id) => D.RECIPES[id].start),
      xp: { baking: 0, brewing: 0, hospitality: 0 },
      upgrades: [],
      rel: Object.fromEntries(NPC_IDS.map((id) => [id, 0])),
      met: {},
      talkedToday: {}, giftedToday: {}, foragedToday: {}, lookedToday: {},
      quests,
      loreFound: [],
      glossary: D.START_GLOSSARY.slice(),
      flags: {},
      customers: [],
      served: 0,
      discount: 0,
      title: null,
      today: freshToday(),
      log: [],
      summaries: []
    };
    addLog(`${state.name} opened the doors of ${state.bakery} for the very first time.`);
  }

  function migrate(s) {
    // Fill in anything missing from older saves so the game never breaks on load.
    const base = { flags: {}, loreFound: [], summaries: [], log: [], keyItems: [], today: freshToday(), talkedToday: {}, giftedToday: {}, foragedToday: {}, lookedToday: {}, discount: 0, met: {} };
    for (const [k, v] of Object.entries(base)) if (s[k] == null) s[k] = v;
    QUEST_IDS.forEach((id) => { if (!s.quests[id]) s.quests[id] = { status: 'notstarted', stage: 0 }; });
    NPC_IDS.forEach((id) => { if (s.rel[id] == null) s.rel[id] = 0; });
    return s;
  }

  const skillLevel = (sk) => { const xp = state.xp[sk]; return xp >= D.SKILL_LEVELS[2] ? 3 : xp >= D.SKILL_LEVELS[1] ? 2 : 1; };
  const has = (up) => state.upgrades.includes(up);
  const bakedCount = (id) => state.baked[id] || 0;
  const servingsPerBatch = () => has('oven') ? 3 : 2;
  const price = (ing) => Math.max(1, Math.round(D.INGREDIENTS[ing].price * (1 - state.discount)));

  function relLabel(v) {
    if (v >= 70) return 'Close friend';
    if (v >= 45) return 'Good friend';
    if (v >= 25) return 'Friendly';
    if (v >= 10) return 'Acquaintance';
    return 'Stranger';
  }

  function addCoins(n, why) {
    state.coins += n;
    if (n > 0) state.today.coinsEarned += n;
    if (why) addLog(why);
  }
  function spend(n) { state.coins -= n; state.today.coinsSpent += n; }

  function addXp(sk, n) {
    const before = skillLevel(sk);
    state.xp[sk] += n;
    const after = skillLevel(sk);
    if (after > before) {
      say(`Your ${D.SKILLS[sk].name} skill rose to level ${after}!`);
      state.today.notes.push(`${D.SKILLS[sk].name} reached level ${after}.`);
      chime('quest');
    }
  }

  function addRel(npc, n) {
    if (!n) return;
    const before = relLabel(state.rel[npc]);
    state.rel[npc] = Math.min(100, state.rel[npc] + n);
    state.today.rel[npc] = (state.today.rel[npc] || 0) + n;
    const after = relLabel(state.rel[npc]);
    if (before !== after) say(`You and ${D.NPCS[npc].name} are now: ${after}.`);
  }

  function learn(id) {
    if (state.known.includes(id)) return;
    state.known.push(id);
    say(`New recipe learned: ${recipeName(id)}.`);
  }

  function runEffects(fx) {
    if (!fx) return;
    if (fx.coins) { addCoins(fx.coins); say(`You received ${fx.coins} coins.`); }
    if (fx.learn) learn(fx.learn);
    if (fx.key && !state.keyItems.includes(fx.key)) { state.keyItems.push(fx.key); say(`You received a special item: ${D.KEY_ITEMS[fx.key].name}.`); }
    if (fx.rel) for (const [npc, n] of Object.entries(fx.rel)) addRel(npc, n);
    if (fx.flag) state.flags[fx.flag] = true;
    if (fx.discount) { state.discount = Math.max(state.discount, fx.discount); say(`Moonwell Market now gives you a ${Math.round(fx.discount * 100)}% discount.`); }
    if (fx.title) { state.title = fx.title; say(`You earned the title ${fx.title}.`); }
    if (fx.glossary) fx.glossary.forEach((g) => {
      if (!state.glossary.includes(g)) { state.glossary.push(g); say(`New journal entry: ${D.GLOSSARY[g].term}.`); }
    });
  }

  /* ---------- quests ---------- */

  function stageOf(qid) {
    const q = state.quests[qid];
    return q.status === 'active' ? D.QUESTS[qid].stages[q.stage] : null;
  }

  function questAvailable(qid) {
    const def = D.QUESTS[qid];
    if (state.quests[qid].status !== 'notstarted') return false;
    if (def.requires) {
      const rq = state.quests[def.requires.quest];
      if (!(rq.status === 'complete' || rq.stage >= def.requires.stage)) return false;
    }
    return true;
  }

  function startQuest(qid) {
    state.quests[qid] = { status: 'active', stage: 0 };
    say(`New quest: ${D.QUESTS[qid].title}. ${D.QUESTS[qid].stages[0].text}`);
    state.today.notes.push(`Started the quest "${D.QUESTS[qid].title}".`);
    chime('quest');
    checkQuests();
  }

  function advanceQuest(qid) {
    const q = state.quests[qid], def = D.QUESTS[qid];
    const st = def.stages[q.stage];
    runEffects(st.onComplete);
    q.stage++;
    if (q.stage >= def.stages.length) {
      q.status = 'complete';
      say(`Quest complete: ${def.title}.`);
      runEffects(def.reward);
      state.today.notes.push(`Completed the quest "${def.title}".`);
    } else {
      say(`Quest updated: ${def.title}. Next: ${def.stages[q.stage].text}`);
      state.today.notes.push(`Made progress on "${def.title}".`);
    }
    chime('quest');
    checkQuests();
  }

  function stageDone(st) {
    switch (st.type) {
      case 'serve': return state.served >= st.n;
      case 'have': return bakedCount(st.item) >= st.qty;
      case 'skill': return skillLevel(st.skill) >= st.level;
      case 'learn': return state.known.includes(st.recipe);
      case 'lore': return state.loreFound.length >= st.n;
      default: return false;
    }
  }

  function checkQuests() {
    for (const qid of QUEST_IDS) {
      const st = stageOf(qid);
      if (st && stageDone(st)) { advanceQuest(qid); return; }
    }
  }

  function currentObjectives() {
    return QUEST_IDS.filter((q) => state.quests[q].status === 'active').map((q) => ({ qid: q, def: D.QUESTS[q], st: stageOf(q) }));
  }

  /* ---------- core actions ---------- */

  function canBake(id) {
    const r = D.RECIPES[id];
    const missing = [];
    for (const [ing, n] of Object.entries(r.ingredients)) {
      const have = state.inv[ing] || 0;
      if (have < n) missing.push(`${n - have} ${ingName(ing)}`);
    }
    const reasons = [];
    if (!state.known.includes(id)) reasons.push('You have not learned this recipe yet.');
    if (skillLevel(r.skill) < r.level) reasons.push(`Needs ${D.SKILLS[r.skill].name} level ${r.level}. Yours is ${skillLevel(r.skill)}.`);
    if (r.needsKey && !state.keyItems.includes(r.needsKey)) reasons.push(`Needs the ${D.KEY_ITEMS[r.needsKey].name}.`);
    if (missing.length) reasons.push(`Missing ingredients: ${listText(missing)}.`);
    return { ok: reasons.length === 0, reasons };
  }

  function bake(id) {
    const r = D.RECIPES[id];
    const c = canBake(id);
    if (!c.ok) { say(`You can't make ${r.name} yet. ${c.reasons.join(' ')}`); return commit(); }
    for (const [ing, n] of Object.entries(r.ingredients)) state.inv[ing] -= n;
    const made = servingsPerBatch();
    state.baked[id] = bakedCount(id) + made;
    state.today.baked[id] = (state.today.baked[id] || 0) + made;
    const verb = r.skill === 'brewing' ? 'brewed' : 'baked';
    say(`You ${verb} ${made} servings of ${r.name}. You now have ${bakedCount(id)} in your display case.`);
    addLog(`${verb[0].toUpperCase() + verb.slice(1)} ${made} ${r.name}.`);
    addXp(r.skill, 1);
    chime('good');
    checkQuests();
    commit();
  }

  function buy(ing, qty) {
    const cost = price(ing) * qty;
    if (state.coins < cost) { say(`You need ${cost} coins to buy ${qty} ${ingName(ing)}, but you have ${state.coins}.`); return commit(); }
    spend(cost);
    state.inv[ing] = (state.inv[ing] || 0) + qty;
    say(`Bought ${qty} ${ingName(ing)} for ${cost} coins. You now have ${state.inv[ing]}, and ${state.coins} coins left.`);
    addLog(`Bought ${qty} ${ingName(ing)}.`);
    chime('soft');
    commit();
  }

  function buyRecipe(id) {
    const r = D.RECIPES[id];
    if (state.known.includes(id)) { say(`You already know ${r.name}.`); return commit(); }
    if (state.coins < r.cost) { say(`The ${r.name} recipe card costs ${r.cost} coins. You have ${state.coins}.`); return commit(); }
    spend(r.cost);
    learn(id);
    addLog(`Bought the recipe card for ${r.name}.`);
    chime('good');
    checkQuests();
    commit();
  }

  function buyUpgrade(id) {
    const u = D.UPGRADES[id];
    if (has(id)) { say(`You already own the ${u.name}.`); return commit(); }
    if (state.coins < u.cost) { say(`The ${u.name} costs ${u.cost} coins. You have ${state.coins}, so you need ${u.cost - state.coins} more.`); return commit(); }
    spend(u.cost);
    state.upgrades.push(id);
    say(`You installed the ${u.name}. ${u.desc}`);
    state.today.notes.push(`Installed the ${u.name}.`);
    addLog(`Installed the ${u.name}.`);
    chime('quest');
    commit();
  }

  function takeLesson(sk) {
    if (state.coins < D.LESSON.cost) { say(`A lesson costs ${D.LESSON.cost} coins. You have ${state.coins}.`); return commit(); }
    if (skillLevel(sk) >= 3) { say(`Your ${D.SKILLS[sk].name} is already at the highest level.`); return commit(); }
    spend(D.LESSON.cost);
    say(`You spend an hour studying ${D.SKILLS[sk].name.toLowerCase()} from the library's well-thumbed books. You gain ${D.LESSON.xp} experience.`);
    addXp(sk, D.LESSON.xp);
    checkQuests();
    commit();
  }

  /* ---------- the shop day ---------- */

  function tagPhrase(tag) { return tag === 'tea' ? 'something made with tea' : `something ${tag}`; }

  function makeOrder(c) {
    const inStock = Object.keys(state.baked).filter((id) => bakedCount(id) > 0);
    if (inStock.length && Math.random() < 0.7) {
      if (c.favorite && inStock.includes(c.favorite) && Math.random() < 0.6) return { type: 'item', recipe: c.favorite };
      const liked = inStock.filter((id) => D.RECIPES[id].tags.some((t) => c.likes.includes(t)));
      return { type: 'item', recipe: pick(liked.length ? liked : inStock) };
    }
    return { type: 'tag', tag: pick(c.likes) };
  }

  function openShop() {
    if (state.phase !== 'morning') return;
    const count = D.START.baseCustomers + (has('seats') ? 1 : 0);
    const named = shuffle(NPC_IDS).slice(0, 2).map((id) => {
      const n = D.NPCS[id];
      return { npc: id, name: n.name, people: n.people, likes: n.likes, dislikes: n.dislikes, favorite: n.favorite };
    });
    const visitors = shuffle(D.VISITORS).slice(0, count - named.length).map((v) => Object.assign({ npc: null }, v));
    state.customers = shuffle(named.concat(visitors)).map((c) => Object.assign(c, { order: makeOrder(c) }));
    state.phase = 'open';
    const stock = Object.values(state.baked).reduce((a, b) => a + b, 0);
    say(`You flip the sign to Open. ${plural(state.customers.length, 'customer')} will visit today. Head to the Counter to serve them.` +
      (stock === 0 ? ' Your display case is empty, but you can still offer a kind word.' : ''));
    addLog('Opened the shop.');
    go('counter', { silent: true });
  }

  function orderText(o) {
    return o.type === 'item' ? recipeName(o.recipe) : tagPhrase(o.tag);
  }

  function matchInfo(c, id) {
    const r = D.RECIPES[id];
    if (c.order.type === 'item' && c.order.recipe === id) return { kind: 'exact', text: 'Exactly what they asked for' };
    if (c.order.type === 'tag' && r.tags.includes(c.order.tag)) return { kind: 'exact', text: `Matches their wish for ${tagPhrase(c.order.tag)}` };
    if (r.tags.some((t) => c.dislikes.includes(t))) return { kind: 'dislike', text: 'Not to their taste' };
    if (r.tags.some((t) => c.likes.includes(t))) return { kind: 'liked', text: 'Not what they asked for, but a flavor they enjoy' };
    return { kind: 'other', text: 'Not what they asked for' };
  }

  function serve(id) {
    const c = state.customers[0];
    if (!c || bakedCount(id) < 1) return;
    const r = D.RECIPES[id];
    const m = matchInfo(c, id);
    let coins = r.price, rel = 0, line;
    if (m.kind === 'exact') {
      rel = 3;
      if (r.effect === 'tip') coins += 3;
      if (has('garland')) { coins += 2; rel += 1; }
      line = pick(['Their whole face lights up.', 'They close their eyes on the first bite and sigh happily.', '"Perfect," they say. "Just perfect."']);
    } else if (m.kind === 'liked') {
      rel = 2; if (r.effect === 'tip') coins += 3;
      line = 'They look surprised, then pleased. "Oh, I like this."';
    } else if (m.kind === 'dislike') {
      coins = Math.round(r.price * 0.6);
      line = 'They thank you politely, though it isn\'t quite to their taste.';
    } else {
      coins = Math.round(r.price * 0.8); rel = 1;
      line = 'They accept it kindly and pay what they think is fair.';
    }
    if (skillLevel('hospitality') >= 3) coins += 2;
    state.baked[id]--;
    addCoins(coins);
    state.served++;
    state.today.served++;
    addXp('hospitality', 1);
    let msg = `You served ${r.name} to ${c.name}. ${line} You earned ${coins} coins.`;
    if (c.npc) {
      if (rel > 0) {
        if (r.effect === 'cheer') rel += 1;
        if (skillLevel('hospitality') >= 2) rel += 1;
      }
      if (id === c.favorite) { rel += 2; msg += ` It's their favorite!`; }
      say(msg);
      addRel(c.npc, rel);
      state.met[c.npc] = true;
    } else say(msg);
    addLog(`Served ${r.name} to ${c.name}.`);
    chime(m.kind === 'exact' ? 'good' : 'soft');
    nextCustomer();
  }

  function kindWord() {
    const c = state.customers[0];
    if (!c) return;
    say(`You pour ${c.name} a glass of cool water and chat for a while. They leave smiling, a little lighter than they came in.`);
    if (c.npc) { addRel(c.npc, 1); state.met[c.npc] = true; }
    state.today.declined++;
    addLog(`Shared a kind word with ${c.name}.`);
    nextCustomer();
  }

  function declineOrder() {
    const c = state.customers[0];
    if (!c) return;
    say(`You let ${c.name} know you can't fill that order today. "Another day, then," they say warmly.`);
    state.today.declined++;
    addLog(`Couldn't fill ${c.name}'s order.`);
    nextCustomer();
  }

  function nextCustomer() {
    state.customers.shift();
    checkQuests();
    if (state.customers.length === 0) {
      state.phase = 'afternoon';
      say(`That was the last customer. The shop is quiet for the afternoon. You can visit town, bake, or end the day whenever you're ready.`);
      addLog('Closed the shop for the afternoon.');
    } else {
      const c = state.customers[0];
      say(`Next customer: ${c.name}, who would like ${orderText(c.order)}.`);
    }
    commit();
  }

  function endDay() {
    if (state.phase === 'open') { say('There are still customers waiting at the counter.'); return commit(); }
    if (state.phase === 'morning') { say('You have not opened the shop yet today. Open the shop first.'); return commit(); }
    const t = state.today;
    state.summaries.push({
      day: state.day,
      coinsEarned: t.coinsEarned, coinsSpent: t.coinsSpent, coinsEnd: state.coins,
      served: t.served, declined: t.declined,
      baked: Object.entries(t.baked).map(([id, n]) => `${n} ${recipeName(id)}`),
      rel: Object.entries(t.rel).map(([npc, n]) => `${D.NPCS[npc].name}: +${n} (now ${relLabel(state.rel[npc])})`),
      notes: t.notes.slice()
    });
    state.phase = 'evening';
    say(`The lanterns are lit and the ovens cool. Day ${state.day} is done. Your summary is ready.`);
    addLog(`Closed up for the evening.`);
    go('home', { silent: true });
  }

  function startDay() {
    if (state.phase !== 'evening') return;
    state.day++;
    state.phase = 'morning';
    state.today = freshToday();
    state.talkedToday = {}; state.giftedToday = {}; state.foragedToday = {}; state.lookedToday = {};
    let msg = `Good morning! Day ${state.day} begins.`;
    if (has('pantry')) {
      state.inv.flour += 2; state.inv.butter += 1;
      msg += ' Your Self-Stocking Pantry left 2 Moonwheat Flour and 1 Hearthbutter.';
    }
    say(msg);
    addLog(`Day ${state.day} began.`);
    go('home', { silent: true });
  }

  /* ---------- town actions ---------- */

  function forage(loc) {
    if (state.foragedToday[loc]) { say('You have already gathered here today. More will grow by tomorrow.'); return commit(); }
    const got = {};
    if (loc === 'orchard') { got.whisperpetal = 2; if (state.flags.honeyForage) got.honey = 2; }
    if (loc === 'river') { got.dewberry = state.flags.dewberryBonus ? 4 : 2; got.mistleaf = 1; }
    for (const [ing, n] of Object.entries(got)) state.inv[ing] = (state.inv[ing] || 0) + n;
    state.foragedToday[loc] = true;
    const text = Object.entries(got).map(([ing, n]) => `${n} ${ingName(ing)}`);
    say(`You gather ${listText(text)}.`);
    addLog(`Foraged ${listText(text)} at ${D.LOCATIONS[loc].name}.`);
    chime('soft');
    checkQuests();
    commit();
  }

  function lookAround(loc) {
    let msg = D.LOOK_FLAVOR[loc];
    if (D.LORE_SPOTS[loc] && state.quests.lore.status === 'active' && !state.loreFound.includes(loc)) {
      state.loreFound.push(loc);
      msg += ' ' + D.LORE_SPOTS[loc] + ` You have found ${state.loreFound.length} of 3 fragments.`;
      chime('good');
    }
    say(msg);
    checkQuests();
    commit();
  }

  function talk(npc) {
    const n = D.NPCS[npc];
    const lines = [];
    if (!state.met[npc]) lines.push(...n.intro);
    state.met[npc] = true;
    let questTalk = false;
    for (const qid of QUEST_IDS) {
      const st = stageOf(qid);
      if (st && st.type === 'talk' && st.npc === npc) {
        lines.push(...st.dialogue);
        advanceQuest(qid);
        questTalk = true;
        break;
      }
    }
    if (!questTalk) {
      const offer = QUEST_IDS.find((qid) => D.QUESTS[qid].giver === npc && questAvailable(qid));
      if (offer) { lines.push(...D.QUESTS[offer].intro); startQuest(offer); questTalk = true; }
    }
    if (!questTalk && lines.length <= n.intro.length) {
      lines.push(n.chat[(state.day + Object.keys(state.talkedToday).length + state.rel[npc]) % n.chat.length]);
    }
    if (!state.talkedToday[npc]) { state.talkedToday[npc] = true; addRel(npc, 2); }
    addLog(`Talked with ${n.name}.`);
    showConversation(n.name, `${n.people} · ${n.role}`, lines);
  }

  function gift(npc, id) {
    const n = D.NPCS[npc];
    if (!id) { say('Choose a treat to give first.'); return commit(); }
    if (state.giftedToday[npc]) { say(`You've already given ${n.name} a gift today. They'll be glad to see you tomorrow.`); return commit(); }
    if (bakedCount(id) < 1) { say(`You don't have any ${recipeName(id)} left.`); return commit(); }
    const r = D.RECIPES[id];
    state.baked[id]--;
    state.giftedToday[npc] = true;
    state.met[npc] = true;
    let gain, reaction;
    if (id === n.favorite) { gain = 10; reaction = `"This is my absolute favorite! How did you know?"`; }
    else if (r.tags.some((t) => n.dislikes.includes(t))) { gain = 1; reaction = `"That's very kind of you." They tuck it away politely. It may not be quite their taste.`; }
    else if (r.tags.some((t) => n.likes.includes(t))) { gain = 6; reaction = `"Oh, this is lovely. Thank you!"`; }
    else { gain = 3; reaction = `"How thoughtful. Thank you."`; }
    say(`You give ${r.name} to ${n.name}. ${reaction}`);
    addRel(npc, gain);
    addLog(`Gave ${r.name} to ${n.name}.`);
    chime('good');
    commit();
  }

  function deliver(qid) {
    const st = stageOf(qid);
    if (!st || st.type !== 'deliver') return;
    if (bakedCount(st.item) < st.qty) {
      say(`You need ${st.qty} ${recipeName(st.item)} for this, and you have ${bakedCount(st.item)}.`);
      return commit();
    }
    state.baked[st.item] -= st.qty;
    const lines = st.dialogue.slice();
    advanceQuest(qid);
    addLog(`Delivered ${st.qty} ${recipeName(st.item)} to ${D.NPCS[st.npc].name}.`);
    showConversation(D.NPCS[st.npc].name, D.QUESTS[qid].title, lines);
  }

  /* ---------- dialogs ---------- */

  let dialogReturn = null;
  function showConversation(title, subtitle, lines) {
    const notices = pending.splice(0);
    notices.forEach(addLog);
    dialogReturn = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fid : null;
    dialogEl.replaceChildren(
      h('h2', { id: 'dialog-title' }, title),
      subtitle ? h('p', { class: 'dialog-sub' }, subtitle) : null,
      h('div', { id: 'dialog-body' }, lines.map((l) => h('p', null, l))),
      notices.length ? h('div', { class: 'notice', role: 'note' }, h('h3', null, 'What changed'), h('ul', null, notices.map((n) => h('li', null, n)))) : null,
      h('div', { class: 'actions' }, btn('Close conversation', () => dialogEl.close(), { class: 'primary', id: 'dialog-close' }))
    );
    dialogEl.setAttribute('aria-labelledby', 'dialog-title');
    dialogEl.setAttribute('aria-describedby', 'dialog-body');
    saveGame(false);
    render();
    dialogEl.showModal();
    // Put focus on the first line so screen readers read the whole conversation from the top.
    const body = $('#dialog-body');
    body.setAttribute('tabindex', '-1');
    body.focus();
  }

  function confirmDialog(title, text, yesLabel, onYes) {
    dialogReturn = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fid : null;
    dialogEl.replaceChildren(
      h('h2', { id: 'dialog-title' }, title),
      h('p', { id: 'dialog-body' }, text),
      h('div', { class: 'actions' },
        btn(yesLabel, () => { dialogEl.close(); onYes(); }, { class: 'danger' }),
        btn('Cancel', () => dialogEl.close(), { class: 'primary' }))
    );
    dialogEl.setAttribute('aria-labelledby', 'dialog-title');
    dialogEl.setAttribute('aria-describedby', 'dialog-body');
    dialogEl.showModal();
    dialogEl.querySelector('.primary').focus();
  }

  dialogEl.addEventListener('close', () => {
    const el = dialogReturn && document.querySelector(`[data-fid="${CSS.escape(dialogReturn)}"]`);
    if (el) el.focus(); else focusHeading();
  });

  /* ---------- rendering ---------- */

  function commit() {
    saveGame(false);
    render();
    const msgs = pending.splice(0);
    msgs.forEach(addLog);
    if (msgs.length) announce(msgs.join(' '));
  }

  function go(v, opts = {}) {
    view = v;
    townLoc = v === 'town' && opts.loc ? opts.loc : null;
    saveGame(false);
    render({ focusHeading: true });
    const msgs = pending.splice(0);
    msgs.forEach(addLog);
    if (msgs.length) announce(msgs.join(' '));
  }

  function focusHeading() {
    const hd = mainEl.querySelector('h2, h1');
    if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus(); }
  }

  function render(opts = {}) {
    const active = document.activeElement;
    const fid = active && active.dataset ? active.dataset.fid : null;
    const scrollY = window.scrollY;

    renderChrome();
    const builder = VIEW_BUILDERS[view] || VIEW_BUILDERS.home;
    mainEl.replaceChildren(...[].concat(builder()));
    const label = view === 'title' ? 'Welcome' : (view === 'town' && townLoc ? D.LOCATIONS[townLoc].name : (VIEWS.find((x) => x.id === view) || {}).label);
    document.title = `${label} — Hearth & Crumb`;

    if (opts.focusHeading) { window.scrollTo(0, 0); focusHeading(); return; }
    if (fid) {
      const el = document.querySelector(`[data-fid="${CSS.escape(fid)}"]`);
      if (el) { el.focus({ preventScroll: true }); window.scrollTo(0, scrollY); return; }
      focusHeading();
    }
  }

  function phaseButton() {
    if (!state) return null;
    const map = {
      morning: ['Open the shop', openShop],
      open: [`Go to the counter (${plural(state.customers.length, 'customer')} waiting)`, () => go('counter')],
      afternoon: ['Close up and end the day', endDay],
      evening: [`Sleep, then start Day ${state.day + 1}`, startDay]
    };
    const [label, fn] = map[state.phase];
    return btn(label, fn, { class: 'primary', fid: 'phase-btn' });
  }

  function renderChrome() {
    const inGame = !!state && view !== 'title';
    navEl.hidden = !inGame;
    statusEl.hidden = !inGame;
    if (!inGame) return;
    statusEl.replaceChildren(
      h('p', { class: 'status-line' },
        h('span', null, h('strong', null, `Day ${state.day}`)), ' · ',
        h('span', null, PHASE_NAMES[state.phase]), ' · ',
        h('span', null, plural(state.coins, 'coin')), ' · ',
        h('span', null, `${state.name}${state.title ? ', ' + state.title : ''}`)),
      h('div', { class: 'phase-action' }, phaseButton())
    );
    navEl.replaceChildren(h('ul', null, VIEWS.map((v) => {
      let label = v.label;
      if (v.id === 'counter' && state.phase === 'open') label += ` (${state.customers.length} waiting)`;
      return h('li', null, h('button', {
        type: 'button', fid: 'nav-' + v.id, 'aria-current': view === v.id ? 'page' : null,
        onclick: () => go(v.id)
      }, label));
    })));
  }

  const section = (title, ...kids) => h('section', { 'aria-label': title }, h('h3', null, title), ...kids);
  const dl = (pairs) => h('dl', { class: 'facts' }, pairs.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));

  /* ----- title screen ----- */

  function viewTitle() {
    const save = readSave();
    const out = [
      h('h2', { class: 'title-heading' }, 'Welcome to Lanternmere'),
      h('p', { class: 'lead' }, 'A cozy, unhurried game about running a magical bakery, befriending a town of many peoples, and waking an old enchanted hearth. Play entirely at your own pace, with keyboard, mouse, touch, or screen reader.')
    ];
    if (save) {
      out.push(section('Continue your story',
        h('p', null, `${save.name}'s bakery, ${save.bakery}. Day ${save.day}, ${PHASE_NAMES[save.phase] || ''}. ${plural(save.coins, 'coin')}.`),
        btn('Continue', () => { state = migrate(save); view = 'home'; say(`Welcome back, ${state.name}. It is Day ${state.day}, ${PHASE_NAMES[state.phase]}.`); go('home'); }, { class: 'primary', fid: 'continue' })
      ));
    }
    const nameInput = h('input', { id: 'player-name', type: 'text', autocomplete: 'off', maxlength: '30', required: true });
    const bakeryInput = h('input', { id: 'bakery-name', type: 'text', autocomplete: 'off', maxlength: '40', value: 'Hearth & Crumb' });
    const errorEl = h('p', { id: 'name-error', class: 'error', role: 'alert' });
    const form = h('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (!name) { errorEl.textContent = 'Please enter a name for your baker.'; nameInput.setAttribute('aria-invalid', 'true'); nameInput.focus(); return; }
        const begin = () => {
          newGame(name, bakeryInput.value.trim());
          say(`Welcome to Lanternmere, ${name}! This is your bakery overview. Your first steps are listed under "Suggested next steps".`);
          go('home');
        };
        if (save) confirmDialog('Start a new game?', 'Starting a new game will replace your saved game. This cannot be undone.', 'Replace my save and start', begin);
        else begin();
      }
    },
      h('div', { class: 'field' }, h('label', { for: 'player-name' }, 'Your baker\'s name'), nameInput, errorEl),
      h('div', { class: 'field' }, h('label', { for: 'bakery-name' }, 'Your bakery\'s name'), bakeryInput),
      h('button', { type: 'submit', class: save ? '' : 'primary' }, 'Start a new game')
    );
    out.push(section('New game', form));
    out.push(section('Before you begin',
      h('p', null, 'You can change text size, colors, motion, and sound at any time.'),
      h('div', { class: 'actions' },
        btn('Settings', () => go('settings'), { fid: 'title-settings' }),
        btn('How to play', () => go('help'), { fid: 'title-help' }))
    ));
    return out;
  }

  /* ----- bakery overview ----- */

  function nextSteps() {
    const steps = [];
    const stock = Object.keys(state.baked).filter((id) => bakedCount(id) > 0);
    const ready = state.known.filter((id) => canBake(id).ok);
    if (state.phase === 'morning') {
      if (state.day === 1 && settings.tips) steps.push('Tip: the Pantry lists your ingredients, and the Kitchen lists your recipes. Every action tells you what it costs before you do it.');
      if (!stock.length) steps.push(ready.length ? `Bake something in the Kitchen. You can make: ${listText(ready.map(recipeName))}.` : 'Buy ingredients at Moonwell Market in Town, then bake in the Kitchen.');
      else steps.push(`Your display case has ${listText(stock.map((id) => `${bakedCount(id)} ${recipeName(id)}`))}. You can bake more, or open the shop.`);
      const low = Object.keys(D.INGREDIENTS).filter((i) => (state.inv[i] || 0) <= 1);
      if (low.length) steps.push(`Running low on ${listText(low.map(ingName))}. Moonwell Market in Town sells more.`);
      steps.push('When you are ready, choose "Open the shop". Customers arrive one at a time, and they will wait as long as you need.');
    } else if (state.phase === 'open') {
      steps.push(`${plural(state.customers.length, 'customer')} waiting at the Counter.`);
    } else if (state.phase === 'afternoon') {
      steps.push('Visit Town to talk with neighbors, forage ingredients, buy supplies, or work on quests.');
      if (state.day === 1 && settings.tips) steps.push('Tip: talking to a neighbor once a day raises your friendship. Some neighbors have quests for you.');
      steps.push('When you are finished, choose "Close up and end the day". You can stay in the afternoon as long as you like.');
    }
    return steps;
  }

  function summaryBlock(s, headingLevel) {
    const H = headingLevel || 'h3';
    return h('section', { class: 'card', 'aria-label': `Day ${s.day} summary` },
      h(H, null, `Day ${s.day} summary`),
      dl([
        ['Customers served', String(s.served)],
        s.declined ? ['Customers you couldn\'t serve', String(s.declined)] : null,
        ['Coins earned', String(s.coinsEarned)],
        ['Coins spent', String(s.coinsSpent)],
        ['Coins at day\'s end', String(s.coinsEnd)],
        ['Baked and brewed', s.baked.length ? listText(s.baked) : 'Nothing today'],
        ['Friendships', s.rel.length ? s.rel.join('; ') : 'No changes'],
        s.notes.length ? ['Notable moments', s.notes.join(' ')] : null
      ]));
  }

  function viewHome() {
    const out = [h('h2', null, `${state.bakery}: Day ${state.day}, ${PHASE_NAMES[state.phase]}`)];
    if (state.phase === 'evening') {
      const s = state.summaries[state.summaries.length - 1];
      out.push(h('p', { class: 'lead' }, 'The ovens tick as they cool. You sit by the Hearthstone and look back on the day.'));
      if (s) out.push(summaryBlock(s));
      out.push(h('p', null, lastSaveText || 'Your game saves automatically.'));
      out.push(h('div', { class: 'actions' }, phaseButton(), btn('Open the journal', () => go('journal'), { fid: 'home-journal' })));
      return out;
    }
    const hearthQ = state.quests.hearth;
    out.push(h('p', { class: 'lead' }, hearthQ.status === 'complete'
      ? 'The Hearthstone glows warm and steady, crackling contentedly whenever someone comes through the door.'
      : 'The bakery smells of flour and woodsmoke. In the back, the old Hearthstone glows only faintly, like it is waiting for something.'));
    out.push(section('Suggested next steps', h('ul', null, nextSteps().map((s) => h('li', null, s))), h('div', { class: 'actions' }, phaseButton())));
    out.push(section('Current quest objectives', currentObjectives().length
      ? h('ul', null, currentObjectives().map(({ def, st }) => h('li', null, h('strong', null, def.title + ': '), st.text, ` (${st.where})`)))
      : h('p', null, 'No active quests right now. Talk to neighbors in Town to find more.'),
      btn('View all quests', () => go('quests'), { fid: 'home-quests' })));
    out.push(section('Town notice board', h('p', null, D.NOTICES[(state.day - 1) % D.NOTICES.length])));
    return out;
  }

  /* ----- kitchen ----- */

  function recipeCard(id) {
    const r = D.RECIPES[id];
    const known = state.known.includes(id);
    const c = canBake(id);
    const ingText = Object.entries(r.ingredients).map(([ing, n]) => `${n} ${ingName(ing)} (you have ${state.inv[ing] || 0})`);
    if (r.needsKey) ingText.push(`the ${D.KEY_ITEMS[r.needsKey].name} (${state.keyItems.includes(r.needsKey) ? 'you have it' : 'you don\'t have it yet'}; not used up)`);
    let status;
    if (!known) status = r.questOnly ? 'Not learned yet. This recipe is part of the main story.' : `Not learned yet. The recipe card is sold at the Lanternmere Library for ${r.cost} coins.`;
    else status = c.ok ? 'Ready to make.' : c.reasons.join(' ');
    const verb = r.skill === 'brewing' ? 'Brew' : 'Bake';
    return h('article', { class: 'card' + (known ? '' : ' locked') },
      h('h3', null, r.name),
      h('p', null, r.desc),
      dl([
        ['Status', h('strong', null, status)],
        ['Ingredients', listText(ingText)],
        ['Skill needed', `${D.SKILLS[r.skill].name} level ${r.level} (yours: ${skillLevel(r.skill)})`],
        ['Makes', `${servingsPerBatch()} servings per batch`],
        ['Flavors', tagText(r.tags)],
        ['Sells for', `${r.price} coins each`],
        ['Magical effect', r.effectText],
        ['In your display case', String(bakedCount(id))]
      ]),
      known ? btn(`${verb} ${r.name}`, () => bake(id), { fid: 'bake-' + id, 'aria-describedby': null, class: c.ok ? 'primary' : '' }) : null
    );
  }

  function viewKitchen() {
    const known = state.known;
    const unknown = Object.keys(D.RECIPES).filter((id) => !known.includes(id));
    return [
      h('h2', null, 'Kitchen'),
      h('p', { class: 'lead' }, `Bake and brew here any time. Each batch makes ${servingsPerBatch()} servings and goes into your display case. Nothing spoils. A Keeping Charm on the case sees to that.`),
      section(`Your recipes (${known.length})`, h('div', { class: 'cards' }, known.map(recipeCard))),
      unknown.length ? section(`Recipes to discover (${unknown.length})`, h('div', { class: 'cards' }, unknown.map(recipeCard))) : null
    ];
  }

  /* ----- pantry ----- */

  function viewPantry() {
    const stock = Object.keys(state.baked).filter((id) => bakedCount(id) > 0);
    return [
      h('h2', null, 'Pantry'),
      section('Ingredients', h('ul', { class: 'cards plain' }, Object.entries(D.INGREDIENTS).map(([id, ing]) => {
        const n = state.inv[id] || 0;
        const status = n === 0 ? 'Out of stock' : n <= 2 ? 'Low stock' : 'Well stocked';
        return h('li', { class: 'card' },
          h('h4', null, `${ing.name}: ${n}`),
          h('p', null, ing.desc),
          dl([['Stock', h('strong', { class: n <= 2 ? 'warn' : '' }, status)], ['Where to find', ing.source], ['Market price', `${price(id)} coins each`]]),
          btn(`Go to Moonwell Market to buy ${ing.name}`, () => go('town', { loc: 'market' }), { fid: 'pantry-buy-' + id }));
      }))),
      section('Display case (ready to serve)', stock.length
        ? h('ul', null, stock.map((id) => h('li', null, `${recipeName(id)}: ${bakedCount(id)} (${tagText(D.RECIPES[id].tags)})`)))
        : h('p', null, 'Empty. Bake something in the Kitchen.')),
      section('Special items', state.keyItems.length
        ? h('ul', null, state.keyItems.map((k) => h('li', null, h('strong', null, D.KEY_ITEMS[k].name + ': '), D.KEY_ITEMS[k].desc)))
        : h('p', null, 'None yet.'))
    ];
  }

  /* ----- counter ----- */

  function viewCounter() {
    const out = [h('h2', null, 'Counter')];
    if (state.phase !== 'open') {
      out.push(h('p', { class: 'lead' }, state.phase === 'morning'
        ? 'The shop is not open yet. Bake what you like first, then open the shop. Customers will wait patiently as long as you need.'
        : 'The shop is closed for today. Customers will return tomorrow.'));
      if (state.phase === 'morning') out.push(h('div', { class: 'actions' }, phaseButton()));
      return out;
    }
    const c = state.customers[0];
    const stock = Object.keys(state.baked).filter((id) => bakedCount(id) > 0);
    const npc = c.npc ? D.NPCS[c.npc] : null;
    out.push(h('section', { class: 'card customer', 'aria-labelledby': 'cust-h' },
      h('h3', { id: 'cust-h' }, `Now serving: ${c.name}`),
      dl([
        ['People', c.people],
        npc ? ['Who they are', `${npc.role}. ${npc.personality}`] : null,
        ['Order', h('strong', null, `They would like ${orderText(c.order)}.`)],
        ['Enjoys', tagText(c.likes)],
        ['Not fond of', tagText(c.dislikes)],
        npc ? ['Friendship', `${relLabel(state.rel[c.npc])} (${state.rel[c.npc]} of 100)`] : null
      ])));
    out.push(section('Serve from your display case', stock.length
      ? h('ul', { class: 'choice-list' }, stock.map((id) => {
        const m = matchInfo(c, id);
        return h('li', null, btn(`Serve ${recipeName(id)}: ${bakedCount(id)} left. ${m.text}.`, () => serve(id), { fid: 'serve-' + id, class: m.kind === 'exact' ? 'primary' : '' }));
      }))
      : h('p', null, 'Your display case is empty.')));
    out.push(section('Other choices', h('ul', { class: 'choice-list' },
      h('li', null, btn('Offer a glass of water and a kind word (free)', kindWord, { fid: 'kind-word' })),
      h('li', null, btn('Let them know you can\'t fill this order today', declineOrder, { fid: 'decline' })))));
    if (state.customers.length > 1) {
      out.push(section('Also waiting', h('ol', null, state.customers.slice(1).map((w) => h('li', null, `${w.name}, who would like ${orderText(w.order)}.`)))));
    }
    return out;
  }

  /* ----- town ----- */

  function npcBlock(id) {
    const n = D.NPCS[id];
    const stock = Object.keys(state.baked).filter((r) => bakedCount(r) > 0);
    const selId = 'gift-select-' + id;
    const select = h('select', { id: selId, fid: selId }, h('option', { value: '' }, 'Choose a treat'),
      stock.map((r) => h('option', { value: r }, `${recipeName(r)} (${bakedCount(r)} left)`)));
    const deliveries = QUEST_IDS.map((qid) => ({ qid, st: stageOf(qid) })).filter(({ st }) => st && st.type === 'deliver' && st.npc === id);
    const offers = QUEST_IDS.some((qid) => D.QUESTS[qid].giver === id && questAvailable(qid));
    const talkStage = QUEST_IDS.some((qid) => { const st = stageOf(qid); return st && st.type === 'talk' && st.npc === id; });
    const met = state.met[id];
    return h('article', { class: 'card' },
      h('h4', null, met ? n.name : `${n.name} (not yet met)`),
      dl([
        ['People', n.people],
        ['Role', n.role],
        ['Friendship', `${relLabel(state.rel[id])} (${state.rel[id]} of 100)`],
        ['Talked today', state.talkedToday[id] ? 'Yes' : 'Not yet'],
        (talkStage || offers) ? ['Quest', h('strong', null, talkStage ? 'They have something to tell you for a quest.' : 'They might have a request for you.')] : null
      ]),
      h('div', { class: 'actions' }, btn(`Talk with ${n.name}`, () => talk(id), { fid: 'talk-' + id, class: (talkStage || offers) ? 'primary' : '' })),
      deliveries.map(({ qid, st }) => h('div', { class: 'actions' }, btn(
        `Give ${st.qty} ${recipeName(st.item)} to ${n.name} for "${D.QUESTS[qid].title}" (you have ${bakedCount(st.item)})`,
        () => deliver(qid), { fid: 'deliver-' + qid, class: bakedCount(st.item) >= st.qty ? 'primary' : '' }))),
      h('div', { class: 'gift-row' },
        h('label', { for: selId }, `Give ${n.name} a gift`),
        select,
        btn(state.giftedToday[id] ? 'Give gift (already gave one today)' : 'Give gift', () => gift(id, select.value), { fid: 'gift-' + id }))
    );
  }

  function viewTown() {
    if (!townLoc) {
      return [
        h('h2', null, 'Town of Lanternmere'),
        h('p', { class: 'lead' }, 'Visit a place to meet neighbors, gather ingredients, and follow quests. Travel takes no time, so go wherever you like.'),
        h('ul', { class: 'cards plain' }, Object.entries(D.LOCATIONS).map(([id, loc]) => {
          const people = NPC_IDS.filter((n) => D.NPCS[n].location === id).map((n) => D.NPCS[n].name);
          const questHere = currentObjectives().filter(({ st }) => st.where && st.where.includes(loc.name)).map(({ def }) => def.title);
          return h('li', { class: 'card' },
            h('h3', null, loc.name),
            h('p', null, loc.desc),
            dl([['People here', listText(people)], questHere.length ? ['Quests here', listText(questHere)] : null]),
            btn(`Go to ${loc.name}`, () => go('town', { loc: id }), { fid: 'goto-' + id }));
        }))
      ];
    }
    const loc = D.LOCATIONS[townLoc];
    const out = [
      h('h2', null, loc.name),
      h('p', { class: 'lead' }, loc.desc),
      h('div', { class: 'actions' }, btn('Back to the town map', () => go('town'), { fid: 'back-town' }))
    ];
    const here = NPC_IDS.filter((n) => D.NPCS[n].location === townLoc);
    if (townLoc === 'market') {
      out.push(section('Ingredient stalls', h('p', null, `You have ${plural(state.coins, 'coin')}.` + (state.discount ? ` Tamsin's ${Math.round(state.discount * 100)}% friend discount is included in these prices.` : '')),
        h('ul', { class: 'cards plain' }, Object.entries(D.INGREDIENTS).map(([id, ing]) => h('li', { class: 'card compact' },
          h('h4', null, `${ing.name}: ${price(id)} coins each`),
          h('p', null, `You have ${state.inv[id] || 0}.`),
          h('div', { class: 'actions' },
            btn(`Buy 1 ${ing.name} for ${price(id)} coins`, () => buy(id, 1), { fid: `buy1-${id}` }),
            btn(`Buy 3 ${ing.name} for ${price(id) * 3} coins`, () => buy(id, 3), { fid: `buy3-${id}` })))))));
    }
    if (townLoc === 'library') {
      const forSale = Object.keys(D.RECIPES).filter((id) => D.RECIPES[id].cost && !state.known.includes(id));
      out.push(section('Recipe cards for sale', h('p', null, `You have ${plural(state.coins, 'coin')}.`), forSale.length
        ? h('ul', { class: 'cards plain' }, forSale.map((id) => {
          const r = D.RECIPES[id];
          return h('li', { class: 'card compact' },
            h('h4', null, `${r.name}: ${r.cost} coins`),
            h('p', null, r.desc),
            dl([['Needs', `${D.SKILLS[r.skill].name} level ${r.level}`], ['Ingredients', listText(Object.entries(r.ingredients).map(([i, n]) => `${n} ${ingName(i)}`))], ['Flavors', tagText(r.tags)], ['Sells for', `${r.price} coins each`]]),
            btn(`Buy the ${r.name} recipe card for ${r.cost} coins`, () => buyRecipe(id), { fid: 'recipe-' + id }));
        }))
        : h('p', null, 'You have bought every recipe card on the shelf.')));
      out.push(section('Study', h('p', null, `Lessons from the library's cookery books cost ${D.LESSON.cost} coins and give ${D.LESSON.xp} experience. You can also take lessons from the Improve section.`)));
    }
    if (townLoc === 'square') {
      out.push(section('Notice board', h('p', null, D.NOTICES[(state.day - 1) % D.NOTICES.length])));
    }
    if (townLoc === 'orchard' || townLoc === 'river') {
      const what = townLoc === 'orchard'
        ? `2 Whisperpetal${state.flags.honeyForage ? ' and 2 Orchard Honey' : ''}`
        : `${state.flags.dewberryBonus ? 4 : 2} Dewberries and 1 Mistleaf`;
      out.push(section('Forage', h('p', null, state.foragedToday[townLoc] ? 'You have already gathered here today. More will grow by tomorrow.' : `You can gather ${what} here once a day, for free.`),
        btn(`Gather ${what}`, () => forage(townLoc), { fid: 'forage-' + townLoc })));
    }
    out.push(section('Look around', h('p', null, 'Take in the sights. Sometimes you will notice something useful.'),
      btn(`Look around ${loc.name}`, () => lookAround(townLoc), { fid: 'look-' + townLoc })));
    if (here.length) out.push(section('People here', h('div', { class: 'cards' }, here.map(npcBlock))));
    return out;
  }

  /* ----- quests ----- */

  function questCard(qid) {
    const def = D.QUESTS[qid], q = state.quests[qid];
    const statusText = q.status === 'complete' ? 'Complete' : q.status === 'active' ? 'In progress' : 'Not started';
    const st = stageOf(qid);
    let howToStart = null;
    if (q.status === 'notstarted') {
      const giver = D.NPCS[def.giver];
      howToStart = questAvailable(qid)
        ? `Talk with ${giver.name} at ${D.LOCATIONS[giver.location].name} to begin.`
        : `Not available yet. Keep following the main story, then talk with ${giver.name}.`;
    }
    return h('article', { class: 'card' },
      h('h4', null, `${def.title}${def.main ? ' (main story)' : ''}`),
      h('p', null, def.summary),
      dl([
        ['Status', h('strong', null, statusText)],
        st ? ['Current objective', st.text] : null,
        st ? ['Where', st.where] : null,
        howToStart ? ['How to start', howToStart] : null,
        ['Given by', def.giverText],
        ['Reward', def.rewardText]
      ]),
      q.status !== 'notstarted' ? h('details', null, h('summary', null, `Steps for ${def.title}`),
        h('ol', null, def.stages.map((s, i) => {
          const label = q.status === 'complete' || i < q.stage ? 'Done' : i === q.stage ? 'Current' : 'Upcoming';
          return h('li', null, `${label}: ${i <= q.stage || q.status === 'complete' ? s.text : 'Not yet revealed.'}`);
        }))) : null
    );
  }

  function viewQuests() {
    const groups = { active: [], notstarted: [], complete: [] };
    QUEST_IDS.forEach((id) => groups[state.quests[id].status].push(id));
    return [
      h('h2', null, 'Quests'),
      h('p', { class: 'lead' }, 'Quests never have time limits. Work on them whenever you like.'),
      section(`In progress (${groups.active.length})`, groups.active.length ? h('div', { class: 'cards' }, groups.active.map(questCard)) : h('p', null, 'None right now.')),
      section(`Not started (${groups.notstarted.length})`, groups.notstarted.length ? h('div', { class: 'cards' }, groups.notstarted.map(questCard)) : h('p', null, 'None.')),
      section(`Complete (${groups.complete.length})`, groups.complete.length ? h('div', { class: 'cards' }, groups.complete.map(questCard)) : h('p', null, 'None yet.'))
    ];
  }

  /* ----- neighbors ----- */

  function viewFriends() {
    return [
      h('h2', null, 'Neighbors'),
      h('p', { class: 'lead' }, 'Friendship grows when you talk each day, give gifts, and serve people well. Labels from lowest to highest: Stranger, Acquaintance, Friendly, Good friend, Close friend.'),
      h('div', { class: 'cards' }, NPC_IDS.map((id) => {
        const n = D.NPCS[id], met = state.met[id], v = state.rel[id];
        return h('article', { class: 'card' },
          h('h3', null, n.name),
          dl([
            ['People', n.people],
            ['Role', n.role],
            ['Usually found at', D.LOCATIONS[n.location].name],
            ['Friendship', `${relLabel(v)} (${v} of 100)`],
            met ? ['Personality', n.personality] : null,
            met ? ['Hopes', n.goal] : null,
            met ? ['Enjoys', tagText(n.likes)] : null,
            met ? ['Not fond of', tagText(n.dislikes)] : null,
            ['Favorite treat', v >= 25 ? recipeName(n.favorite) : 'Become Friendly to find out.'],
            !met ? ['Note', 'You have not met yet.'] : null
          ]),
          btn(`Visit ${D.LOCATIONS[n.location].name}`, () => go('town', { loc: n.location }), { fid: 'visit-' + id }));
      }))
    ];
  }

  /* ----- improve ----- */

  function viewImprove() {
    return [
      h('h2', null, 'Improve your bakery'),
      h('p', { class: 'lead' }, `You have ${plural(state.coins, 'coin')}. Every cost and effect is listed before you buy.`),
      section('Skills', h('div', { class: 'cards' }, Object.entries(D.SKILLS).map(([id, sk]) => {
        const lv = skillLevel(id), xp = state.xp[id];
        const next = lv < 3 ? `${D.SKILL_LEVELS[lv] - xp} more experience to reach level ${lv + 1}` : 'Highest level reached';
        const gain = id === 'hospitality' ? 'Gain 1 experience for each customer served.' : `Gain 1 experience each time you ${id === 'baking' ? 'bake' : 'brew'}.`;
        return h('article', { class: 'card' },
          h('h4', null, `${sk.name}: level ${lv}`),
          h('p', null, sk.desc),
          dl([['Experience', `${xp}`], ['Next level', next], ['How to improve', gain]]),
          lv < 3 ? btn(`Take a ${sk.name} lesson: ${D.LESSON.cost} coins for ${D.LESSON.xp} experience`, () => takeLesson(id), { fid: 'lesson-' + id }) : null);
      }))),
      section('Shop upgrades', h('div', { class: 'cards' }, Object.entries(D.UPGRADES).map(([id, u]) => {
        const owned = has(id);
        const avail = owned ? 'Owned' : state.coins >= u.cost ? 'You can afford this' : `You need ${u.cost - state.coins} more coins`;
        return h('article', { class: 'card' },
          h('h4', null, u.name),
          dl([['Effect', u.desc], ['Cost', `${u.cost} coins`], ['Status', h('strong', null, avail)]]),
          owned ? null : btn(`Buy ${u.name} for ${u.cost} coins`, () => buyUpgrade(id), { fid: 'upgrade-' + id }));
      })))
    ];
  }

  /* ----- journal ----- */

  function viewJournal() {
    const todays = state.log.filter((l) => l.day === state.day);
    return [
      h('h2', null, 'Journal'),
      section(`Today's events (Day ${state.day})`, todays.length ? h('ol', { class: 'log' }, todays.map((l) => h('li', null, l.text))) : h('p', null, 'Nothing yet today.')),
      section('Daily summaries', state.summaries.length
        ? h('div', { class: 'cards' }, state.summaries.slice().reverse().map((s) => summaryBlock(s, 'h4')))
        : h('p', null, 'Summaries appear here at the end of each day.')),
      section('Lore and glossary', h('p', null, 'Everything you have learned about Lanternmere, its peoples, and its magic.'),
        h('dl', { class: 'glossary' }, state.glossary.map((g) => [h('dt', null, D.GLOSSARY[g].term), h('dd', null, D.GLOSSARY[g].text)])))
    ];
  }

  /* ----- settings ----- */

  function viewSettings() {
    const radio = (name, value, label, checked, onchange) => h('div', { class: 'radio' },
      h('input', { type: 'radio', name, id: `${name}-${value}`, value, checked, fid: `${name}-${value}`, onchange }),
      h('label', { for: `${name}-${value}` }, label));
    const check = (id, label, checked, onchange, hint) => h('div', { class: 'check' },
      h('input', { type: 'checkbox', id, checked, fid: id, onchange, 'aria-describedby': hint ? id + '-hint' : null }),
      h('label', { for: id }, label),
      hint ? h('p', { class: 'hint', id: id + '-hint' }, hint) : null);
    const set = (k, v, msg) => { settings[k] = v; saveSettings(); say(msg); commit(); };

    const out = [
      h('h2', null, 'Settings'),
      h('p', { class: 'lead' }, 'Settings are saved in this browser and apply right away.'),
      h('fieldset', null, h('legend', null, 'Text size'),
        [100, 125, 150, 200].map((v) => radio('textsize', v, `${v}%`, settings.textScale === v, () => set('textScale', v, `Text size set to ${v}%.`))),
        h('p', { class: 'hint' }, 'Browser zoom (Control or Command with plus) works too.')),
      h('fieldset', null, h('legend', null, 'Colors'),
        radio('theme', 'warm', 'Warm daylight (dark text on cream)', settings.theme === 'warm', () => set('theme', 'warm', 'Warm daylight colors on.')),
        radio('theme', 'night', 'Night bakery (light text on dark)', settings.theme === 'night', () => set('theme', 'night', 'Night bakery colors on.')),
        radio('theme', 'contrast', 'High contrast (white and yellow on black)', settings.theme === 'contrast', () => set('theme', 'contrast', 'High contrast colors on.'))),
      h('fieldset', null, h('legend', null, 'Comfort'),
        check('opt-motion', 'Reduce motion', settings.reducedMotion, (e) => set('reducedMotion', e.target.checked, `Reduced motion ${e.target.checked ? 'on' : 'off'}.`), 'Turns off all animations and transitions.'),
        check('opt-sound', 'Play sound effects', settings.sound, (e) => { set('sound', e.target.checked, `Sound effects ${e.target.checked ? 'on' : 'off'}.`); if (e.target.checked) chime('good'); }, 'Short, gentle chimes. Sounds never carry information that is not also shown in text.'),
        check('opt-spacing', 'Extra spacing between letters and lines', settings.spacing, (e) => set('spacing', e.target.checked, `Extra spacing ${e.target.checked ? 'on' : 'off'}.`)),
        check('opt-tips', 'Show beginner tips', settings.tips, (e) => set('tips', e.target.checked, `Beginner tips ${e.target.checked ? 'on' : 'off'}.`)))
    ];

    if (state) {
      const area = h('textarea', { id: 'save-code', rows: '4', fid: 'save-code', 'aria-describedby': 'save-code-hint' });
      out.push(h('fieldset', null, h('legend', null, 'Saving'),
        h('p', null, 'Your game saves automatically in this browser after every action. ' + (lastSaveText || '')),
        h('div', { class: 'actions' },
          btn('Save now', () => { saveGame(true); commit(); }, { fid: 'save-now' }),
          btn('Return to title screen', () => { saveGame(false); view = 'title'; townLoc = null; render({ focusHeading: true }); announce('Game saved. Returned to the title screen.'); }, { fid: 'to-title' })),
        h('h3', null, 'Save code'),
        h('p', { class: 'hint', id: 'save-code-hint' }, 'To move your game to another browser or keep a backup, copy a save code and store it somewhere safe. To restore, paste a code here and choose Load.'),
        h('label', { for: 'save-code' }, 'Save code'),
        area,
        h('div', { class: 'actions' },
          btn('Create save code', () => {
            area.value = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
            area.focus(); area.select();
            announce('Save code created and selected. Copy it now.');
          }, { fid: 'export' }),
          btn('Load from save code', () => {
            try {
              const s = JSON.parse(decodeURIComponent(escape(atob(area.value.trim()))));
              if (!s || !s.quests || !s.inv) throw new Error('bad');
              confirmDialog('Load this save?', `This replaces your current game with ${s.name}'s game on Day ${s.day}.`, 'Load save', () => { state = migrate(s); say(`Save loaded. Day ${state.day}.`); go('home'); });
            } catch (e) { announce('That save code could not be read. Check that it was copied completely.'); }
          }, { fid: 'import' })),
        h('h3', null, 'Start over'),
        btn('Delete my save and start over', () => confirmDialog('Delete your save?', 'This permanently deletes your saved game in this browser.', 'Delete save', () => {
          try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
          state = null; view = 'title'; render({ focusHeading: true }); announce('Save deleted.');
        }), { class: 'danger', fid: 'delete-save' })
      ));
    } else {
      out.push(btn('Back to title screen', () => go('title'), { fid: 'back-title' }));
    }
    return out;
  }

  /* ----- help ----- */

  function viewHelp() {
    return [
      h('h2', null, 'How to play'),
      section('The idea', h('p', null, 'You run a small bakery in Lanternmere, a river town shared by many magical peoples. Bake treats, serve customers, befriend neighbors, and discover how to wake the old Hearthstone. Nothing is timed and nothing is lost by taking your time.')),
      section('A day in the bakery', h('ol', null,
        h('li', null, 'Morning: check the Bakery overview for goals. Buy ingredients in Town at Moonwell Market, and bake in the Kitchen.'),
        h('li', null, 'Open the shop: customers come to the Counter one at a time. Each shows their order and the flavors they enjoy. Serve something, offer a kind word, or politely decline. There is no penalty for declining.'),
        h('li', null, 'Afternoon: visit Town. Talk with neighbors, give gifts, forage, look around, and progress quests. You can bake here too.'),
        h('li', null, 'Evening: read your day summary, then sleep to begin the next day. Your game saves automatically.'))),
      section('Getting better', h('ul', null,
        h('li', null, 'Baking and Brewing improve each time you make something. Hospitality improves as you serve people. You can also pay for lessons in the Improve section.'),
        h('li', null, 'New recipe cards are sold at the Lanternmere Library.'),
        h('li', null, 'Shop upgrades in the Improve section make each day easier.'),
        h('li', null, 'Serving exactly what someone ordered earns the most coins and friendship. Every serve button tells you how well the treat matches.'))),
      section('Controls', h('ul', null,
        h('li', null, 'Everything works with a keyboard. Press Tab and Shift with Tab to move between controls, and Enter or Space to activate them.'),
        h('li', null, 'The game sections (Bakery, Kitchen, Pantry, and so on) are in the navigation near the top of the page. After choosing one, focus moves to that section\'s heading.'),
        h('li', null, 'The main action button for the current part of the day ("Open the shop", "End the day") is always just above the navigation.'),
        h('li', null, 'Conversations open in a dialog. Press Escape or choose "Close conversation" to return to where you were.'),
        h('li', null, 'Use "Skip to game content" at the very top of the page to jump past the navigation.'))),
      section('Screen reader tips', h('ul', null,
        h('li', null, 'Each section has a level 2 heading, and parts within it have level 3 or 4 headings. Heading navigation is the quickest way around.'),
        h('li', null, 'Results of your actions are announced in a polite live region, and are also shown in the message area below the navigation.'),
        h('li', null, 'Everything announced is kept in the Journal under "Today\'s events", so you can review it at any time.'))),
      section('Accessibility settings', h('p', null, 'In Settings you can change text size up to 200%, switch to night or high-contrast colors, reduce motion, turn optional sound effects on, and add extra text spacing. The game also follows your system\'s reduced-motion and contrast preferences the first time you play.')),
      state ? btn('Back to the bakery', () => go('home'), { fid: 'help-back' }) : btn('Back to title screen', () => go('title'), { fid: 'help-back' })
    ];
  }

  const VIEW_BUILDERS = {
    title: viewTitle, home: viewHome, kitchen: viewKitchen, pantry: viewPantry, counter: viewCounter,
    town: viewTown, quests: viewQuests, friends: viewFriends, improve: viewImprove,
    journal: viewJournal, settings: viewSettings, help: viewHelp
  };

  /* ---------- start ---------- */

  applySettings();
  render();
  const brand = $('#brand-link');
  if (brand) brand.addEventListener('click', (e) => { e.preventDefault(); go(state ? 'home' : 'title'); });
  window.__HC = { get state() { return state; } }; // handy for testing in the console
})();
