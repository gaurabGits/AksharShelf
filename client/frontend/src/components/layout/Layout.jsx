import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HashScrollManager from "./HashScrollManager";

export default function Layout() {
  const location = useLocation();
  const isReaderRoute = location.pathname === "/read" || location.pathname.startsWith("/read/");

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 overflow-x-hidden">
      <HashScrollManager />
      {!isReaderRoute ? <Navbar /> : null}
      <main className={`flex-1 ${isReaderRoute ? "pt-0" : "pt-16"}`}>
        <Outlet />
      </main>
      {!isReaderRoute ? <Footer /> : null}
    </div>
  );
}
