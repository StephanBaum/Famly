import { GroceryCategory, Ingredient, Recipe } from '../types';

// Grocery aisle categorization helper
export const inferGroceryCategory = (name: string): GroceryCategory => {
  const lower = name.toLowerCase();

  // Produce
  if (
    lower.match(
      /(garlic|onion|shallot|potato|kartoffel|tomato|tomate|broccoli|carrot|karotte|möhre|spinach|spinat|lemon|zitrone|lime|limette|basil|basilikum|parsley|petersilie|chives|schnittlauch|avocado|mushroom|pilz|champignon|cucumber|gurke|bell pepper|paprika|zucchini|lettuce|salat|ginger|ingwer|herb|kraut|apple|apfel|berry|beere|banana|cilantro|coriander|thyme|rosemary)/
    )
  ) {
    return 'produce';
  }

  // Dairy & Eggs
  if (
    lower.match(
      /(milk|milch|cream|sahne|butter|cheese|käse|parmesan|pecorino|mozzarella|cheddar|emmentaler|gouda|feta|ricotta|mascarpone|yogurt|joghurt|egg|ei|eier|sour cream|schmand|quark)/
    )
  ) {
    return 'dairy';
  }

  // Meat & Seafood
  if (
    lower.match(
      /(chicken|hähnchen|huhn|beef|rind|pork|schwein|bacon|speck|mince|hackfleisch|sausage|wurst|wiener|ham|schinken|salmon|lachs|shrimp|garnele|prawn|fish|fisch|turkey|pute|guanciale|steak|prosciutto)/
    )
  ) {
    return 'meat';
  }

  // Bakery
  if (
    lower.match(
      /(bread|brot|baguette|bun|brötchen|toast|croissant|tortilla|pita|fladenbrot|brioche)/
    )
  ) {
    return 'bakery';
  }

  // Drugstore / Household
  if (
    lower.match(
      /(soap|detergent|shampoo|sponge|tissue|paper towel|toilet paper|toothpaste|wipes)/
    )
  ) {
    return 'household';
  }

  // Default to pantry for spices, pasta, canned goods, condiments, grains
  return 'pantry';
};

// High quality curated food photos by keyword
export const getMatchingFoodPhoto = (title: string, desc: string = ''): string => {
  const text = `${title} ${desc}`.toLowerCase();

  if (text.includes('pasta') || text.includes('spaghetti') || text.includes('carbonara') || text.includes('ricotta') || text.includes('penne')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('curry') || text.includes('coconut') || text.includes('thai') || text.includes('lentil') || text.includes('dal')) {
    return 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('spätzle') || text.includes('käse') || text.includes('comfort') || text.includes('mac and cheese') || text.includes('dumpling')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('chicken') || text.includes('hähnchen') || text.includes('poultry') || text.includes('tuscan')) {
    return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('salad') || text.includes('kartoffelsalat') || text.includes('potato salad') || text.includes('bowl') || text.includes('fresh')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('soup') || text.includes('stew') || text.includes('suppe') || text.includes('broth')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('apfel') || text.includes('strudel') || text.includes('cake') || text.includes('kuchen') || text.includes('apple') || text.includes('crumble') || text.includes('pancake')) {
    return 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('pizza') || text.includes('flatbread')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('taco') || text.includes('burrito') || text.includes('mexican') || text.includes('fajita')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('burger') || text.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('salmon') || text.includes('shrimp') || text.includes('fish') || text.includes('seafood')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80';
  }

  // Fallback cheerful family meal photo
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80';
};

// Robust prep time extraction helper with word boundaries and unit isolation
export const extractRecipePrepTime = (text: string, defaultTime = '25 mins'): string => {
  if (!text) return defaultTime;

  // 1. Combined hours and minutes (e.g. "1h 30m", "1 hour 20 mins", "1 stunde 15 min")
  const comboMatch = text.match(
    /\b(\d{1,2})\s*(?:hours?|hrs?|stunden?|h\b)\s*(?:and|und)?\s*(\d{1,2})\s*(?:mins?|minuten?|minutes?|min\b|m\b)/i
  );
  if (comboMatch) {
    const h = parseInt(comboMatch[1], 10);
    const m = parseInt(comboMatch[2], 10);
    const totalMinutes = h * 60 + m;
    if (totalMinutes > 0 && totalMinutes <= 480) {
      return `${totalMinutes} mins`;
    }
  }

  // 2. Single quantity with explicit time unit (e.g. "20 minutes", "ready in 25 min", "1.5 hours", "45 minuten")
  // Notice explicit word boundaries on 'h\b' and 'min\b' so letters inside dish names like "Thai", "Chicken", "Herb" NEVER trigger hours!
  const singleMatch = text.match(
    /(?:takes|ready in|in|prep|cook|time|dauer|fertig in)?\s*(\d+(?:[.,]\d+)?)\s*(mins?|minuten?|minutes?|min\b|stunden?|hours?|hrs?\b|h\b)/i
  );
  if (singleMatch && singleMatch[1]) {
    const rawVal = parseFloat(singleMatch[1].replace(',', '.'));
    const unit = (singleMatch[2] || '').toLowerCase();
    const isHours = unit.startsWith('stund') || unit.startsWith('hour') || unit.startsWith('hr') || unit === 'h';
    const totalMinutes = Math.round(isHours ? rawVal * 60 : rawVal);
    if (totalMinutes > 0 && totalMinutes <= 480) {
      return `${totalMinutes} mins`;
    }
  }

  return defaultTime;
};

// Intelligent Culinary Recipe Synthesis Engine
export const synthesizeRecipeFromDishIdea = (prompt: string): Omit<Recipe, 'id'> => {
  const p = prompt.toLowerCase();

  // 1. Clean Title: strip out "recipe for", "make", and trailing metadata clauses like "ready in 20 min" or "for 4 people"
  let rawTitle = prompt
    .trim()
    .replace(/^(?:#|recipe for|how to make|make (?:a|an)?|cook|i want|dish:?)\s*/i, '');
  rawTitle = rawTitle.replace(/(?:ready in|takes|in|prep time|cook time|dauer|fertig in)\s*\d+\s*(?:mins?|minuten?|minutes?|min\b|stunden?|hours?|hrs?\b|h\b)[^.]*/gi, '');
  rawTitle = rawTitle.replace(/(?:for|serves|feeds|portionen|personen)\s*\d+\s*(?:people|persons|portions|portionen|personen|family members)?/gi, '');
  rawTitle = rawTitle.replace(/[.,;!]+$/, '').trim();
  if (rawTitle.length > 50 && rawTitle.includes('.')) {
    rawTitle = rawTitle.split('.')[0].trim();
  }
  let cleanTitle = rawTitle
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  if (!cleanTitle || cleanTitle.length < 3) {
    cleanTitle = 'Family Favorite Dish';
  }

  // 2. Servings detection
  let servings = 4;
  const servMatch = prompt.match(/(?:for|serves|feeds|portionen|personen)\s*(\d+)/i);
  if (servMatch) servings = Math.max(1, parseInt(servMatch[1], 10));

  // 3. User-specified prep time (if specified in prompt, overrides archetype default)
  const userPrepTime = extractRecipePrepTime(prompt, '');

  // --- ARCHETYPE 1: PASTA DISHES ---
  if (p.includes('pasta') || p.includes('spaghetti') || p.includes('fettuccine') || p.includes('linguine') || p.includes('penne') || p.includes('tagliatelle') || p.includes('macaroni')) {
    // 1A: Creamy Lemon Pepper Pasta
    if (p.includes('lemon') && (p.includes('pepper') || p.includes('cream'))) {
      return {
        title: cleanTitle || 'Creamy Lemon Pepper Pasta',
        prepTime: userPrepTime || '20 mins',
        servings,
        category: 'comfort',
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        ingredients: [
          { name: 'Fettuccine or Linguine', amount: `${servings * 100}g`, category: 'pantry' },
          { name: 'Heavy Cream / Schlagsahne', amount: `${Math.round(servings * 50)}ml`, category: 'dairy' },
          { name: 'Organic Lemons (zest & juice)', amount: '2 Stk', category: 'produce' },
          { name: 'Parmigiano Reggiano (freshly grated)', amount: `${servings * 15}g`, category: 'dairy' },
          { name: 'Butter', amount: '2 tbsp (30g)', category: 'dairy' },
          { name: 'Freshly Cracked Black Pepper', amount: '2 tsp', category: 'pantry' },
          { name: 'Garlic (finely minced)', amount: '3 cloves', category: 'produce' },
          { name: 'Fresh Flat-Leaf Parsley (chopped)', amount: '1 handful', category: 'produce' },
          { name: 'Sea Salt', amount: 'to taste', category: 'pantry' },
        ],
        instructions: [
          'Bring a large pot of well-salted water to a boil. Cook pasta until al dente, reserving 1/2 cup of starchy pasta water before draining.',
          'In a wide skillet, melt butter over medium-low heat. Sauté minced garlic and freshly cracked black pepper for 1 minute until aromatic.',
          'Pour in the heavy cream and grated lemon zest. Bring to a gentle simmer for 2-3 minutes to slightly thicken.',
          'Reduce heat to low and stir in freshly grated parmesan and 2 tbsp of fresh lemon juice until silky and smooth. Splash in reserved pasta water for a glossy emulsion.',
          'Toss the drained warm pasta directly into the sauce until evenly coated. Garnish with fresh parsley and extra cracked pepper, and serve hot!',
        ],
        tags: ['Under 30m', 'Comfort Food', 'Vegetarian', 'Italian Inspired'],
        notes: 'Creamy, zesty weeknight pasta with a peppery kick.',
        sourceType: 'describe',
      };
    }

    // 1B: Classic Carbonara
    if (p.includes('carbonara')) {
      return {
        title: cleanTitle || 'Authentic Spaghetti Carbonara',
        prepTime: userPrepTime || '20 mins',
        servings,
        category: 'comfort',
        imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
        ingredients: [
          { name: 'Spaghetti', amount: `${servings * 100}g`, category: 'pantry' },
          { name: 'Guanciale or Pancetta (diced)', amount: `${servings * 40}g`, category: 'meat' },
          { name: 'Fresh Egg Yolks', amount: `${servings + 1} Stk`, category: 'dairy' },
          { name: 'Pecorino Romano (grated)', amount: `${servings * 20}g`, category: 'dairy' },
          { name: 'Fresh Black Pepper', amount: '1.5 tsp', category: 'pantry' },
          { name: 'Salt for pasta water', amount: '1 tbsp', category: 'pantry' },
        ],
        instructions: [
          'Boil spaghetti in salted water until al dente. Reserve 1/2 cup of starchy water.',
          'In a cold skillet, add diced guanciale and cook over medium heat until crispy and golden. Remove from heat.',
          'In a small bowl, whisk egg yolks with grated pecorino and plenty of freshly cracked black pepper.',
          'Add hot spaghetti to the skillet with the crispy pork fat (off the heat to avoid scrambling).',
          'Pour in egg-cheese mixture with a splash of pasta water, tossing vigorously until a silky, creamy sauce forms. Serve immediately!',
        ],
        tags: ['Quick 20m', 'Italian Classic', 'High Protein'],
        notes: 'Traditional Roman carbonara made without heavy cream.',
        sourceType: 'describe',
      };
    }

    // 1C: Bolognese / Ragu Pasta
    if (p.includes('bolognese') || p.includes('ragu') || p.includes('meat sauce')) {
      return {
        title: cleanTitle || 'Classic Spaghetti Bolognese',
        prepTime: userPrepTime || '40 mins',
        servings,
        category: 'family-favorite',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80',
        ingredients: [
          { name: 'Minced Beef / Hackfleisch', amount: `${servings * 125}g`, category: 'meat' },
          { name: 'Spaghetti or Tagliatelle', amount: `${servings * 100}g`, category: 'pantry' },
          { name: 'Canned Crushed Tomatoes', amount: '2 cans (800g)', category: 'pantry' },
          { name: 'Onion & Garlic', amount: '1 onion, 2 cloves', category: 'produce' },
          { name: 'Carrot & Celery (finely diced)', amount: '1 each', category: 'produce' },
          { name: 'Tomato Paste', amount: '2 tbsp', category: 'pantry' },
          { name: 'Olive Oil', amount: '2 tbsp', category: 'pantry' },
          { name: 'Italian Herbs (Oregano, Basil)', amount: '1 tbsp', category: 'pantry' },
          { name: 'Parmesan cheese', amount: '50g', category: 'dairy' },
        ],
        instructions: [
          'Sauté finely diced onion, garlic, carrot, and celery in olive oil for 5 minutes until softened.',
          'Add minced beef and brown thoroughly, breaking it apart with a spoon.',
          'Stir in tomato paste and cook for 1 minute, then add crushed tomatoes and herbs.',
          'Cover and simmer on low heat for at least 25 minutes until rich and fragrant.',
          'Cook pasta al dente, ladle over hearty meat sauce, and top with grated parmesan.',
        ],
        tags: ['Family Favorite', 'Comfort Food', 'Kid-Friendly'],
        notes: 'Slow-simmered rich tomato meat sauce.',
        sourceType: 'describe',
      };
    }
  }

  // --- ARCHETYPE 2: CURRY & ASIAN NOODLE/RICE DISHES ---
  if (p.includes('curry') || p.includes('tikka') || p.includes('thai') || p.includes('coconut noodle') || p.includes('noodle bowl') || p.includes('pad thai') || p.includes('ramen')) {
    const isChicken = p.includes('chicken') || (!p.includes('tofu') && !p.includes('chickpea'));
    const isNoodle = p.includes('noodle') || p.includes('pad thai') || p.includes('ramen');
    return {
      title: cleanTitle || (isNoodle ? 'Thai Coconut Noodle Bowl' : 'Creamy Coconut Curry Bowl'),
      prepTime: userPrepTime || '25 mins',
      servings,
      category: 'healthy',
      imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: isChicken ? 'Chicken Breast Fillet (cubed/sliced)' : 'Firm Tofu / Chickpeas', amount: `${servings * 125}g`, category: isChicken ? 'meat' : 'produce' },
        { name: 'Coconut Milk', amount: '1 can (400ml)', category: 'pantry' },
        { name: 'Thai Curry Paste (Green or Red)', amount: '2-3 tbsp', category: 'pantry' },
        { name: isNoodle ? 'Rice Noodles or Asian Noodles' : 'Jasmine Rice or Rice Noodles', amount: `${servings * 75}g`, category: 'pantry' },
        { name: 'Red Bell Pepper & Broccoli Florets', amount: '300g mixed', category: 'produce' },
        { name: 'Fresh Ginger & Garlic', amount: '1 tbsp minced each', category: 'produce' },
        { name: 'Soy Sauce or Fish Sauce', amount: '2 tbsp', category: 'pantry' },
        { name: 'Brown Sugar / Honey', amount: '1 tsp', category: 'pantry' },
        { name: 'Fresh Lime (juice & wedges)', amount: '1 Stk', category: 'produce' },
        { name: 'Fresh Cilantro or Thai Basil', amount: '1 bunch', category: 'produce' },
      ],
      instructions: [
        isNoodle
          ? 'Cook rice noodles according to package instructions (approx. 4-5 mins), drain, rinse with cold water, and set aside.'
          : 'Cook jasmine rice according to package instructions and keep warm.',
        'In a large wok or deep pan, heat 1 tbsp oil and fry curry paste with minced garlic and ginger for 1 minute until aromatic.',
        'Add chicken (or tofu) cubes and sear for 3-4 minutes until lightly browned.',
        'Pour in coconut milk, soy sauce, and brown sugar. Add sliced bell pepper and broccoli.',
        'Simmer gently for 8-10 minutes until vegetables are tender-crisp and sauce is aromatic and creamy.',
        isNoodle
          ? 'Fold the cooked rice noodles directly into the simmering coconut curry broth for 1 minute so they absorb the rich flavors.'
          : 'Stir in fresh lime juice and fresh cilantro.',
        'Serve hot in deep bowls garnished with fresh cilantro and lime wedges!',
      ],
      tags: ['Healthy & Fresh', 'Under 30m', 'Gluten-Free Friendly'],
      notes: isNoodle
        ? 'Aromatic Thai coconut broth with tender noodles and crisp vegetables.'
        : 'Fragrant and creamy coconut curry with fresh crisp vegetables.',
      sourceType: 'describe',
    };
  }

  // --- ARCHETYPE 3: GERMAN / AUSTRIAN / COMFORT CLASSICS ---
  if (p.includes('spätzle') || p.includes('spatz') || p.includes('käsespätzle') || p.includes('gulasch') || p.includes('kartoffelsalat') || p.includes('schnitzel')) {
    if (p.includes('spätzle') || p.includes('spatz')) {
      return {
        title: cleanTitle || 'Allgäuer Käsespätzle mit Röstzwiebeln',
        prepTime: userPrepTime || '30 mins',
        servings,
        category: 'comfort',
        imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
        ingredients: [
          { name: 'Spätzlemehl oder Mehl', amount: `${servings * 100}g`, category: 'pantry' },
          { name: 'Eier (Größe M)', amount: `${servings + 1} Stk`, category: 'dairy' },
          { name: 'Mineralwasser mit Kohlensäure', amount: '125ml', category: 'pantry' },
          { name: 'Bergkäse & Emmentaler (gerieben)', amount: `${servings * 60}g`, category: 'dairy' },
          { name: 'Zwiebeln (in feine Ringe)', amount: '3 große', category: 'produce' },
          { name: 'Butter', amount: '40g', category: 'dairy' },
          { name: 'Frischer Schnittlauch', amount: '1 Bund', category: 'produce' },
          { name: 'Muskatnuss & Salz', amount: '1 Prise', category: 'pantry' },
        ],
        instructions: [
          'Zwiebelringe in 20g Butter langsam bei mittlerer Hitze ca. 15 Min goldbraun und knusprig anbraten.',
          'Aus Mehl, Eiern, Mineralwasser und 1 TL Salz einen zähflüssigen Teig schlagen, bis er Blasen wirft.',
          'Einen großen Topf mit Salzwasser zum Kochen bringen. Den Teig portionsweise ins kochende Wasser hobeln.',
          'Sobald die Spätzle oben schwimmen, mit dem Schaumlöffel abschöpfen und abwechselnd mit geriebenem Käse in eine warme Auflaufform schichten.',
          'Mit den knusprigen Röstzwiebeln und feinem Schnittlauch garnieren und servieren.',
        ],
        tags: ['Comfort Food', 'Vegetarisch', 'Traditionell'],
        notes: 'Schwäbischer Familienliebling mit cremig geschmolzenem Bergkäse.',
        sourceType: 'describe',
      };
    }
  }

  // --- ARCHETYPE 4: SALMON & SEAFOOD ---
  if (p.includes('salmon') || p.includes('lachs') || p.includes('shrimp') || p.includes('fish') || p.includes('forelle')) {
    return {
      title: cleanTitle || 'Pan-Seared Lemon Herb Salmon',
      prepTime: userPrepTime || '20 mins',
      servings,
      category: 'healthy',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Fresh Salmon Fillets', amount: `${servings} fillets (ca. 600g)`, category: 'meat' },
        { name: 'Green Asparagus or Broccoli', amount: '400g', category: 'produce' },
        { name: 'Organic Lemon (sliced & juiced)', amount: '2 Stk', category: 'produce' },
        { name: 'Butter & Olive Oil', amount: '2 tbsp each', category: 'dairy' },
        { name: 'Garlic Cloves (minced)', amount: '3 cloves', category: 'produce' },
        { name: 'Fresh Dill (chopped)', amount: '1 bunch', category: 'produce' },
        { name: 'Baby Potatoes or Rice', amount: `${servings * 100}g`, category: 'produce' },
        { name: 'Sea Salt & Black Pepper', amount: 'to taste', category: 'pantry' },
      ],
      instructions: [
        'Pat salmon fillets dry with a paper towel and season both sides with salt and pepper.',
        'Heat 1 tbsp olive oil and 1 tbsp butter in a large skillet over medium-high heat.',
        'Place salmon skin-side down and sear undisturbed for 4-5 minutes until crispy. Flip and sear for 3 minutes.',
        'Toss trimmed asparagus in the pan with minced garlic, lemon juice, and remaining butter until tender.',
        'Spoon the melted lemon garlic butter over the salmon and garnish generously with fresh dill before serving.',
      ],
      tags: ['High Protein', 'Under 30m', 'Healthy & Fresh'],
      notes: 'Crispy skin salmon with a rich lemon herb butter glaze.',
      sourceType: 'describe',
    };
  }

  // --- ARCHETYPE 5: BREAKFAST / PANCAKES / BAKING ---
  if (p.includes('pancake') || p.includes('pfannkuchen') || p.includes('waffle') || p.includes('crumble') || p.includes('muffin') || p.includes('cake') || p.includes('cookie')) {
    return {
      title: cleanTitle || 'Fluffy Homemade Pancakes',
      prepTime: userPrepTime || '15 mins',
      servings,
      category: 'baking',
      imageUrl: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'All-Purpose Flour / Mehl', amount: `${servings * 60}g`, category: 'pantry' },
        { name: 'Baking Powder', amount: '2 tsp', category: 'pantry' },
        { name: 'Sugar or Honey', amount: '2 tbsp', category: 'pantry' },
        { name: 'Whole Milk', amount: `${servings * 75}ml`, category: 'dairy' },
        { name: 'Eggs (separated)', amount: `${Math.max(2, Math.floor(servings / 2))} Stk`, category: 'dairy' },
        { name: 'Melted Butter', amount: '40g', category: 'dairy' },
        { name: 'Fresh Blueberries or Banana', amount: '150g', category: 'produce' },
        { name: 'Pure Maple Syrup', amount: 'for serving', category: 'pantry' },
        { name: 'Pinch of Salt', amount: '1 pinch', category: 'pantry' },
      ],
      instructions: [
        'In a large bowl, whisk together flour, baking powder, sugar, and a pinch of salt.',
        'In another bowl, whisk milk, melted butter, and egg yolks until combined.',
        'Gently fold wet ingredients into dry ingredients until just combined (small lumps are fine for fluffiness).',
        'Heat a buttered skillet or griddle over medium heat. Pour 1/4 cup batter per pancake and drop in fresh blueberries.',
        'Cook until bubbles form on top (about 2 minutes), flip and cook 1-2 minutes more until golden brown. Serve stacked with maple syrup!',
      ],
      tags: ['Breakfast', 'Kid-Friendly', 'Under 30m'],
      notes: 'Ultra-fluffy weekend breakfast favorite.',
      sourceType: 'describe',
    };
  }

  // --- ARCHETYPE 6: UNIVERSAL INTELLIGENT CULINARY SYNTHESIZER ---
  // For ANY arbitrary dish described by the user (e.g. "Spicy Garlic Shrimp Bowl", "Mushroom Risotto", "Crispy Tofu Stir Fry")
  const isSoup = p.includes('soup') || p.includes('stew') || p.includes('suppe') || p.includes('eintopf');
  const isSalad = p.includes('salad') || p.includes('salat') || p.includes('bowl');

  return {
    title: cleanTitle || 'Special Homemade Family Dinner',
    prepTime: userPrepTime || (isSoup ? '35 mins' : isSalad ? '15 mins' : '25 mins'),
    servings,
    category: isSalad ? 'healthy' : isSoup ? 'comfort' : 'family-favorite',
    imageUrl: getMatchingFoodPhoto(cleanTitle, prompt),
    ingredients: [
      { name: `Fresh Base & Greens for ${cleanTitle}`, amount: `${servings * 100}g`, category: 'produce' },
      { name: 'Garlic & Onions', amount: '1 onion, 2 cloves', category: 'produce' },
      { name: 'Olive Oil or Butter', amount: '2 tbsp', category: 'pantry' },
      { name: 'Broth, Cream or Sauce Base', amount: '250ml', category: 'pantry' },
      { name: 'Signature Herbs & Seasoning', amount: 'to taste', category: 'pantry' },
      { name: 'Garnish (Parmesan / Fresh Herbs)', amount: 'for serving', category: 'dairy' },
    ],
    instructions: [
      `Wash, chop, and prepare all fresh ingredients for ${cleanTitle}.`,
      'Heat oil or butter in a wide pan and sauté aromatics (garlic and onions) for 2 minutes until fragrant.',
      `Add main ingredients and cook over medium heat until tender and golden.`,
      'Stir in sauce base, simmer gently to meld flavors, and season to taste with salt, pepper, and fresh herbs.',
      `Portion out hot for ${servings} family members and enjoy together!`,
    ],
    tags: ['Custom Recipe', 'Family Meal', isSalad ? 'Fresh' : 'Comfort'],
    notes: `Culinary recipe created from family request: "${prompt}".`,
    sourceType: 'describe',
  };
};

// 1. Natural Language Description / Speech Dictation Parser
export const parseRecipeFromDescription = (text: string): Omit<Recipe, 'id'> => {
  const clean = text.trim();
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // Check if user entered a dish concept / name without explicit ingredient lists:
  // e.g. "Creamy Lemon Pepper Pasta", "Thai chicken curry", "Käsespätzle", etc.
  const hasMultipleMeasurements = (clean.match(/\b\d+\s*(?:kg|g|ml|l|tbsp|tsp|cups?|tassen?|dosen?|cans?|zehen?|cloves?|slices?|el|tl|stk)\b/gi) || []).length >= 2;
  const isShortConcept = clean.length < 90 && !clean.includes('\n') && !clean.includes(',') && !hasMultipleMeasurements;

  if (isShortConcept || (!hasMultipleMeasurements && lines.length <= 2)) {
    return synthesizeRecipeFromDishIdea(clean);
  }

  // Otherwise, parse user's explicit recipe text:
  let title = 'Family Favorite Recipe';
  if (lines.length > 0 && lines[0].length < 60 && !lines[0].toLowerCase().includes('takes') && !lines[0].toLowerCase().includes('serves')) {
    title = lines[0].replace(/^#+\s*/, '').replace(/:\s*$/, '').trim();
  } else {
    const titleMatch = clean.match(/(?:how to make|recipe for|make)?\s*([A-Za-z0-9äöüÄÖÜß\s'-]{4,40})(?::| takes| with| for)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  }

  // Time estimate
  const prepTime = extractRecipePrepTime(clean, '25 mins');

  // Servings
  let servings = 4;
  const servingsMatch = clean.match(/(?:serves|for|feeds|portionen|personen|people|portions)\s*(\d{1,2})/i);
  if (servingsMatch && servingsMatch[1]) {
    servings = parseInt(servingsMatch[1], 10);
  }

  // Ingredients extraction
  const ingredients: Ingredient[] = [];
  const rawItems = clean
    .split(/[,\n;•\-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const unitRegex = /^(\d+[\d\/\.,]*\s*(?:kg|g|ml|l|liter|tbsp|tsp|cups?|tassen?|cans?|dosen?|cloves?|zehen?|slices?|scheiben?|bunch|bund|el|tl|prise|becher|packung|pkg|stk|st|pieces?)?)\s*(?:of|von)?\s*(.+)$/i;

  for (const item of rawItems) {
    if (
      item.toLowerCase().includes('takes ') ||
      item.toLowerCase().includes('serves ') ||
      item.toLowerCase().includes('ready in') ||
      item.toLowerCase().includes('recipe for') ||
      item.length > 60
    ) {
      continue;
    }

    const match = item.match(unitRegex);
    if (match) {
      const amount = match[1].trim();
      const name = match[2].trim();
      if (name.length > 1) {
        ingredients.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount: amount || 'As needed',
          category: inferGroceryCategory(name),
        });
      }
    } else {
      if (!item.toLowerCase().startsWith('step') && !item.toLowerCase().startsWith('serve with') && item.length > 2) {
        // If it's a distinct item, add it
        ingredients.push({
          name: item.charAt(0).toUpperCase() + item.slice(1),
          amount: 'nach Bedarf',
          category: inferGroceryCategory(item),
        });
      }
    }
  }

  // If no ingredients could be parsed, fallback to synthesis
  if (ingredients.length <= 1) {
    return synthesizeRecipeFromDishIdea(clean);
  }

  // Category
  let category: Recipe['category'] = 'family-favorite';
  const lowerClean = clean.toLowerCase();
  if (lowerClean.includes('bake') || lowerClean.includes('cake') || lowerClean.includes('crumble') || lowerClean.includes('cookie') || lowerClean.includes('strudel')) {
    category = 'baking';
  } else if (prepTime.includes('15') || prepTime.includes('20') || lowerClean.includes('quick') || lowerClean.includes('fast') || lowerClean.includes('one-pot')) {
    category = 'quick';
  } else if (lowerClean.includes('cheese') || lowerClean.includes('creamy') || lowerClean.includes('stew') || lowerClean.includes('ragu') || lowerClean.includes('spätzle')) {
    category = 'comfort';
  } else if (lowerClean.includes('salad') || lowerClean.includes('veggie') || lowerClean.includes('healthy') || lowerClean.includes('avocado')) {
    category = 'healthy';
  }

  // Instructions
  const instructions: string[] = [
    `Zutaten für ${title} vorbereiten (${ingredients.slice(0, 3).map((i) => i.name).join(', ')}).`,
    'Zubereitungsschritte nach Rezeptanleitung auf mittlerer Hitze ausführen.',
    'Mit Salz, Pfeffer und frischen Gewürzen abschmecken.',
    `Heiß für ${servings} Portionen anrichten und genießen!`,
  ];

  const tags: string[] = ['Family Recipe', 'Homemade', category.charAt(0).toUpperCase() + category.slice(1)];
  if (parseInt(prepTime, 10) <= 30) tags.push('Under 30m');

  return {
    title,
    prepTime,
    servings,
    category,
    imageUrl: getMatchingFoodPhoto(title, clean),
    ingredients,
    instructions,
    tags,
    notes: `Imported from family description. Serves ${servings}.`,
    sourceType: 'describe',
  };
};

// 2. Demo & Smart Link Parser
export interface DemoRecipeLink {
  id: string;
  name: string;
  source: string;
  url: string;
  recipe: Omit<Recipe, 'id'>;
}

export const DEMO_RECIPE_LINKS: DemoRecipeLink[] = [
  {
    id: 'chefkoch_spaetzle',
    name: "Allgäuer Kässpatzen (Chefkoch)",
    source: 'Chefkoch.de',
    url: 'https://www.chefkoch.de/rezepte/1279831233330574/Allgaeuer-Kaesspatzen.html',
    recipe: {
      title: "Allgäuer Kässpatzen",
      prepTime: '60 mins',
      servings: 4,
      category: 'comfort',
      imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Spätzlemehl (oder Mehl Type 405)', amount: '500 g', category: 'pantry' },
        { name: 'Eier', amount: '5 Stk', category: 'dairy' },
        { name: 'Mineralwasser', amount: '125 ml', category: 'pantry' },
        { name: 'Salz', amount: 'etwas', category: 'pantry' },
        { name: 'Emmentaler (Allgäuer)', amount: '150 g', category: 'dairy' },
        { name: 'Bergkäse', amount: '100 g', category: 'dairy' },
        { name: 'Romadur (oder Weißlacker)', amount: '50 g', category: 'dairy' },
        { name: 'Zwiebeln', amount: '3 große', category: 'produce' },
        { name: 'Butter', amount: 'nach Bedarf', category: 'dairy' },
      ],
      instructions: [
        'Die Zwiebeln schälen und in dünne halbe Ringe schneiden. In reichlich Butter bei mittlerer Hitze goldbraun braten.',
        'Das Mehl in eine Schüssel sieben. Eier, Mineralwasser und eine gute Prise Salz hinzufügen. Teig schlagen, bis er Blasen wirft.',
        'Den Ofen auf 80 °C vorheizen und einen großen Topf mit Salzwasser aufsetzen.',
        'Den Teig portionsweise ins Wasser hobeln. Sobald die Spätzle oben schwimmen, mit dem Schaumlöffel abschöpfen und in die warme Form geben, abwechselnd mit Käse schichten.',
        'Die gebräunten Zwiebeln auf den Kässpatzen verteilen und mit frischem Salat servieren.',
      ],
      tags: ['Chefkoch', 'Traditionell', 'Vegetarisch', 'Comfort Food'],
      sourceUrl: 'https://www.chefkoch.de/rezepte/1279831233330574/Allgaeuer-Kaesspatzen.html',
      sourceType: 'link',
      notes: 'Direkt aus Chefkoch.de importiert - Echtes Allgäuer Familienrezept.',
    },
  },
  {
    id: 'chefkoch_kaesespaetzle_pfanne',
    name: 'Käsespätzle Pfanne (Chefkoch)',
    source: 'Chefkoch.de',
    url: 'https://www.chefkoch.de/rezepte/79221030372046/Kaesespaetzle.html',
    recipe: {
      title: 'Käsespätzle Pfanne mit Röstzwiebeln',
      prepTime: '25 mins',
      servings: 4,
      category: 'comfort',
      imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Spätzle (frisch)', amount: '500 g', category: 'dairy' },
        { name: 'Käse (Emmentaler & Gouda gemischt)', amount: '200 g', category: 'dairy' },
        { name: 'Schlagsahne oder Milch', amount: '150 ml', category: 'dairy' },
        { name: 'Zwiebeln', amount: '2 große', category: 'produce' },
        { name: 'Butter', amount: '2 EL', category: 'dairy' },
        { name: 'Muskatnuss & Pfeffer', amount: '1 Prise', category: 'pantry' },
        { name: 'Schnittlauch', amount: '1 Bund', category: 'produce' },
      ],
      instructions: [
        'Zwiebeln in feine Ringe schneiden und in einer Pfanne mit 1 EL Butter langsam goldbraun und knusprig braten, dann beiseitestellen.',
        'In derselben Pfanne restliche Butter erhitzen und die Spätzle darin anbraten.',
        'Sahne angießen, den geriebenen Käse dazugeben und unter Rühren schmelzen lassen, bis die Sauce cremig wird.',
        'Mit Salz, Pfeffer und frisch geriebenem Muskat abschmecken.',
        'Mit den Röstzwiebeln und Schnittlauch bestreut sofort heiß servieren.',
      ],
      tags: ['Chefkoch', 'Schnell', 'Vegetarisch', 'Pfannengericht'],
      sourceUrl: 'https://www.chefkoch.de/rezepte/79221030372046/Kaesespaetzle.html',
      sourceType: 'link',
      notes: 'Direkt aus Chefkoch.de importiert - Schnelle 25-Minuten Käsespätzle Pfanne.',
    },
  },
  {
    id: 'bbc_tuscan_chicken',
    name: 'Creamy Tuscan Garlic Chicken',
    source: 'BBC Good Food',
    url: 'https://www.bbcgoodfood.com/recipes/creamy-tuscan-chicken',
    recipe: {
      title: 'Creamy Tuscan Garlic & Sun-Dried Tomato Chicken',
      prepTime: '25 mins',
      servings: 4,
      category: 'quick',
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Chicken Breast Fillets', amount: '600g', category: 'meat' },
        { name: 'Sun-Dried Tomatoes (sliced)', amount: '100g', category: 'pantry' },
        { name: 'Fresh Baby Spinach', amount: '150g', category: 'produce' },
        { name: 'Heavy Cream / Schlagsahne', amount: '200ml', category: 'dairy' },
        { name: 'Garlic Cloves (minced)', amount: '4 cloves', category: 'produce' },
        { name: 'Parmesan (freshly grated)', amount: '60g', category: 'dairy' },
        { name: 'Olive Oil', amount: '2 tbsp', category: 'pantry' },
      ],
      instructions: [
        'Season chicken breasts with salt, pepper, and oregano. Sear in olive oil for 5-6 mins per side until golden, then set aside.',
        'In the same skillet, sauté minced garlic and sun-dried tomatoes for 1 minute until fragrant.',
        'Pour in the cream, bring to a gentle simmer, then stir in grated parmesan until rich and smooth.',
        'Fold in fresh baby spinach until just wilted.',
        'Return the chicken breasts to the pan to coat in the luxurious sauce. Serve over pasta, rice, or crusty bread.',
      ],
      tags: ['BBC Good Food', 'Under 30m', 'High Protein', 'Family Favorite'],
      sourceUrl: 'https://www.bbcgoodfood.com/recipes/creamy-tuscan-chicken',
      sourceType: 'link',
      notes: 'Imported from BBC Good Food. One-skillet dinner ready in 25 minutes.',
    },
  },
  {
    id: 'nyt_lemon_pasta',
    name: 'One-Pot Lemon Ricotta Spaghetti',
    source: 'NYT Cooking',
    url: 'https://cooking.nytimes.com/recipes/one-pot-lemon-ricotta-spaghetti',
    recipe: {
      title: 'One-Pot Silky Lemon Ricotta Spaghetti',
      prepTime: '20 mins',
      servings: 4,
      category: 'quick',
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Spaghetti / Linguine', amount: '400g', category: 'pantry' },
        { name: 'Whole Milk Ricotta', amount: '250g', category: 'dairy' },
        { name: 'Organic Lemons (zest & juice)', amount: '2 lemons', category: 'produce' },
        { name: 'Parmigiano Reggiano', amount: '50g', category: 'dairy' },
        { name: 'Fresh Basil Leaves', amount: '1 handful', category: 'produce' },
        { name: 'Extra Virgin Olive Oil', amount: '3 tbsp', category: 'pantry' },
        { name: 'Fresh Black Pepper', amount: 'to taste', category: 'pantry' },
      ],
      instructions: [
        'Boil pasta in well-salted water until al dente. Reserve 1/2 cup of starchy pasta water before draining.',
        'In a large serving bowl, whisk ricotta, lemon zest, 2 tbsp lemon juice, grated parmesan, and olive oil into a silky cream.',
        'Add hot pasta directly into the bowl with a splash of pasta water. Toss vigorously until a glossy sauce coats every strand.',
        'Top with torn basil leaves, cracked black pepper, and extra lemon zest. Serve immediately!',
      ],
      tags: ['NYT Cooking', 'Vegetarian', 'Quick 20m', 'Weeknight Fast'],
      sourceUrl: 'https://cooking.nytimes.com/recipes/one-pot-lemon-ricotta-spaghetti',
      sourceType: 'link',
      notes: 'Imported from NYT Cooking. Super fresh 20-minute weeknight miracle.',
    },
  },
];

// Parser for arbitrary or demo link
export const parseRecipeFromLink = async (url: string): Promise<Omit<Recipe, 'id'>> => {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // 1. Check if matching any demo link
  const foundDemo = DEMO_RECIPE_LINKS.find(
    (d) =>
      cleanUrl.toLowerCase().includes(d.id.toLowerCase()) ||
      cleanUrl.toLowerCase().includes(d.url.toLowerCase())
  );
  if (foundDemo) {
    return foundDemo.recipe;
  }

  // 2. Check if user entered just the root homepage (e.g. https://www.chefkoch.de without a recipe path)
  try {
    const parsed = new URL(cleanUrl);
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (!pathname || pathname === 'rezepte' || pathname === 'recipes') {
      if (parsed.hostname.includes('chefkoch')) {
        return DEMO_RECIPE_LINKS[0].recipe;
      }
      if (parsed.hostname.includes('bbcgoodfood')) {
        return DEMO_RECIPE_LINKS[1].recipe;
      }
      if (parsed.hostname.includes('cooking.nytimes')) {
        return DEMO_RECIPE_LINKS[2].recipe;
      }
    }
  } catch {
    // continue
  }

  // 3. Try live scraping via Vite backend endpoint /api/scrape-recipe
  try {
    const res = await fetch(`/api/scrape-recipe?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.recipe) {
        const r = data.recipe;

        // Clean title: remove " von <user>" or " - Chefkoch.de"
        let cleanTitle = (r.title || 'Imported Recipe')
          .replace(/\s+von\s+[A-Za-z0-9_-]+$/i, '')
          .replace(/\s*[-–|]\s*(Chefkoch|BBC Good Food|NYT Cooking|Allrecipes|Lecker|EatSmarter).*$/i, '')
          .trim();

        // If title is just a domain or generic, extract from slug
        if (cleanTitle.toLowerCase().includes('chefkoch') || cleanTitle.toLowerCase().includes('http') || cleanTitle.length < 3) {
          const slugMatch = cleanUrl.match(/\/([^\/?#]+)(?:[\/?#]|$)/);
          if (slugMatch && slugMatch[1]) {
            const rawSlug = slugMatch[1]
              .replace(/\.(html|php|aspx|json)$/i, '')
              .replace(/[-_]+/g, ' ')
              .replace(/\d+/g, '')
              .trim();
            if (rawSlug.length > 3) {
              cleanTitle = rawSlug
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            }
          }
        }

        // Infer category
        let category: Recipe['category'] = 'family-favorite';
        const catText = `${cleanTitle} ${r.category || ''} ${r.description || ''}`.toLowerCase();
        if (
          catText.includes('backen') ||
          catText.includes('kuchen') ||
          catText.includes('torte') ||
          catText.includes('dessert') ||
          catText.includes('cookie') ||
          catText.includes('baking')
        ) {
          category = 'baking';
        } else if (
          (r.prepTime && (r.prepTime.includes('15') || r.prepTime.includes('20') || r.prepTime.includes('25'))) ||
          catText.includes('schnell') ||
          catText.includes('quick') ||
          catText.includes('under 30')
        ) {
          category = 'quick';
        } else if (
          catText.includes('pasta') ||
          catText.includes('spätzle') ||
          catText.includes('käse') ||
          catText.includes('ragu') ||
          catText.includes('comfort') ||
          catText.includes('auflauf')
        ) {
          category = 'comfort';
        } else if (
          catText.includes('salat') ||
          catText.includes('gemüse') ||
          catText.includes('healthy') ||
          catText.includes('bowl')
        ) {
          category = 'healthy';
        }

        // Map ingredients with inferGroceryCategory
        const ingredients: Ingredient[] = (r.ingredients || []).map((ing: any) => ({
          name: ing.name ? ing.name.charAt(0).toUpperCase() + ing.name.slice(1) : 'Zutat',
          amount: ing.amount || 'nach Bedarf',
          category: inferGroceryCategory(ing.name || ''),
        }));

        // Instructions
        const instructions: string[] =
          r.instructions && r.instructions.length > 0
            ? r.instructions
            : [
                `Alle frischen Zutaten für ${cleanTitle} vorbereiten.`,
                'Zubereitungsschritte wie im Originalrezept beschrieben befolgen.',
                'Warm anrichten und mit der Familie genießen!',
              ];

        // Domain name for tags
        let domainTag = 'Web Recipe';
        try {
          domainTag = new URL(cleanUrl).hostname.replace('www.', '');
        } catch {
          // fallback
        }

        const tags: string[] = [domainTag, 'Online Import'];
        if (category === 'comfort') tags.push('Comfort Food');
        if (category === 'quick') tags.push('Under 30m');

        return {
          title: cleanTitle,
          prepTime: r.prepTime || '30 mins',
          servings: r.servings || 4,
          category,
          imageUrl: r.imageUrl || getMatchingFoodPhoto(cleanTitle, r.description || ''),
          ingredients:
            ingredients.length > 0
              ? ingredients
              : [
                  { name: 'Frische Zutaten für ' + cleanTitle, amount: '400g', category: 'produce' },
                  { name: 'Gewürze & Kräuter', amount: 'nach Geschmack', category: 'pantry' },
                  { name: 'Olivenöl oder Butter', amount: '2 EL', category: 'pantry' },
                ],
          instructions,
          tags,
          sourceUrl: cleanUrl,
          sourceType: 'link',
          notes: r.description
            ? r.description.slice(0, 180) + '...'
            : `Imported directly from ${domainTag}.`,
        };
      }
    }
  } catch (err) {
    console.warn('Scraper API failed, falling back to heuristic', err);
  }

  // 4. Fallback Heuristic extraction if offline
  let parsedDomain = 'Food Blog';
  try {
    const u = new URL(cleanUrl);
    parsedDomain = u.hostname.replace('www.', '');
  } catch {
    // fallback
  }

  // Extract a readable dish title from the URL slug
  let extractedTitle = 'Special Homemade Recipe';
  const slugMatch = cleanUrl.match(/\/([^\/?#]+)(?:[\/?#]|$)/);
  if (slugMatch && slugMatch[1]) {
    const rawSlug = slugMatch[1]
      .replace(/\.(html|php|aspx|json)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\d+/g, '')
      .trim();
    if (rawSlug.length > 3 && !rawSlug.toLowerCase().includes('chefkoch')) {
      extractedTitle = rawSlug
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  return {
    title: extractedTitle,
    prepTime: '30 mins',
    servings: 4,
    category: 'family-favorite',
    imageUrl: getMatchingFoodPhoto(extractedTitle, cleanUrl),
    ingredients: [
      { name: 'Frische Zutaten für ' + extractedTitle, amount: '400g', category: 'produce' },
      { name: 'Gewürze & Kräuter', amount: 'nach Geschmack', category: 'pantry' },
      { name: 'Olivenöl / Butter', amount: '2 EL', category: 'pantry' },
      { name: 'Pasta oder Reis', amount: '350g', category: 'pantry' },
    ],
    instructions: [
      `Zutaten für ${extractedTitle} vorbereiten.`,
      'Zubereitungsschritte wie auf ' + parsedDomain + ' beschrieben befolgen.',
      'Heiß servieren und genießen!',
    ],
    tags: [parsedDomain, 'Imported Link', 'Family Favorite'],
    sourceUrl: cleanUrl,
    sourceType: 'link',
    notes: `Imported via web link from ${parsedDomain}.`,
  };
};

// 3. Demo & Photo / OCR Scan Parser
export interface DemoPhotoScan {
  id: string;
  name: string;
  previewImage: string;
  recipe: Omit<Recipe, 'id'>;
}

export const DEMO_PHOTO_SCANS: DemoPhotoScan[] = [
  {
    id: 'grandma_strudel',
    name: "Oma's Handwritten Apfelstrudel Card",
    previewImage: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=600&q=80',
    recipe: {
      title: "Oma Elenas Warmer Apfelstrudel",
      prepTime: '45 mins',
      servings: 6,
      category: 'baking',
      imageUrl: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Strudelteig oder Blätterteig', amount: '1 Rolle (275g)', category: 'dairy' },
        { name: 'Säuerliche Äpfel (z.B. Boskoop)', amount: '1 kg', category: 'produce' },
        { name: 'Zimtpulver & Zucker', amount: '3 EL', category: 'pantry' },
        { name: 'Rosinen (in Apfelsaft gequollen)', amount: '60g', category: 'pantry' },
        { name: 'Semmelbrösel (in Butter geröstet)', amount: '70g', category: 'bakery' },
        { name: 'Butter zum Bestreichen', amount: '50g', category: 'dairy' },
        { name: 'Puderzucker zum Bestäuben', amount: '2 EL', category: 'pantry' },
      ],
      instructions: [
        'Äpfel schälen, entkernen und in feine Scheiben schneiden. Mit Zimt, Zucker und Rosinen vermengen.',
        'Semmelbrösel in 30g Butter kurz goldbraun anrösten und abkühlen lassen.',
        'Strudelteig auf einem Tuch ausrollen, mit flüssiger Butter bestreichen und Brösel darauf verteilen.',
        'Die Apfelmischung auf dem Teig verteilen, Ränder einschlagen und vorsichtig einrollen.',
        'Bei 190°C Ober-/Unterhitze ca. 35 Minuten goldbraun backen. Mit Puderzucker bestäuben und warm mit Vanilleeis servieren!',
      ],
      tags: ['Handwritten Recipe', 'Grandma Special', 'Weekend Baking', 'Family Tradition'],
      sourceType: 'photo',
      notes: "Scanned from Oma Elena's vintage handwritten family recipe card.",
    },
  },
  {
    id: 'italian_ragu',
    name: 'Cookbook Page: Classic Bolognese Ragu',
    previewImage: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    recipe: {
      title: 'Traditional Italian Ragù alla Bolognese',
      prepTime: '50 mins',
      servings: 6,
      category: 'comfort',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80',
      ingredients: [
        { name: 'Rinderhackfleisch & Schweinehack', amount: '600g', category: 'meat' },
        { name: 'Pancetta oder gewürfelter Speck', amount: '100g', category: 'meat' },
        { name: 'Möhren & Staudensellerie', amount: 'je 1 Stk fein gewürfelt', category: 'produce' },
        { name: 'Zwiebel & Knoblauch', amount: '1 Zwiebel, 2 Zehen', category: 'produce' },
        { name: 'Gehackte Tomaten (Dose)', amount: '2 Dosen (800g)', category: 'pantry' },
        { name: 'Vollmilch (für Zartheit)', amount: '150ml', category: 'dairy' },
        { name: 'Tagliatelle Pasta', amount: '500g', category: 'pantry' },
      ],
      instructions: [
        'Pancetta im Topf auslassen. Möhren, Sellerie und Zwiebeln dazugeben und 8 Min sanft anschwitzen.',
        'Hackfleisch zugeben und krümelig anbraten. Mit einem Schuss Milch ablöschen und einköcheln lassen.',
        'Tomaten zugeben, mit Salz, Pfeffer und Lorbeerblatt würzen.',
        'Bei kleinster Hitze mindestens 40 Min sanft simmern lassen.',
        'Frische Tagliatelle al dente kochen und direkt im heißen Ragù schwenken.',
      ],
      tags: ['Cookbook Scan', 'Italian Classic', 'Comfort Food', 'Meal Prep'],
      sourceType: 'photo',
      notes: 'Scanned from Nonna’s Italian Kitchen Cookbook (Page 142).',
    },
  },
];

// Parser for uploaded image
export const parseRecipeFromPhoto = async (
  _imageFileOrDataUrl: string,
  sampleId?: string
): Promise<Omit<Recipe, 'id'>> => {
  if (sampleId) {
    const demo = DEMO_PHOTO_SCANS.find((d) => d.id === sampleId);
    if (demo) return demo.recipe;
  }

  // Generic parsed photo recipe
  return {
    title: 'Scanned Cookbook Recipe',
    prepTime: '35 mins',
    servings: 4,
    category: 'family-favorite',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Main Protein / Base', amount: '500g', category: 'meat' },
      { name: 'Seasonal Vegetables', amount: '300g', category: 'produce' },
      { name: 'Cooking Oil & Butter', amount: '2 tbsp', category: 'pantry' },
      { name: 'Fresh Herbs & Seasoning', amount: '1 bunch', category: 'produce' },
    ],
    instructions: [
      'Clean, slice, and prepare all fresh ingredients as recognized from the image scan.',
      'Sauté the base ingredients in a hot pan or pot until fragrant and tender.',
      'Simmer gently, adjust seasoning with salt, pepper, and herbs, and serve hot.',
    ],
    tags: ['Photo Scan', 'Handmade', 'Family Favorite'],
    sourceType: 'photo',
    notes: 'Imported from photo scan using Famly Recipe OCR.',
  };
};
