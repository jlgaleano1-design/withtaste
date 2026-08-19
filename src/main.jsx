import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installSupabaseStorage } from "./supabaseStorage.js";
import Auth from "./Auth.jsx";
import App from "../app/ui-critique-repo.jsx";

installSupabaseStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth>
      <App />
    </Auth>
  </StrictMode>
);
