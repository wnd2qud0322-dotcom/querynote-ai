import React from "react";
import { createRoot } from "react-dom/client";
import App from "../querynote.jsx";

if (!window.storage) {
  const storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    }
  };
  window.storage = storage;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
