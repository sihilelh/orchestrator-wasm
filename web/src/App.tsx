import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/molecules/Narbar";
import { Home } from "./pages/Home";
import { Playground } from "./pages/Playground";
import { HowToUse } from "./pages/HowToUse";
import { About } from "./pages/About";
import { Toaster } from "./components/atoms/Sonner";

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen">
        <Toaster position="top-center" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
