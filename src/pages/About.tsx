import { Link } from 'react-router-dom'
import { Cake, Heart, Leaf } from 'lucide-react'
import { site } from '../config'

const values = [
  { Icon: Leaf, title: 'Real ingredients', text: 'Butter, free-range eggs, Belgian chocolate and seasonal Kenyan fruit. No shortcuts or premixes.' },
  { Icon: Heart, title: 'Made by hand', text: 'Each cake is baked, filled and decorated by hand in our Nairobi kitchen, the same day it leaves.' },
  { Icon: Cake, title: 'Designed for you', text: 'From a simple message to a five-tier showpiece, we tailor every detail to your celebration.' },
]

export default function About() {
  return (
    <div className="container-x py-12">
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Our story</p>
          <h1 className="text-4xl leading-tight font-bold sm:text-6xl">A small kitchen with a big sweet tooth.</h1>
          <p className="mt-6 text-lg leading-relaxed text-cocoa-700">
            {site.name} started in a tiny home kitchen with one oven and a lot of birthday requests from friends. Today our
            team of bakers and decorators turns out hundreds of cakes a week, but every one is still made the old-fashioned way.
          </p>
          <p className="mt-4 leading-relaxed text-cocoa-700">
            We believe a cake is more than dessert. It’s the centrepiece of the moments you’ll remember, so we treat it that way.
          </p>
          <Link to="/shop" className="btn-primary mt-8">Taste the difference</Link>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80"
            alt="Baker at work"
            className="aspect-[4/5] w-full rounded-[3rem] object-cover"
          />
          <div className="absolute -bottom-6 left-6 rounded-3xl bg-butter-400 px-6 py-4 shadow-xl">
            <span className="block font-script text-4xl">Since 2018</span>
            <span className="text-sm">Baking in Nairobi</span>
          </div>
        </div>
      </section>

      <section className="mt-28 grid gap-6 md:grid-cols-3">
        {values.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-[2rem] bg-white p-8 ring-1 ring-cream-200">
            <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-berry-100 text-berry-600">
              <Icon className="size-6" />
            </span>
            <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
            <p className="text-cocoa-700">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
