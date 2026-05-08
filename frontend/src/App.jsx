import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ParticleCanvas from "./components/ParticleCanvas";
import Cart from "./components/Cart";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminOrders from "./pages/AdminOrders";
import { useCart } from "./context/CartContext";

function App() {
  const { isOpen } = useCart();

  return (
    <Router>
      <ParticleCanvas />
      <Navbar />
      <Cart />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
      </Routes>
    </Router>
  );
}

export default App;
