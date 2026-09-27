import type { Category, CategoryId, Product, Size } from '../types'

export const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

// Photo IDs by what they show, so products and categories stay consistent.
const photo = {
  chocDrip: '1578985545062-69928b1d9587',
  berryWhite: '1535141192574-5d4897c12636',
  rainbow: '1464349095431-e9a21285b5f3',
  tiramisuLayer: '1571115177098-24ec42ed204d',
  tealCupcakes: '1486427944299-d1955d23e34d',
  pinkDrip: '1558301211-0d8c8ddee6ec',
  blackForest: '1606890737304-57a1ca8a5b62',
  mintCupcake: '1587668178277-295251f900ce',
  iceCreamCake: '1621303837174-89787a7d4729',
  chocMousse: '1602351447937-745cb720612f',
  redVelvetCupcake: '1614707267537-b85aaf00c4b7',
  redVelvetCake: '1586788680434-30d324b2d46f',
  sprinkleCupcakes: '1519869325930-281384150729',
  oreoCake: '1557925923-cd4648e211a0',
  raspberrySlice: '1565958011703-44f9829ba187',
  macaronDrip: '1562440499-64c9a111f713',
  lemonCupcake: '1576618148400-f54bed99fcfd',
  pinkCupcakes: '1599785209707-a456fc1337bb',
  ferreroCupcake: '1603532648955-039310d9ed75',
  orangeGlaze: '1542826438-bd32f43d626f',
  cheesecake: '1533134242443-d4fd215305ad',
  floralTiers: '1535254973040-607b474cb50d',
  oreoCupcakes: '1612203985729-70726954388c',
  oreoDripTall: '1616690710400-a16d146927c5',
  birthdayChalk: '1558636508-e0db3814bd1d',
  goldDrip: '1627834377411-8da5f4f09de8',
  tiramisu: '1571877227200-a0d98ea607e9',
  blackberryFloral: '1559620192-032c4bc4674e',
  redVelvetSlice: '1616541823729-00fe0aacd32c',
  strawberryShortcake: '1602663491496-73f07481dbea',
}

export const categories: Category[] = [
  { id: 'ready', name: 'Ready Cakes', blurb: 'Baked fresh this morning. Delivered in 1–2 hrs.', image: img(photo.blackForest, 400) },
  { id: 'birthday', name: 'Birthday Cakes', blurb: 'Make their day unforgettable. Delivered in 1–3 hrs.', image: img(photo.pinkDrip, 400) },
  { id: 'anniversary', name: 'Anniversary', blurb: 'Sweet ways to say “still you”. Delivered in 2–3 hrs.', image: img(photo.blackberryFloral, 400) },
  { id: 'kids', name: 'Kids Corner', blurb: 'Superheroes, princesses, football clubs & more.', image: img(photo.rainbow, 400) },
  { id: 'cupcakes', name: 'Cupcakes & Bento', blurb: 'Boxes of 6, 12 or 24, plus mini bento cakes.', image: img(photo.mintCupcake, 400) },
  { id: 'signature', name: 'Signature Flavours', blurb: 'Tiramisu, cheesecake & more. 24 hrs notice.', image: img(photo.tiramisu, 400) },
  { id: 'special', name: 'Eggless & Sugar-free', blurb: 'Diabetic-friendly, gluten-free and eggless bakes.', image: img(photo.strawberryShortcake, 400) },
  { id: 'corporate', name: 'Corporate Cakes', blurb: 'Logo prints and launches. Invoices available.', image: img(photo.orangeGlaze, 400) },
  { id: 'graduation', name: 'Graduation', blurb: 'Celebrate the big milestone in style.', image: img(photo.goldDrip, 400) },
  { id: 'baby', name: 'Baby Shower', blurb: 'Gender reveals, baby showers & christenings.', image: img(photo.macaronDrip, 400) },
  { id: 'flowers', name: 'Flowers & Cakes', blurb: 'Fresh bouquets paired with a cake. The perfect surprise.', image: img(photo.berryWhite, 400) },
  { id: 'wedding', name: 'Wedding Cakes', blurb: 'Tiered showpieces for 50 to 600 guests.', image: img(photo.floralTiers, 400) },
]

export const sizes: Size[] = [
  { id: '1kg', label: '1 kg', serves: '8–10 people', extra: 0 },
  { id: '1.5kg', label: '1.5 kg', serves: '12–15 people', extra: 1500 },
  { id: '2kg', label: '2 kg', serves: '18–20 people', extra: 3000 },
  { id: '3kg', label: '3 kg', serves: '25–30 people', extra: 6000 },
]

/** Flavours listed in the "Shop by flavour" menu; each links to a shop search. */
export const menuFlavours = [
  'Vanilla', 'Chocolate', 'Red Velvet', 'Black Forest', 'White Forest', 'Lemon', 'Strawberry', 'Carrot', 'Tiramisu', 'Cheesecake',
]

const standard = ['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']

type Seed = Omit<Product, 'id' | 'slug' | 'image' | 'rating' | 'readyIn'> & {
  photo: keyof typeof photo
  rating?: number
  readyIn?: string
}

const defaultReadyIn: Record<CategoryId, string> = {
  ready: '1–2 hrs', birthday: '1–3 hrs', anniversary: '2–3 hrs', kids: '3–4 hrs', cupcakes: '2–3 hrs', signature: '24 hrs',
  special: '24 hrs', corporate: '24 hrs', graduation: '3–4 hrs', baby: '24 hrs', flowers: '2–3 hrs', wedding: '2 weeks',
}

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const seeds: Seed[] = [
  // Ready
  { name: 'Classic Black Forest', category: 'ready', photo: 'blackForest', basePrice: 2600, oldPrice: 3000, flavours: ['Black Forest'], tags: ['bestseller'], description: 'Chocolate sponge soaked in cherry syrup, layered with whipped cream and crowned with cherries and chocolate shavings.' },
  { name: 'Chocolate Fudge Swirl', category: 'ready', photo: 'chocDrip', basePrice: 2600, flavours: ['Chocolate'], tags: ['bestseller'], rating: 4.9, description: 'Moist chocolate sponge, silky ganache drip and piped chocolate buttercream rosettes.' },
  { name: 'Red Velvet Classic', category: 'ready', photo: 'redVelvetCake', basePrice: 2800, flavours: ['Red Velvet'], description: 'Velvety cocoa sponge layered with tangy cream cheese frosting. Always a crowd-pleaser.' },
  { name: 'Oreo Cookies & Cream', category: 'ready', photo: 'oreoCake', basePrice: 2900, oldPrice: 3200, flavours: ['Oreo', 'Chocolate'], description: 'Chocolate sponge with crushed-Oreo cream filling and a cookie-crumb finish.' },

  // Birthday
  { name: 'Confetti Birthday Bash', category: 'birthday', photo: 'pinkDrip', basePrice: 3500, oldPrice: 3750, flavours: standard, tags: ['bestseller'], description: 'Vanilla sponge loaded with rainbow sprinkles, pink drip and cherries. Name & age piping included.' },
  { name: 'Macaron Dream Tall Cake', category: 'birthday', photo: 'macaronDrip', basePrice: 4200, flavours: standard, tags: ['new'], description: 'A tall pastel-striped cake with a white chocolate drip and a crown of French macarons.' },
  { name: 'Golden Drip Celebration', category: 'birthday', photo: 'goldDrip', basePrice: 4250, oldPrice: 4600, flavours: standard, description: 'Chocolate drip, gold-painted accents, meringue kisses and macarons on a soft pistachio buttercream.' },
  { name: 'Chocolate Mousse Drip', category: 'birthday', photo: 'chocMousse', basePrice: 3600, flavours: ['Chocolate', 'Mocha', 'Chocolate-Vanilla Marble'], description: 'Light chocolate mousse layers under a glossy ganache drip and chocolate pearls.' },

  // Anniversary
  { name: 'Blackberry Bloom', category: 'anniversary', photo: 'blackberryFloral', basePrice: 3500, flavours: ['Vanilla', 'Lemon', 'Berry'], description: 'Semi-naked vanilla cake topped with fresh blackberries and edible lilac flowers.' },
  { name: 'Raspberry Romance', category: 'anniversary', photo: 'raspberrySlice', basePrice: 3200, oldPrice: 3600, flavours: ['Vanilla', 'Raspberry'], description: 'Fluffy sponge layered with raspberry compote and whipped cream, topped with fresh berries.' },
  { name: 'Strawberries & Cream', category: 'anniversary', photo: 'strawberryShortcake', basePrice: 3300, flavours: ['Vanilla', 'Strawberry'], description: 'Japanese-style strawberry shortcake: feather-light sponge, fresh cream and juicy strawberries.' },

  // Kids
  { name: 'Rainbow Sprinkle Surprise', category: 'kids', photo: 'rainbow', basePrice: 3500, flavours: standard, tags: ['bestseller'], description: 'Six rainbow layers hidden inside a sprinkle-covered shell. Pure joy when you cut it.' },
  { name: 'Ice-Cream Cone Party', category: 'kids', photo: 'iceCreamCake', basePrice: 3800, flavours: standard, tags: ['new'], description: 'Funfetti cake with a pink drip and an upside-down waffle cone topper.' },
  { name: 'Cookies & Cream Tower', category: 'kids', photo: 'oreoDripTall', basePrice: 4500, oldPrice: 4800, flavours: ['Oreo', 'Vanilla', 'Chocolate'], description: 'A tall cake with pink drip, Oreos, swirls and a doughnut on top. Theme it however you like.' },

  // Cupcakes
  { name: 'Mint Choc Cupcakes', category: 'cupcakes', photo: 'mintCupcake', basePrice: 1400, fixedSize: 'Box of 6', flavours: ['Chocolate'], description: 'Chocolate cupcakes swirled with fresh mint buttercream and a chocolate button.' },
  { name: 'Oreo Chocolate Cupcakes', category: 'cupcakes', photo: 'oreoCupcakes', basePrice: 1500, fixedSize: 'Box of 6', flavours: ['Chocolate', 'Oreo'], tags: ['bestseller'], description: 'Rich chocolate cupcakes, cookies & cream frosting and half an Oreo on top.' },
  { name: 'Red Velvet Cupcakes', category: 'cupcakes', photo: 'redVelvetCupcake', basePrice: 2600, oldPrice: 2800, fixedSize: 'Box of 12', flavours: ['Red Velvet'], description: 'A dozen red velvet cupcakes with cream cheese frosting and red velvet crumbs.' },
  { name: 'Sprinkle Party Cupcakes', category: 'cupcakes', photo: 'sprinkleCupcakes', basePrice: 2400, fixedSize: 'Box of 12', flavours: ['Vanilla', 'Chocolate', 'Strawberry'], description: 'Vanilla cupcakes with fluffy buttercream and rainbow sprinkles. Perfect for class parties.' },

  // Signature flavours
  { name: 'Tiramisu Fine Cake', category: 'signature', photo: 'tiramisu', basePrice: 4500, flavours: ['Tiramisu'], rating: 5, description: 'Espresso-soaked sponge, mascarpone cream and a dusting of cocoa. Adults-only indulgence.' },
  { name: 'Blueberry Cheesecake', category: 'signature', photo: 'cheesecake', basePrice: 4200, flavours: ['Blueberry', 'Strawberry', 'Plain'], description: 'Baked New York cheesecake on a buttery biscuit base with a thick blueberry topping.' },
  { name: 'Orange Mirror Glaze', category: 'signature', photo: 'orangeGlaze', basePrice: 3800, oldPrice: 4200, flavours: ['Orange', 'Passion'], tags: ['new'], description: 'Orange mousse cake with a glossy mirror glaze, chocolate lattice and strawberries.' },
  { name: 'Coffee Crunch Layer', category: 'signature', photo: 'tiramisuLayer', basePrice: 4000, flavours: ['Coffee', 'Mocha'], description: 'Thin coffee-soaked sponge layers with mascarpone and a crunchy chocolate wafer.' },

  // Special diets
  { name: 'Eggless Vanilla Cake', category: 'special', photo: 'strawberryShortcake', basePrice: 3000, flavours: ['Vanilla', 'Strawberry'], tags: ['eggless'], description: 'Our classic vanilla sponge made completely egg-free, without losing any of the softness.' },
  { name: 'Eggless Red Velvet', category: 'special', photo: 'redVelvetSlice', basePrice: 3200, flavours: ['Red Velvet'], tags: ['eggless'], description: 'Egg-free red velvet with cream cheese frosting. Nobody will guess.' },
  { name: 'Sugar-free Diabetic Cake', category: 'special', photo: 'raspberrySlice', basePrice: 3500, flavours: ['Vanilla', 'Lemon'], tags: ['sugar-free'], description: 'Sweetened with natural stevia and fresh fruit. Suitable for diabetic guests.' },

  // Corporate
  { name: 'Logo Print Corporate Cake', category: 'corporate', photo: 'orangeGlaze', basePrice: 5500, flavours: standard, description: 'Your company logo on an A4 edible print, in brand colours. Great for launches and team wins.' },
  { name: 'Executive Chocolate Cake', category: 'corporate', photo: 'chocMousse', basePrice: 6000, fixedSize: '3 kg', flavours: ['Chocolate', 'Vanilla'], description: 'A sleek 3 kg chocolate cake finished to match your event branding.' },

  // Graduation
  { name: 'Graduation Gold Tall Cake', category: 'graduation', photo: 'goldDrip', basePrice: 4500, flavours: standard, tags: ['new'], description: 'A tall design with gold accents, a fondant cap and the graduate’s name.' },
  { name: 'Proud Grad Chocolate Cake', category: 'graduation', photo: 'chocDrip', basePrice: 3600, flavours: standard, description: 'Chocolate drip cake finished with a personalised “Congrats Grad” topper.' },

  // Baby
  { name: 'Gender Reveal Surprise', category: 'baby', photo: 'rainbow', basePrice: 4200, flavours: standard, description: 'Neutral on the outside and pink or blue inside. Tell us the secret privately and we keep it.' },
  { name: 'Baby Shower Pastel Cake', category: 'baby', photo: 'macaronDrip', basePrice: 4000, flavours: standard, description: 'Soft pastel stripes, macarons and a “Oh Baby” topper.' },
  { name: 'Mini Bento + 5 Cupcakes', category: 'baby', photo: 'pinkCupcakes', basePrice: 2500, fixedSize: 'Bento + 5 cupcakes', flavours: ['Vanilla', 'Chocolate'], description: 'A lunchbox-size bento cake with five matching cupcakes. Perfect for small showers.' },

  // Flowers
  { name: 'Berries & Blooms Bundle', category: 'flowers', photo: 'berryWhite', basePrice: 6500, oldPrice: 7200, fixedSize: '1 kg cake + bouquet', flavours: ['Vanilla', 'Chocolate', 'Red Velvet'], description: 'A 1 kg berry-topped cake with a hand-tied bouquet of fresh roses and a greeting card.' },
  { name: 'Floral Kiss Combo', category: 'flowers', photo: 'blackberryFloral', basePrice: 5800, fixedSize: '1 kg cake + bouquet', flavours: ['Vanilla', 'Lemon'], description: 'Our Blackberry Bloom cake paired with a colourful mixed bouquet.' },
  { name: 'Cupcakes & Roses Hatbox', category: 'flowers', photo: 'pinkCupcakes', basePrice: 4800, fixedSize: '6 cupcakes + roses', flavours: ['Vanilla', 'Strawberry'], description: 'A hatbox of fresh roses with six cupcakes tucked inside. A surprise they’ll remember.' },

  // Wedding
  { name: 'Garden Rose Three-Tier', category: 'wedding', photo: 'floralTiers', basePrice: 28000, fixedSize: '3 tiers · 8 kg (80–100 guests)', flavours: ['Vanilla', 'Lemon', 'Red Velvet', 'Carrot'], rating: 5, description: 'Three ivory tiers dressed with fresh garden roses. Includes a free tasting session.' },
  { name: 'Berry Cascade Two-Tier', category: 'wedding', photo: 'berryWhite', basePrice: 16500, fixedSize: '2 tiers · 5 kg (50–60 guests)', flavours: ['Vanilla', 'Lemon', 'Berry'], description: 'An intimate two-tier cake with a cascade of fresh berries.' },
]

export const products: Product[] = seeds.map(({ photo: p, rating, readyIn, ...s }, i) => ({
  ...s,
  id: `p${i + 1}`,
  slug: slugify(s.name),
  image: img(photo[p]),
  rating: rating ?? 4.8,
  readyIn: readyIn ?? defaultReadyIn[s.category],
}))

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const getCategory = (id: string) => categories.find((c) => c.id === id)
export const byCategory = (id: CategoryId) => products.filter((p) => p.category === id)

export const discountPercent = (p: Product) =>
  p.oldPrice ? Math.round(((p.oldPrice - p.basePrice) / p.oldPrice) * 100) : 0

export const testimonials = [
  { name: 'Wanjiru M.', location: 'Kilimani', text: 'The rainbow cake was the star of my daughter’s party. It tasted even better than it looked!' },
  { name: 'Brian O.', location: 'Westlands', text: 'Ordered on WhatsApp at 9am and it was at my office by 11. Super smooth and so moist.' },
  { name: 'Aisha K.', location: 'Karen', text: 'Our wedding cake was absolutely perfect. Guests are still asking where we got it.' },
  { name: 'Kevin N.', location: 'Ruaka', text: 'The flowers + cake bundle saved my anniversary. My wife cried (the good kind).' },
]

export const deliveryZones = [
  { area: 'CBD, Upper Hill, Kilimani', fee: 300 },
  { area: 'Westlands, Lavington, Kileleshwa', fee: 400 },
  { area: 'Karen, Langata, South B/C', fee: 500 },
  { area: 'Kasarani, Ruaka, Rongai, Kitengela', fee: 700 },
]
