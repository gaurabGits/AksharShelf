import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HiOutlineMoon, HiOutlineSun, HiOutlineBookOpen } from "react-icons/hi2";
import { HiOutlineSearch } from "react-icons/hi";


function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        

        <Link
          to="/"
          title="Home"
          className="flex items-center gap-2 text-xl font-semibold text-indigo-600 dark:text-indigo-400"
        >
          <HiOutlineBookOpen className="text-2xl" title="Home" /> BookStore
        </Link>

        <div className="hidden md:flex items-center relative w-1/3">
          <HiOutlineSearch className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search books..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl 
              bg-gray-100 dark:bg-gray-700 
              text-gray-900 dark:text-gray-200 
              placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 
              transition"
          />
        </div>


        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition">
            Home
          </Link>
          <Link to="/books" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition">
            Books
          </Link>


          {token ? (
            <>
              <Link to="/bookshelf" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition">
                My Bookshelf
              </Link>
              
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  setToken(null); // update state
                  window.location.reload(); 
                }}
                className="text-red-500 font-semibold hover:text-red-700 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" 
                className="text-gray-700
                  dark:text-gray-200
                  hover:text-indigo-600 
                  transition">
                Login
              </Link>

              <Link to="/register"
                className="inline-block px-4 py-2 
                  text-gray-700 dark:text-gray-200 
                  bg-blue-100 dark:bg-gray-700 
                  rounded-lg font-semibold
                  hover:bg-blue-200 dark:hover:bg-gray-600 
                  hover:text-indigo-600 
                  transition duration-300 ease-in-out">
                Signup
              </Link>
            </>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg
              bg-gray-100
              dark:bg-gray-700
              text-gray-700
              dark:text-gray-200
              hover:bg-gray-200
              dark:hover:bg-gray-600 
                transition">
            {darkMode ? (
              <HiOutlineSun className="text-lg" title="Light mode" />
            ) : (
              <HiOutlineMoon className="text-lg" title="Dark mode" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;