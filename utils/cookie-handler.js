// Simple cookie jar handler to store and send cookies per hostname

const cookieJar = {};

// Parse `Set-Cookie` header and store cookies by hostname
function storeCookies(hostname, setCookieHeaders) {
  if (!setCookieHeaders) return;
  if (!cookieJar[hostname]) cookieJar[hostname] = {};

  setCookieHeaders.forEach((cookieStr) => {
    const [cookiePair] = cookieStr.split(";"); // Take only first part (key=value)
    const [key, val] = cookiePair.split("=");
    if (key && val) {
      cookieJar[hostname][key.trim()] = val.trim();
    }
  });
}

// Generate `Cookie` header string for requests to hostname
function getCookieHeader(hostname) {
  if (!cookieJar[hostname]) return "";
  return Object.entries(cookieJar[hostname])
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

module.exports = { storeCookies, getCookieHeader };
