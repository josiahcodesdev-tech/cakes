import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import Cart from './pages/Cart'
import CustomOrder from './pages/CustomOrder'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// Loaded only when someone opens /admin, so shoppers don't download it.
const AdminApp = lazy(() => import('./admin/AdminApp'))

function Shopfront() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cake/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/custom" element={<CustomOrder />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <FloatingWhatsApp />
    </CartProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="grid min-h-screen place-items-center text-cocoa-500">Loading…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Shopfront />} />
      </Routes>
    </BrowserRouter>
  )
}
