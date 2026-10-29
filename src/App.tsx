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
import AdminPayments from './pages/AdminPayments'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
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
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <FloatingWhatsApp />
      </CartProvider>
    </BrowserRouter>
  )
}
