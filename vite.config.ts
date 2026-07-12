import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const localSolarPlugin = {
  name: "local-solar-data",
  configureServer(server: any) {
    server.middlewares.use("/api/local-solar", (req: any, res: any, next: any) => {
      const pid = req.url?.replace(/^\//, "").replace(/\.json$/, "");
      if (!pid) return next();
      const file = path.resolve(__dirname, "data/google_solar", `${pid}.json`);
      if (!fs.existsSync(file)) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(fs.readFileSync(file));
    });
  },
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), localSolarPlugin].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
