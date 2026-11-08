import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
const root = path.resolve("out");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      const data = await fs.readFile(file);
      if (pathname.startsWith("/_next/static/"))
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (
        /\.(html|js|css|svg|webmanifest)$/.test(file) &&
        (req.headers["accept-encoding"] || "").includes("gzip")
      ) {
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        res.end(gzipSync(data));
      } else res.end(data);
    } catch {
      res.writeHead(404);
      res.end("No encontrado");
    }
  })
  .listen(3017, "127.0.0.1", () => console.log("Local: http://127.0.0.1:3017"));
