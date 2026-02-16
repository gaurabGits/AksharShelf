import { useEffect, useState } from "react";
import API from "../services/api";

function Books() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await API.get("/books");
        setBooks(res.data.books);
      } catch (error) {
        console.error(error);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
        📚 All Books
      </h2>

      {books.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No books available.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book._id}
              className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                {book.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Author: <span className="font-medium">{book.author}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Price: <span className="font-medium">${book.price}</span>
              </p>
              <button className="w-full py-2 mt-2 rounded-lg bg-indigo-300 text-white font-medium hover:bg-indigo-500 transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Books;