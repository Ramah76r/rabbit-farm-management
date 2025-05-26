import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeDefaultData } from "./lib/data";

// Initialize default data if not exists
initializeDefaultData();

createRoot(document.getElementById("root")!).render(<App />);
