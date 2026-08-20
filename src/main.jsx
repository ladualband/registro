import React from "react";
import { createRoot } from "react-dom/client";
import Registro from "./App.jsx";

createRoot(document.getElementById("app")).render(<Registro />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
