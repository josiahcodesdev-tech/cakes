import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-28 text-center">
      <p className="font-display text-8xl font-bold text-berry-500">404</p>
      <h1 className="mt-4 text-3xl font-bold">Oops, this page crumbled.</h1>
      <p className="mt-3 text-cocoa-700">The page you’re looking for doesn’t exist, but our cakes do.</p>
      <Link to="/shop" className="btn-primary mt-8">Back to the cakes</Link>
    </div>
  )
}
