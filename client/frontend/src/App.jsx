import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navber"
import Books from "./pages/books";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to BookStore</h1>} />
          <Route path="/books" element={<Books />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookshelf" element={<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bookshelf</h1>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
