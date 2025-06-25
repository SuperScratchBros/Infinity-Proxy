function rewriteHTML(html, baseUrl) {
  return html
    .replace(/(href|src|action)=["'](.*?)["']/g, (match, attr, val) => {
      const newUrl = new URL(val, baseUrl).href;
      return `${attr}="/proxy?url=${encodeURIComponent(newUrl)}"`;
    })
    .replace(/<head(.*?)>/, `<head$1><script src="/inject.js"></script>`);
}

function rewriteCSS(css, baseUrl) {
  return css.replace(/url\(['"]?(.*?)['"]?\)/g, (match, val) => {
    const newUrl = new URL(val, baseUrl).href;
    return `url("/proxy?url=${encodeURIComponent(newUrl)}")`;
  });
}

module.exports = { rewriteHTML, rewriteCSS };
