import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force permanent dark mode (Macro Intelligence Terminal)
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
