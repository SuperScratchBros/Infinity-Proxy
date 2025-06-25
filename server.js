const express = require("express");
const http = require("http");
const https = require("https");
const { URL } = require("url");
const path = require("path");

const { rewriteHTML, rewriteCSS } = require("./utils/rewrite");
const { createWebSocketProxy } = require("./utils/ws-proxy");
const { storeCookies, getCookieHeader } = require("./utils/cookie-handler");

const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/proxy", (req, res) => {
  let target = req.query.url || "";
  if (!target.match(/^https?:\/\//)) {
    target = target.includes(".")
      ? "http://" + target
      : "https://duckduckgo.com/?q=" + encodeURIComponent(target);
  }

  const urlObj = new URL(target);
  const clientHeaders = {
    "User-Agent": "Mozilla/5.0",
    Referer: req.headers.referer || "",
    Cookie: getCookieHeader(urlObj.hostname) || "",
  };

  const lib = target.startsWith("https") ? https : http;

  lib
    .get(urlObj, { headers: clientHeaders }, (response) => {
      const contentType = response.headers["content-type"] || "";

      if (
        [301, 302, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        const loc = new URL(response.headers.location, urlObj).href;
        return res.redirect("/proxy?url=" + encodeURIComponent(loc));
      }

      if (response.headers["set-cookie"]) {
        storeCookies(urlObj.hostname, response.headers["set-cookie"]);
      }

      if (contentType.includes("text/html") || contentType.includes("text/css")) {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => {
          if (contentType.includes("text/html")) {
            res.set("content-type", "text/html");
            res.send(rewriteHTML(body, urlObj));
          } else {
            res.set("content-type", "text/css");
            res.send(rewriteCSS(body, urlObj));
          }
        });
      } else if (contentType.includes("application/javascript")) {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => {
          // Rewrite URLs inside JS string literals
          const rewritten = body.replace(/(['"])(https?:\/\/[^'"]+)\1/g, (match, quote, url) => {
            return `${quote}/proxy?url=${encodeURIComponent(url)}${quote}`;
          });
          res.set("content-type", "application/javascript");
          res.send(rewritten);
        });
      } else {
        // Stream other content types directly (media, binary, etc)
        res.set("content-type", contentType);
        response.pipe(res);
      }
    })
    .on("error", () => res.status(500).send("Proxy error"));
});

const server = http.createServer(app);
createWebSocketProxy(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Proxy server running on port", PORT));
