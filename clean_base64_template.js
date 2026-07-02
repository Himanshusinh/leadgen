const fs = require('fs');
const path = require('path');

function main() {
  const filePath = path.join(__dirname, 'email_template.html');
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  console.log("Original HTML size:", html.length);

  // 1. Replace base64 image in src with hosted unsplash image
  const base64Regex = /src="data:image\/jpeg;base64,[A-Za-z0-9+/=\s\n\r]+"/;
  const unsplashUrl = 'src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=640&q=80"';

  if (base64Regex.test(html)) {
    html = html.replace(base64Regex, unsplashUrl);
    console.log("Replaced base64 hero image with hosted Unsplash image.");
  } else {
    console.log("Base64 regex did not match. Trying fallback regex.");
    // Fallback regex to match src="data:..." in case of formatting variations
    const fallbackRegex = /src="data:image\/jpeg;base64,[^"]+"/;
    if (fallbackRegex.test(html)) {
      html = html.replace(fallbackRegex, unsplashUrl);
      console.log("Fallback matched and replaced.");
    } else {
      console.error("Could not find base64 image src in HTML!");
    }
  }

  // 2. Replace SVGs in .service-icon with hosted gold icons
  // Service 1: Drone Wedding Shows (heart)
  const svg1 = `<svg viewBox="0 0 24 24" fill="none">\n                            <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="#c9a227"\n                                stroke-width="1.4" />\n                            <circle cx="12" cy="10" r="2.3" stroke="#c9a227" stroke-width="1.4" />\n                        </svg>`;
  const img1 = `<img src="https://img.icons8.com/ios-glyphs/24/c9a227/like--v1.png" width="22" height="22" alt="Heart" style="display: block; border: 0;" />`;
  if (html.includes(svg1)) {
    html = html.replace(svg1, img1);
    console.log("Replaced SVG 1 (heart)");
  } else {
    // Try relaxed whitespace replacement
    const relaxed1 = /<svg viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>/;
    // We replace the first SVG matching Wedding Shows
    html = html.replace(relaxed1, img1);
    console.log("Replaced SVG 1 (relaxed match)");
  }

  // Service 2: Corporate & Brand Events (briefcase)
  const relaxed2 = /<svg viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>/;
  const img2 = `<img src="https://img.icons8.com/ios-glyphs/24/c9a227/briefcase.png" width="22" height="22" alt="Briefcase" style="display: block; border: 0;" />`;
  html = html.replace(relaxed2, img2);
  console.log("Replaced SVG 2 (relaxed match)");

  // Service 3: Custom Aerial Displays (star)
  const relaxed3 = /<svg viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>/;
  const img3 = `<img src="https://img.icons8.com/ios-glyphs/24/c9a227/star--v1.png" width="22" height="22" alt="Star" style="display: block; border: 0;" />`;
  html = html.replace(relaxed3, img3);
  console.log("Replaced SVG 3 (relaxed match)");

  // Service 4: End-to-End Execution (check/ok)
  const relaxed4 = /<svg viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>/;
  const img4 = `<img src="https://img.icons8.com/ios-glyphs/24/c9a227/ok--v1.png" width="22" height="22" alt="Check" style="display: block; border: 0;" />`;
  html = html.replace(relaxed4, img4);
  console.log("Replaced SVG 4 (relaxed match)");

  // 3. Make wrapper full width (fill width)
  const wrapperStyle = `        .wrapper {
            max-width: 640px;
            margin: 0 auto;
            background: #0a0a0c;
            border: 1px solid #232016;
        }`;
  const wrapperFullWidth = `        .wrapper {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background: #0a0a0c;
            border: 1px solid #232016;
        }`;
  if (html.includes(wrapperStyle)) {
    html = html.replace(wrapperStyle, wrapperFullWidth);
    console.log("Updated .wrapper CSS to make it full width.");
  } else {
    // Try relaxed regex for wrapper max-width replacement
    const wrapperRegex = /\.wrapper\s*\{([^}]+)\}/;
    const match = html.match(wrapperRegex);
    if (match) {
      let content = match[1];
      content = content.replace(/max-width:\s*\d+px;/, "width: 100%;\n            max-width: 100%;");
      html = html.replace(match[0], `.wrapper {${content}}`);
      console.log("Replaced wrapper styles via regex.");
    } else {
      console.error("Could not find .wrapper CSS rule!");
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log("Saved updated HTML. New size:", html.length);
}

main();
