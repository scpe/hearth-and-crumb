/* Hearth & Crumb — game content.
   Everything here (people, places, recipes, lore) is original to Hearth & Crumb. */
'use strict';

window.HC_DATA = (function () {
  const TAGS = {
    sweet: 'sweet', savory: 'savory', spicy: 'spicy', warm: 'warm',
    cold: 'cold', fruity: 'fruity', floral: 'floral', tea: 'made with tea'
  };

  const INGREDIENTS = {
    flour: {
      name: 'Moonwheat Flour', price: 2,
      desc: 'Pale flour milled by moonlight beside the Moonwell. It holds gentle enchantments steady, so a baked spell does not crumble.',
      source: 'Moonwell Market'
    },
    butter: {
      name: 'Hearthbutter', price: 3,
      desc: 'Butter churned beside a lit hearth. It carries a feeling of comfort into anything it touches.',
      source: 'Moonwell Market'
    },
    starsugar: {
      name: 'Starsugar', price: 3,
      desc: 'Sugar that glimmers faintly in the dark. It brightens moods and makes wishes feel a little closer.',
      source: 'Moonwell Market'
    },
    mistleaf: {
      name: 'Mistleaf', price: 2,
      desc: 'Silvery tea leaves from fog-touched hedges. Steeped, they bring clear and quiet thoughts.',
      source: 'Moonwell Market, or forage 1 each day on the River Path'
    },
    emberroot: {
      name: 'Emberroot', price: 3,
      desc: 'A knobbly root that stays warm to the touch for days. It adds spice and a little courage.',
      source: 'Moonwell Market'
    },
    dewberry: {
      name: 'Dewberries', price: 3,
      desc: 'Cool, bright berries that ripen overnight beside the river. Refreshing, and said to make people laugh more easily.',
      source: 'Moonwell Market, or forage each day on the River Path'
    },
    whisperpetal: {
      name: 'Whisperpetal', price: 5,
      desc: 'Soft blossoms from the Whispering Orchard. Held close, they seem to murmur. They soothe worry.',
      source: 'Moonwell Market, or forage each day in the Whispering Orchard'
    },
    honey: {
      name: 'Orchard Honey', price: 5,
      desc: 'Golden honey from the orchard bees, who are said to dream of summer. It sweetens and mends.',
      source: 'Moonwell Market (and later, the Whispering Orchard)'
    }
  };

  const KEY_ITEMS = {
    cinder: {
      name: 'Emberglow Cinder',
      desc: 'A coal that glows softly without burning your hand. It was sung awake with an Emberkin flame-song. It is not used up when you bake with it.'
    },
    fragments: {
      name: 'Lantern-lore fragments',
      desc: 'Scraps of old Duskwing writing about lanterns, hearths, and welcome.'
    }
  };

  // effect: 'cheer' = +1 friendship when served to a named neighbor; 'tip' = +3 coins tip.
  const RECIPES = {
    scones: {
      name: 'Moonrise Scones', skill: 'baking', level: 1, price: 9, start: true,
      ingredients: { flour: 1, butter: 1, starsugar: 1 }, tags: ['sweet', 'warm'],
      desc: 'Crumbly scones that rise in a slow curve, like the moon over the river.',
      effect: 'cheer', effectText: 'A hopeful glow. Neighbors gain 1 extra friendship point.'
    },
    starfall: {
      name: 'Starfall Tea', skill: 'brewing', level: 1, price: 7, start: true,
      ingredients: { mistleaf: 1, starsugar: 1 }, tags: ['tea', 'sweet', 'warm'],
      desc: 'Mistleaf tea with a spoon of Starsugar that sparkles as it dissolves.',
      effect: 'tip', effectText: 'Sparkling insight. Customers leave a 3-coin tip.'
    },
    buns: {
      name: 'Ember Buns', skill: 'baking', level: 1, price: 9, start: true,
      ingredients: { flour: 1, emberroot: 1, butter: 1 }, tags: ['spicy', 'warm'],
      desc: 'Soft buns with a peppery Emberroot swirl. Many Emberkin families have their own way of twisting them.',
      effect: 'tip', effectText: 'Brave warmth. Customers leave a 3-coin tip.'
    },
    loaf: {
      name: 'Stonebaked Loaf', skill: 'baking', level: 1, price: 7, start: true,
      ingredients: { flour: 2 }, tags: ['savory', 'warm'],
      desc: 'A plain, honest loaf baked on a flat stone, the Cairnish way. Lanternmere\'s everyday bread.',
      effect: 'cheer', effectText: 'Steady comfort. Neighbors gain 1 extra friendship point.'
    },
    spritz: {
      name: 'Dewberry Spritz', skill: 'brewing', level: 1, price: 8, start: true,
      ingredients: { dewberry: 1, starsugar: 1 }, tags: ['cold', 'fruity', 'sweet'],
      desc: 'Fizzy dewberry juice, chilled by a tiny frost-charm in the jug.',
      effect: 'tip', effectText: 'Bubbling laughter. Customers leave a 3-coin tip.'
    },
    milktea: {
      name: 'Mistleaf Honey Tea', skill: 'brewing', level: 1, price: 8, cost: 15,
      ingredients: { mistleaf: 1, honey: 1 }, tags: ['tea', 'warm', 'sweet'],
      desc: 'A gentle cup sweetened with orchard honey. A favorite on foggy mornings.',
      effect: 'cheer', effectText: 'Quiet calm. Neighbors gain 1 extra friendship point.'
    },
    biscuits: {
      name: 'Duskbloom Biscuits', skill: 'baking', level: 1, price: 11, cost: 20,
      ingredients: { flour: 1, whisperpetal: 1, butter: 1 }, tags: ['floral', 'sweet'],
      desc: 'Thin biscuits that Duskwing couriers carry on night routes. They taste faintly of evening flowers.',
      effect: 'cheer', effectText: 'Gentle company. Neighbors gain 1 extra friendship point.'
    },
    tartlets: {
      name: 'Dewberry Tartlets', skill: 'baking', level: 2, price: 13, cost: 20,
      ingredients: { flour: 1, dewberry: 1, starsugar: 1, butter: 1 }, tags: ['fruity', 'sweet'],
      desc: 'Bite-sized tarts brimming with dewberries. A Tidewrought picnic staple.',
      effect: 'tip', effectText: 'Bright delight. Customers leave a 3-coin tip.'
    },
    wtart: {
      name: 'Whisperpetal Tart', skill: 'baking', level: 2, price: 13, cost: 25,
      ingredients: { flour: 1, whisperpetal: 1, honey: 1 }, tags: ['floral', 'sweet'],
      desc: 'A honeyed tart layered with Whisperpetal. If you listen closely, it hums.',
      effect: 'cheer', effectText: 'Soothing murmur. Neighbors gain 1 extra friendship point.'
    },
    lanterncakes: {
      name: 'Honey Lantern Cakes', skill: 'baking', level: 2, price: 15, cost: 30,
      ingredients: { flour: 1, honey: 1, butter: 1, starsugar: 1 }, tags: ['sweet', 'warm'],
      desc: 'Little cakes shaped like lanterns, with a Starsugar glaze that glows softly.',
      effect: 'tip', effectText: 'A warm welcome. Customers leave a 3-coin tip.'
    },
    chai: {
      name: 'Emberroot Chai', skill: 'brewing', level: 2, price: 12, cost: 25,
      ingredients: { emberroot: 1, mistleaf: 1, honey: 1 }, tags: ['spicy', 'tea', 'warm'],
      desc: 'Spiced Mistleaf tea with Emberroot and honey. It warms you from your toes upward.',
      effect: 'cheer', effectText: 'Fireside friendship. Neighbors gain 1 extra friendship point.'
    },
    hearthbread: {
      name: 'Hearthbread of Blessing', skill: 'baking', level: 3, price: 25, questOnly: true,
      ingredients: { flour: 2, butter: 1, honey: 1 }, needsKey: 'cinder', tags: ['savory', 'sweet', 'warm'],
      desc: 'A braided loaf baked over an Emberglow Cinder. Old ledgers say it was shared with every newcomer to town.',
      effect: 'cheer', effectText: 'A blessing of belonging. Neighbors gain 1 extra friendship point.'
    }
  };

  const SKILLS = {
    baking: { name: 'Baking', desc: 'Breads, cakes, and pastries. Higher levels unlock trickier recipes.' },
    brewing: { name: 'Brewing', desc: 'Teas and drinks. Higher levels unlock trickier recipes.' },
    hospitality: {
      name: 'Hospitality',
      desc: 'Serving people well. Level 2: neighbors gain 1 extra friendship point when served. Level 3: every sale earns a 2-coin tip.'
    }
  };
  const SKILL_LEVELS = [0, 5, 12]; // experience needed for levels 1, 2, 3
  const LESSON = { cost: 15, xp: 2 };

  const UPGRADES = {
    oven: { name: 'Warming Rune Oven', cost: 60, desc: 'Each batch you bake or brew makes 3 servings instead of 2.' },
    pantry: { name: 'Self-Stocking Pantry', cost: 45, desc: 'Each morning, 2 Moonwheat Flour and 1 Hearthbutter appear in your pantry.' },
    seats: { name: 'Window Seat Nook', cost: 50, desc: 'One extra customer visits the shop each day.' },
    garland: { name: 'Lantern Garland', cost: 40, desc: 'When you serve someone exactly what they asked for, they leave a 2-coin tip and gain 1 extra friendship point.' }
  };

  const LOCATIONS = {
    market: {
      name: 'Moonwell Market',
      desc: 'Stalls ring the silver-lined Moonwell. Awnings flap, a Duskwing glassblower sets out lanterns, and someone is always haggling cheerfully.'
    },
    square: {
      name: 'Elder Oak Square',
      desc: 'An enormous oak shades the town\'s meeting place. Its roots curl around benches, and the town notice board leans against its trunk.'
    },
    orchard: {
      name: 'Whispering Orchard',
      desc: 'Rows of old fruit trees whose leaves rustle in soft voices, even when there is no wind. Bees drift lazily between blossoms.'
    },
    library: {
      name: 'Lanternmere Library',
      desc: 'A crooked tower of books lit by hanging lanterns. It stays open late, during the Duskwing lantern hours.'
    },
    river: {
      name: 'River Path',
      desc: 'A winding path beside the Lanternmere river. A small ferry crosses to the far bank, and dewberry bushes grow thick along the water.'
    }
  };

  const NPCS = {
    tamsin: {
      name: 'Tamsin Rook', people: 'Human', role: 'Grocer at Moonwell Market', location: 'market',
      personality: 'Brisk, practical, and secretly sentimental.',
      goal: 'Saving up so her daughter Juniper can apprentice with a Duskwing glassblower.',
      likes: ['savory', 'warm'], dislikes: ['floral'], favorite: 'loaf',
      intro: [
        '"You must be the new baker. Tamsin Rook. I sell flour, butter, and opinions, and the opinions are free."',
        'She slides a sack of Moonwheat Flour across the counter. "First one\'s a welcome gift. Don\'t tell anyone, I\'ve a reputation."'
      ],
      chat: [
        '"Juniper drew a lantern on the back of my order book again. Honestly, it\'s better than my handwriting."',
        '"Moonwheat\'s good this week. Milled under a full moon. You can taste the difference, or so the miller insists."',
        '"Folks say Mossborn never hurry. Willa beat me to the best honey jars this morning, so I don\'t believe it."',
        '"Plain bread\'s underrated. Anyone can make a cake sparkle. A good loaf just sits there being good."'
      ]
    },
    oriel: {
      name: 'Oriel Fenwhistle', people: 'Duskwing', role: 'Keeper of the Lanternmere Library', location: 'library',
      personality: 'Curious, soft-spoken, and prone to delightful tangents.',
      goal: 'Recovering old lantern-lore so it can be shared openly. Her cousin thinks it should stay secret, and they argue about it often.',
      likes: ['tea', 'floral'], dislikes: ['spicy'], favorite: 'starfall',
      intro: [
        'A Duskwing with dusty, moth-patterned wings looks up from a ladder of books. "Oh! A visitor before dusk. How lovely. I\'m Oriel."',
        '"The library is yours whenever you like. Recipe cards are on the low shelf. The ghost of a cookbook author is not. That\'s just a draft."'
      ],
      chat: [
        '"Did you know the first lanterns in Lanternmere were baked, not blown? Clay and bread dough. Terrible idea. Wonderful smell."',
        '"My cousin Vey says old lore should be kept by the few who understand it. I think understanding grows when more people hold it."',
        '"I keep lantern hours, so mornings feel like a rumor to me. Your bakery smells wonderful at dawn, though, or so I hear."',
        '"A good tea is like a good footnote: small, warm, and somehow the most important part."'
      ]
    },
    pell: {
      name: 'Pell Cinderby', people: 'Emberkin', role: 'Apprentice spellwright', location: 'square',
      personality: 'Earnest, a little anxious, and bursting with ideas.',
      goal: 'Deciding whether to sing the old flame-songs exactly as taught, or to write new ones.',
      likes: ['spicy', 'warm'], dislikes: ['cold'], favorite: 'buns',
      intro: [
        'A small Emberkin with soot on both elbows nearly drops a scroll. Their cheeks glow, quite literally, when they blush. "Hi! Sorry! Pell. Spellwright. Apprentice. Mostly apprentice."',
        '"You run the bakery with the old hearth? My great-aunt Brisa used to talk about that hearth. She says it remembers songs."'
      ],
      chat: [
        '"Aunt Brisa says a flame-song should be sung exactly as it was taught. My friend Kett says songs are meant to grow. I keep humming both."',
        '"I tried a spell to fold laundry. It folded the laundry. And the table. And very nearly the cat."',
        '"Cold drinks make my fingers fizzle. Emberkin thing. Well, me thing. Kett loves ice."',
        '"Do you ever feel like you are still learning the words to something everyone else already knows? Asking for me."'
      ]
    },
    willa: {
      name: 'Willa Thornquist', people: 'Mossborn', role: 'Keeper of the Whispering Orchard', location: 'orchard',
      personality: 'Patient, wry, and wonderfully unhurried.',
      goal: 'Waking the silent whisper-tree her grandmother planted three hundred rings ago.',
      likes: ['floral', 'sweet'], dislikes: ['fruity'], favorite: 'wtart',
      intro: [
        'A Mossborn elder with lichen-freckled cheeks and silver-green hair sits beneath a tree. She does not get up. "Ah. The baker. Sit, if you like. The trees were just telling me about you."',
        '"I\'m Willa. I\'ve kept this orchard for two hundred rings. My grandson says I should write that in years. I say years are for people in a rush."'
      ],
      chat: [
        '"My grandson writes from the city. His letters are short. I read them very slowly, so they last longer."',
        '"Everyone thinks Mossborn are slow. My cousin runs the fastest courier route in three valleys. We simply choose when to hurry."',
        '"Fruit is lovely on the branch. In a pastry, I find it fussy. Don\'t tell the dewberries."',
        '"The bees dream of summer. You can tell by how they buzz. Today they are dreaming of a very good one."'
      ]
    },
    maro: {
      name: 'Maro Deepwell', people: 'Tidewrought', role: 'Ferry keeper on the River Path', location: 'river',
      personality: 'A gregarious storyteller who, unusually for a Tidewrought, hates getting wet.',
      goal: 'Hosting a river-blessing picnic to bring people from both banks of town together.',
      likes: ['fruity', 'cold'], dislikes: ['savory'], favorite: 'tartlets',
      intro: [
        'A Tidewrought with shimmering gill-marks along their neck waves from the ferry, holding a very large umbrella. "Ahoy, baker! Maro Deepwell. Ferry keeper. Teller of tide-tales. Avoider of splashes."',
        '"Yes, I\'m Tidewrought and I hate swimming. My family finds it hilarious. I find it perfectly sensible."'
      ],
      chat: [
        '"A tide-tale is never told the same way twice. My mother tells this one with a heron. I tell it with a very rude goose."',
        '"Folks on the far bank and the near bank barely talk anymore. Different market days. It\'s silly. Food fixes silly."',
        '"Dry bread sits in my mouth like a sandbank. Give me something juicy any day."',
        '"The river\'s talkative this morning. Says rain later. The river exaggerates, though."'
      ]
    },
    hollis: {
      name: 'Hollis Quarrystone', people: 'Cairnish', role: 'Keeper of the town notice board, and poet', location: 'square',
      personality: 'Gentle, booming-voiced, and fond of terrible rhymes.',
      goal: 'Writing poems instead of carving memory-stones, even though some elders grumble about it.',
      likes: ['sweet', 'tea'], dislikes: ['fruity'], favorite: 'lanterncakes',
      intro: [
        'A tall, broad Cairnish with stone-grey braids pins a notice to the board, then bows. "Hollis Quarrystone! I keep the notices, and I keep the town in verse."',
        '"Welcome, new baker, to our square so grand, where the oak gives shade and the benches stand." They pause. "I am still working on it."'
      ],
      chat: [
        '"My family carves memory-stones for important days. I write poems instead. Grandmother Tuff says paper doesn\'t last. I say people remember songs."',
        '"Today\'s notice board has a lost glove, a found goose, and a strongly worded letter about the goose."',
        '"A Cairnish proverb: a stone stays still so the river knows where to go. I think it means be kind and be dependable. Or it\'s about rivers."',
        '"Sweet things and strong tea. That is all a poet needs. And perhaps a better rhyme for oak."'
      ]
    }
  };

  const VISITORS = [
    { name: 'A Cairnish stonecutter passing through', people: 'Cairnish', likes: ['savory', 'spicy'], dislikes: ['floral'] },
    { name: 'A Mossborn courier, briefly in a hurry', people: 'Mossborn', likes: ['tea', 'sweet'], dislikes: ['spicy'] },
    { name: 'Two human schoolchildren sharing their pocket money', people: 'Human', likes: ['sweet', 'fruity'], dislikes: ['spicy'] },
    { name: 'A Duskwing night-post courier finishing a late route', people: 'Duskwing', likes: ['warm', 'savory'], dislikes: ['cold'] },
    { name: 'An Emberkin blacksmith with soot on their apron', people: 'Emberkin', likes: ['cold', 'fruity'], dislikes: ['tea'] },
    { name: 'A Tidewrought fisher with a basket of river reeds', people: 'Tidewrought', likes: ['savory', 'warm'], dislikes: ['sweet'] },
    { name: 'A human hedge-witch with a pocketful of seeds', people: 'Human', likes: ['floral', 'tea'], dislikes: ['cold'] },
    { name: 'A Duskwing glassblower on a lunch break', people: 'Duskwing', likes: ['sweet', 'spicy'], dislikes: ['savory'] }
  ];

  const QUESTS = {
    hearth: {
      title: 'The Quiet Hearth', main: true, giver: null, giverText: 'The Hearthstone in your bakery',
      summary: 'The enchanted hearth at the heart of your bakery has gone dim. Someone in town must remember how to wake it.',
      rewardText: '100 coins, the title of Hearthkeeper, and a glimpse of what your bakery could become.',
      reward: { coins: 100, title: 'Hearthkeeper', glossary: ['gathering'] },
      stages: [
        { type: 'serve', n: 3, where: 'Your bakery counter', text: 'Open the shop and serve 3 customers.' },
        {
          type: 'talk', npc: 'oriel', where: 'Lanternmere Library',
          text: 'Ask Oriel Fenwhistle at the Lanternmere Library about the old hearth.',
          dialogue: [
            'Oriel\'s wings flutter. "The Hearthstone? Oh, it has a whole shelf. Well. Half a shelf. Well. One very thick ledger."',
            '"Here. The bakers who came before you baked a Hearthbread of Blessing each spring and shared it with the whole town. The hearth was said to warm to the sound of a welcome."',
            '"The recipe needs an Emberglow Cinder, which is a coal sung awake by an Emberkin flame-song. And it needs a skilled hand. Pell Cinderby in Elder Oak Square knows flame-songs. Ask Pell."',
            'Oriel copies the recipe onto a card for you.'
          ],
          onComplete: { learn: 'hearthbread', glossary: ['flamesongs'] }
        },
        {
          type: 'talk', npc: 'pell', where: 'Elder Oak Square',
          text: 'Ask Pell Cinderby in Elder Oak Square about an Emberglow Cinder.',
          dialogue: [
            'Pell\'s cheeks flare bright. "An Emberglow Cinder? I\'ve only ever practiced that song. Aunt Brisa sings it perfectly. I sing it... enthusiastically."',
            '"Would you help? Aunt Brisa says a flame-song goes better with something to share. If you bring me 2 Ember Buns, we\'ll sing it together, her way and my way."'
          ]
        },
        {
          type: 'deliver', npc: 'pell', item: 'buns', qty: 2, where: 'Elder Oak Square',
          text: 'Bring 2 Ember Buns to Pell in Elder Oak Square.',
          dialogue: [
            'Pell and their great-aunt Brisa sit on the oak roots, sharing buns. Brisa sings the old verse, low and steady. Pell adds a new line at the end, nervously. Brisa raises an eyebrow, then nods.',
            'A coal in Pell\'s palm begins to glow, soft as a sunrise. "It\'s an Emberglow Cinder! It won\'t burn you. Mind the hearth for us?"'
          ],
          onComplete: { key: 'cinder', rel: { pell: 5 } }
        },
        { type: 'skill', skill: 'baking', level: 3, where: 'Your kitchen, or lessons at the Library', text: 'Reach Baking level 3. Bake more, or take lessons from the Improve section.' },
        { type: 'have', item: 'hearthbread', qty: 1, where: 'Your kitchen', text: 'Bake Hearthbread of Blessing in your kitchen.' },
        {
          type: 'deliver', npc: 'hollis', item: 'hearthbread', qty: 1, where: 'Elder Oak Square',
          text: 'Share the Hearthbread of Blessing with the town. Bring it to Hollis at Elder Oak Square.',
          dialogue: [
            'Hollis rings the old square bell. Neighbors gather beneath Elder Oak: Tamsin with Juniper on her shoulders, Willa on a bench, Maro under an umbrella, Oriel blinking at the daylight, Pell holding Aunt Brisa\'s hand.',
            'You break the Hearthbread and pass it around. Back at the bakery, everyone hears it at once: a deep, contented crackle. The Hearthstone has woken, glowing warmer than anyone remembers.',
            'Hollis clears their throat. "A hearth this warm could hold far more than one shop. Rooms for travelers. Long tables for feasts. A hall where every people in town could gather." They grin. "Something to think about, Hearthkeeper."',
            'Chapter One is complete. The story of your bakery, and what it might grow into, will continue in a future chapter.'
          ]
        }
      ]
    },
    silenttree: {
      title: 'The Silent Tree', giver: 'willa', giverText: 'Willa Thornquist, Whispering Orchard',
      summary: 'One whisper-tree in Willa\'s orchard has not spoken for a hundred rings. Mossborn tradition says a tree remembers the taste of its own blossoms.',
      intro: [
        'Willa points to a tree whose leaves hang perfectly still. "That one was planted by my grandmother. It stopped whispering a hundred rings ago."',
        '"An old Mossborn saying: a tree remembers the taste of its own blossoms. A Whisperpetal Tart, set at its roots, might remind it. Would you bake one? There\'s no hurry. There never is."'
      ],
      rewardText: '30 coins, extra friendship with Willa, and daily Orchard Honey to forage.',
      reward: { coins: 30, rel: { willa: 10 }, flag: 'honeyForage', glossary: ['whispertrees'] },
      stages: [
        { type: 'learn', recipe: 'wtart', where: 'Lanternmere Library', text: 'Learn the Whisperpetal Tart recipe. Recipe cards are sold at the Lanternmere Library.' },
        { type: 'have', item: 'wtart', qty: 1, where: 'Your kitchen', text: 'Bake a Whisperpetal Tart. It needs Baking level 2. Forage Whisperpetal in the Whispering Orchard.' },
        {
          type: 'deliver', npc: 'willa', item: 'wtart', qty: 1, where: 'Whispering Orchard',
          text: 'Bring the Whisperpetal Tart to Willa in the Whispering Orchard.',
          dialogue: [
            'Willa sets the tart among the roots and waits. You wait too. A minute passes, then another.',
            'Then a single leaf trembles, and a voice like paper says, very softly, "...sweet." Willa laughs, a slow, delighted sound. "There she is. Thank you, baker. Take honey whenever you like. The bees insist."'
          ]
        }
      ]
    },
    lore: {
      title: 'Lantern-Lore', giver: 'oriel', giverText: 'Oriel Fenwhistle, Lanternmere Library',
      requires: { quest: 'hearth', stage: 2 },
      summary: 'Pages of old Duskwing lantern-lore have scattered around town. Oriel wants to gather them so they can be shared, not hidden.',
      intro: [
        '"May I ask a favor? Pages of old lantern-lore went missing years ago. My cousin Vey thinks that is for the best. I think they belong to everyone."',
        '"If you look around Elder Oak Square, the River Path, and the Whispering Orchard, you may find fragments. Bring them back when you have three."'
      ],
      rewardText: '20 coins and the Duskbloom Biscuits recipe.',
      reward: { coins: 20, learn: 'biscuits', rel: { oriel: 8 }, glossary: ['lanternlore'] },
      stages: [
        { type: 'lore', n: 3, where: 'Elder Oak Square, River Path, Whispering Orchard', text: 'Find 3 lantern-lore fragments. Use "Look around" in Elder Oak Square, the River Path, and the Whispering Orchard.' },
        {
          type: 'talk', npc: 'oriel', where: 'Lanternmere Library',
          text: 'Bring the fragments back to Oriel at the Library.',
          dialogue: [
            'Oriel lays the three fragments side by side. Together they read: "A lantern is lit for those still on the road. A hearth is lit for those who have arrived."',
            '"Vey will grumble," Oriel says, smiling. "But Vey will also read it. I\'ll make copies for anyone who asks. And here, a Duskwing courier\'s recipe, as thanks."'
          ]
        }
      ]
    },
    picnic: {
      title: 'Both Banks Together', giver: 'maro', giverText: 'Maro Deepwell, River Path',
      summary: 'Maro is planning a river-blessing picnic to bring neighbors from both banks of town together.',
      intro: [
        '"I\'m planning a river-blessing picnic. Near bank and far bank, one blanket. Well. Several blankets. Same field."',
        '"Every Tidewrought picnic needs Dewberry Tartlets. Could you bring me 2? The recipe card is at the library, and dewberries grow all along this path."'
      ],
      rewardText: '30 coins, extra friendship with Maro, and more dewberries when you forage on the River Path.',
      reward: { coins: 30, rel: { maro: 10 }, flag: 'dewberryBonus', glossary: ['tidetales'] },
      stages: [
        {
          type: 'deliver', npc: 'maro', item: 'tartlets', qty: 2, where: 'River Path',
          text: 'Bring 2 Dewberry Tartlets to Maro on the River Path. You will need the recipe from the Library and Baking level 2.',
          dialogue: [
            'Maro balances the tartlets on the ferry rail and grins. "Perfect! The far-bank folk can never resist dewberries. And the near-bank folk can never resist proving they like them more."',
            '"Here, a tide-tale for you, free of charge: once a baker fed both banks of a river, and the river was so pleased it ran a little slower, just to listen. I just made that up. It counts."'
          ]
        }
      ]
    },
    apprentice: {
      title: 'Juniper\'s Apprentice Fund', giver: 'tamsin', giverText: 'Tamsin Rook, Moonwell Market',
      summary: 'Tamsin is saving for her daughter\'s glassblowing apprenticeship. Fresh loaves at her stall would help.',
      intro: [
        'Tamsin lowers her voice. "Juniper\'s got her heart set on apprenticing with the Duskwing glassblower. Fees aren\'t small."',
        '"If you brought me 3 Stonebaked Loaves, I\'d sell them at my stall and every coin goes in her jar. I\'ll make it worth your while: friends get a discount."'
      ],
      rewardText: '15 coins and a permanent 10% discount at Moonwell Market.',
      reward: { coins: 15, rel: { tamsin: 10 }, discount: 0.1, glossary: ['moonwellmarket'] },
      stages: [
        {
          type: 'deliver', npc: 'tamsin', item: 'loaf', qty: 3, where: 'Moonwell Market',
          text: 'Bring 3 Stonebaked Loaves to Tamsin at Moonwell Market.',
          dialogue: [
            'Tamsin stacks the loaves on her counter and writes a sign: "Juniper\'s Bread, every coin to a good cause." Customers line up almost at once.',
            'Juniper peeks out from behind a crate and whispers "thank you" before ducking away. Tamsin pretends she has something in her eye.'
          ]
        }
      ]
    }
  };

  const LORE_SPOTS = {
    square: 'Tucked behind the notice board, you find a curled scrap of paper in fine Duskwing script: "A lantern is lit for those still on the road..."',
    river: 'Wedged between two river stones, you find a waxed fragment of a page: "...and a hearth is lit..."',
    orchard: 'Caught in the branches of a whisper-tree, you find a fragment that rustles as you unfold it: "...for those who have arrived."'
  };

  const LOOK_FLAVOR = {
    market: 'A Duskwing glassblower turns a lantern in the light. A Cairnish trader and a Tidewrought fisher argue happily about the price of reeds.',
    square: 'Children are trying to hug the whole trunk of Elder Oak. They need four more children.',
    orchard: 'The leaves murmur in a hush that sounds almost like laughter. A bee lands on your sleeve, considers you, and leaves.',
    library: 'A sign reads: "Please return books by the next full moon. Or the one after. We are flexible."',
    river: 'The ferry bell clinks in the breeze. A heron watches you with great suspicion.'
  };

  const GLOSSARY = {
    lanternmere: { term: 'Lanternmere', text: 'A small river town where everyday chores and old magic mix freely. Its lanterns are lit by hand each evening, and every household hangs theirs a little differently.' },
    kitchencraft: { term: 'Kitchen-craft', text: 'In Lanternmere, magic is baked, brewed, and shared. Ingredients carry feelings, and skilled hands draw those feelings out. A treat\'s effect describes the small magic it carries.' },
    hearthstone: { term: 'The Hearthstone', text: 'The enchanted hearth at the center of your bakery. Long ago it was said to warm anyone who came through the door, whoever they were.' },
    humans: { term: 'Humans of Lanternmere', text: 'Humans have lived alongside the other peoples here for generations. Some practice hedge-charms, many keep shops, and most enjoy the town\'s oddities.' },
    duskwing: { term: 'Duskwing', text: 'A people with soft, moth-patterned wings who keep lantern hours, working best from dusk into the small hours. Many are scholars, glassblowers, or night couriers, but plenty are none of these. They often disagree about how openly old lore should be shared.' },
    emberkin: { term: 'Emberkin', text: 'Small folk whose hearts run warm, enough that their cheeks glow when they blush. Many sing flame-songs, old melodies that coax fire to behave. Families argue fondly over whether the songs should change.' },
    mossborn: { term: 'Mossborn', text: 'Long-lived people with lichen-freckled skin and green or silver hair. They count their age in rings. They are often unhurried by choice, though some of the fastest couriers in the valley are Mossborn.' },
    tidewrought: { term: 'Tidewrought', text: 'River people with shimmering gill-marks along their necks. They are known for tide-tales, stories expected to change with every telling. Not every Tidewrought loves the water.' },
    cairnish: { term: 'Cairnish', text: 'Broad, steady folk whose families carve memory-stones to mark important days. Their flat-stone baking gave Lanternmere its everyday loaf. Younger Cairnish sometimes mark memories in other ways: songs, poems, or gardens.' },
    moonwell: { term: 'The Moonwell', text: 'A deep, silver-lined well in the market. Flour milled beside it under moonlight holds enchantments steady.' },
    flamesongs: { term: 'Flame-songs', text: 'Emberkin melodies that coax fire to behave. An Emberglow Cinder is a coal sung awake so that it glows without burning.' },
    whispertrees: { term: 'Whisper-trees', text: 'Old orchard trees whose leaves murmur in soft voices. Mossborn say a whisper-tree remembers the taste of its own blossoms.' },
    lanternlore: { term: 'Lantern-lore', text: 'Old Duskwing writings about lanterns, hearths, and welcome. "A lantern is lit for those still on the road. A hearth is lit for those who have arrived."' },
    tidetales: { term: 'Tide-tales', text: 'Tidewrought stories that are expected to change each time they are told. Telling one exactly the same way twice is considered a little rude.' },
    moonwellmarket: { term: 'Market days', text: 'Near-bank and far-bank traders used to keep different market days. Lately, thanks to a few stubborn neighbors, the days are starting to overlap.' },
    gathering: { term: 'The Hearth Awake', text: 'With the Hearthstone awake, your bakery could one day grow into an enchanted inn or a gathering hall for travelers and neighbors alike. This is a future chapter of the story.' }
  };
  const START_GLOSSARY = ['lanternmere', 'kitchencraft', 'hearthstone', 'humans', 'duskwing', 'emberkin', 'mossborn', 'tidewrought', 'cairnish', 'moonwell'];

  const NOTICES = [
    'Lost: one left glove, knitted, smells of cinnamon. Please return to the forge. Reward: the right glove.',
    'Found: one goose. Very confident. Currently guarding the ferry. Please collect.',
    'Library notice: lantern hours extended this week. Bring your own cushion.',
    'The Mossborn courier service reminds you: we deliver quickly when asked nicely.',
    'Poetry reading beneath Elder Oak, Fifth-day evening. Hollis promises at least one rhyme for "oak".',
    'Near-bank and far-bank market days now overlap on Third-day. Come and meet your neighbors.',
    'Emberkin flame-song practice in the square this afternoon. Please do not be alarmed by sparks.',
    'Wanted: someone to teach a heron manners. Apply at the River Path.',
    'Tide-tale circle at the ferry landing. Every story welcome, especially the ones that change.',
    'Reminder from the Cairnish masons\' guild: memory-stones may be commissioned for birthdays, weddings, and excellent sandwiches.'
  ];

  return {
    TAGS, INGREDIENTS, KEY_ITEMS, RECIPES, SKILLS, SKILL_LEVELS, LESSON, UPGRADES, LOCATIONS, NPCS,
    VISITORS, QUESTS, LORE_SPOTS, LOOK_FLAVOR, GLOSSARY, START_GLOSSARY, NOTICES,
    START: {
      coins: 30,
      inventory: { flour: 8, butter: 4, starsugar: 4, mistleaf: 3, emberroot: 2, dewberry: 2, whisperpetal: 0, honey: 1 },
      baseCustomers: 3
    }
  };
})();
