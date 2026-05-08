import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API base URL from Vite env. Set VITE_API_BASE_URL to e.g. "http://localhost:8080"
const _env = (import.meta as any).env;
const apiBase = _env?.VITE_API_BASE_URL ?? null;
setBaseUrl(apiBase);

createRoot(document.getElementById("root")!).render(<App />);
