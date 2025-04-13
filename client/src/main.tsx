import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add title to the page
document.title = "Wealth Tracker - Net Worth Dashboard";

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
