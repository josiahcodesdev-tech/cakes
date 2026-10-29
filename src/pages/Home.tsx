import { Link } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, Headphones, Leaf, MapPin, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react'
import { categories, img, testimonials } from '../data/products'
import ProductRow from '../components/ProductRow'
import HeroCarousel from '../components/HeroCarousel'
import SectionHeading from '../components/SectionHeading'
import { formatKES } from '../lib/format'
import { site } from '../config'

const perks = [
  { Icon: Truck, title: 'Fast delivery', text: 'Ready cakes in 1–3 hrs' },
  { Icon: ShieldCheck, title: 'Secure payment', text: 'M-Pesa, Visa & Mastercard' },
  { Icon: RotateCcw, title: 'Money-back promise', text: 'If it arrives damaged' },
  { Icon: Headphones, title: 'Real people, 7 days', text: 'Call or chat on WhatsApp' },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="container-x pt-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-berry-100">
          <div className="absolute -right-20 -bottom-24 size-96 rounded-full bg-butter-100 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-8 p-7 sm:p-12 md:grid-cols-[1.1fr_1fr] short:gap-6 short:p-6 short:sm:p-8 short:md:grid-cols-[1.2fr_1fr] short:lg:px-12 shorter:sm:py-5">
            <div>
              <p className="font-script text-[2rem] text-cocoa-700 sm:text-3xl">Fresh cakes in 30+ flavours</p>
              <h1 className="mt-2 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl xl:text-[3.4rem] short:mt-1 short:text-3xl short:sm:text-[2.6rem] short:xl:text-[3rem] shorter:md:mt-0 shorter:sm:text-[2.6rem] shorter:xl:text-[2.8rem]">
                Cake delivery in Nairobi, <span className="text-berry-500">in as little as 1 hour.</span>
              </h1>
              <p className="mt-5 max-w-md text-cocoa-700 short:mt-3 short:max-w-xl short:sm:text-lg shorter:md:mt-2 shorter:md:text-lg">
                Over 30 flavours, baked fresh every morning. Choose a ready cake for today, or design something only you could dream up.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 short:mt-5 shorter:md:mt-4">
                <Link to="/shop?category=ready" className="btn-primary">
                  Shop ready cakes <ArrowRight className="size-4" />
                </Link>
                <Link to="/custom" className="btn-outline">Custom cake</Link>
              </div>
            </div>
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="container-x mt-6">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {perks.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-cream-200">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-100 text-berry-500"><Icon className="size-5" /></span>
              <span className="min-w-0 leading-tight">
                <strong className="block text-sm">{title}</strong>
                <span className="text-xs text-cocoa-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* CATEGORY CIRCLES */}
      <section className="container-x pt-14" aria-labelledby="cats">
        <h2 id="cats" className="sr-only">Shop by category</h2>
        <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-12 lg:overflow-visible lg:px-0">
          {categories.map((c, i) => (
            <li key={c.id} className="w-20 shrink-0 sm:w-24 lg:w-auto">
              <Link to={`/shop?category=${c.id}`} className="group block text-center">
                <span
                  className={`mx-auto mb-2 block aspect-square overflow-hidden rounded-full p-1 ring-2 transition group-hover:ring-berry-500 ${
                    ['ring-berry-100', 'ring-butter-100', 'ring-pistachio-100'][i % 3]
                  }`}
                >
                  <img src={c.image} alt="" loading="lazy" className="size-full rounded-full object-cover transition duration-500 group-hover:scale-110" />
                </span>
                <span className="block text-xs leading-tight font-semibold group-hover:text-berry-600">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProductRow category="ready" title="Ready now, delivered in 1–2 hrs" />
      <ProductRow category="birthday" title="Featured birthday designs" tinted />

      <ProductRow category="anniversary" title="Anniversary cakes" />
      <ProductRow category="signature" title="Explore signature flavours" tinted />
      <ProductRow category="cupcakes" title="Cupcakes mania" />

      {/* CUSTOM CTA */}
      <section className="container-x py-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-cocoa-800 text-cream-50">
          <div className="grid items-center lg:grid-cols-2">
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="mb-2 font-script text-3xl text-butter-400">Custom creations</p>
              <h2 className="text-4xl leading-tight font-bold sm:text-5xl">Dreamed it? We’ll bake it.</h2>
              <p className="mt-4 max-w-md text-cream-200">
                Realistic fondant designs, football clubs, cartoon characters, corporate logos and multi-tier showpieces. Send a photo and get a quote within the hour.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  { Icon: ChefHat, t: 'Designed by our head pastry chef' },
                  { Icon: Leaf, t: 'Eggless, gluten-free & sugar-free options' },
                ].map(({ Icon, t }) => (
                  <li key={t} className="flex items-center gap-3"><Icon className="size-4 text-butter-400" /> {t}</li>
                ))}
              </ul>
              <Link to="/custom" className="btn-primary mt-8">Request a custom cake <ArrowRight className="size-4" /></Link>
            </div>
            <div className="h-72 lg:h-full lg:min-h-[28rem]">
              <img src={img('1616690710400-a16d146927c5', 1000)} alt="Tall themed celebration cake" loading="lazy" className="size-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <ProductRow category="kids" title="Kids corner" />
      <ProductRow category="special" title="Eggless, gluten-free & sugar-free" tinted />
      <ProductRow category="flowers" title="Fresh flowers & cake bundles" />

      {/* REVIEWS */}
      <section className="bg-cream-100 py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Google reviews · 4.9 ★" title="Nairobi loves our cakes" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <figure key={t.name} className={`rounded-[2rem] p-7 ${['bg-berry-100', 'bg-butter-100', 'bg-pistachio-100', 'bg-white'][i % 4]}`}>
                <div className="mb-4 flex">
                  {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="size-4 fill-cocoa-800 text-cocoa-800" />)}
                </div>
                <blockquote className="font-display text-lg leading-snug">“{t.text}”</blockquote>
                <figcaption className="mt-5 text-sm"><strong>{t.name}</strong> <span className="text-cocoa-500">· {t.location}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <ProductRow category="graduation" title="Graduation cakes" />
      <ProductRow category="baby" title="Oh baby! Showers & reveals" tinted />
      <ProductRow category="corporate" title="Corporate cakes" />
      <ProductRow category="wedding" title="Wedding statements" tinted />

      {/* DELIVERY + ABOUT */}
      <section className="container-x grid gap-6 pt-16 lg:grid-cols-2">
        <div className="rounded-[2.5rem] bg-white p-8 ring-1 ring-cream-200 sm:p-10">
          <p className="eyebrow mb-3">Delivery</p>
          <h2 className="text-3xl font-bold">We deliver wherever you are</h2>
          <p className="mt-3 text-cocoa-700">Chilled, sturdy boxes and careful riders. Free delivery on orders above {formatKES(8000)}.</p>
          <ul className="mt-6 divide-y divide-cream-200 text-sm">
            <li className="flex gap-3 py-3"><MapPin className="size-5 shrink-0 text-berry-500" /> Type your location at checkout, or drop a pin with one tap.</li>
            <li className="flex gap-3 py-3"><Truck className="size-5 shrink-0 text-berry-500" /> The delivery fee depends on distance. We confirm it on WhatsApp before we set off.</li>
            <li className="flex gap-3 py-3"><Clock className="size-5 shrink-0 text-berry-500" /> Ready cakes can reach you in as little as 1–2 hours.</li>
          </ul>
        </div>
        <div className="rounded-[2.5rem] bg-butter-100 p-8 sm:p-10">
          <p className="eyebrow mb-3">About {site.name}</p>
          <h2 className="text-3xl font-bold">Nairobi’s neighbourhood cake shop, online.</h2>
          <div className="mt-4 space-y-3 text-cocoa-700">
            <p>
              We bake birthday, anniversary, wedding and corporate cakes from scratch every day in our Ngong Road kitchen, then deliver them
              across Nairobi, from Westlands to Kitengela.
            </p>
            <p>
              Need something today? Our ready cakes leave the oven each morning and can reach you within two hours. Planning ahead? Our
              designers will create anything from a realistic fondant sculpture to a seven-tier wedding cake.
            </p>
          </div>
          <Link to="/about" className="btn-dark mt-6">Read our story</Link>
        </div>
      </section>
    </>
  )
}
