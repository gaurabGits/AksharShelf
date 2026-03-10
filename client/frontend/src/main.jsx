import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"
import 'react-pdf/dist/Page/TextLayer.css';
import { NotificationProvider } from "./context/Notification";
import { AdminAuthProvider } from "./admin/AdminAuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AdminAuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AdminAuthProvider>
  </BrowserRouter>
);
