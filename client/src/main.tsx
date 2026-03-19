import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeMemberAPI } from "./lib/memberAPI";

// Initialize global Member API for Claims Module integration
initializeMemberAPI();

createRoot(document.getElementById("root")!).render(<App />);
