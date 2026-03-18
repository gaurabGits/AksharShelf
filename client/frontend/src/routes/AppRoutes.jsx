import Books from "../pages/books.jsx";
import BookDetailPage from "../pages/BookDetailPage.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";
import ReaderPage from "../pages/ReaderPage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import Login from "../pages/Auth/Login.jsx";
import Register from "../pages/Auth/Signup.jsx"
import MyLibrary from "../pages/MyLibrary.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import FreeBooksSection from "../components/landing/FreeBooksSection.jsx";
import AboutPage from "../pages/AboutPage.jsx";
import PurchasePage from "../pages/PurchasePage.jsx";

export const routes = [
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/books",
    element: <Books />,
  },
  {
    path: "/books/free-books",
    element: <FreeBooksSection />,
  },
  {
    path: "/books/:id",
    element: <BookDetailPage />,
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/auth/signup",
    element: <Register />,
  },
  {
    path: "/my-library",
    element: (
      <ProtectedRoute>
        <MyLibrary />
      </ProtectedRoute>
    ),
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/book/:id",
    element: (
      <BookDetailPage />
    ),
  },
  {
    path: "/read/:id",
    element: (
      <ProtectedRoute>
        <ReaderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/purchase/:id",
    element: (
      <ProtectedRoute>
        <PurchasePage />
      </ProtectedRoute>
    ),
  },
];
