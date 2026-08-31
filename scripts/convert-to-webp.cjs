const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const QUALITY = 88; // high quality — near-visually lossless for photos

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jpe?g|png)$/i.test(e.name)) out.push(p);
  }
  return out;
}

function webpName(file) {
  const dir = path.dirname(file);
  let base = path.basename(file).replace(/\.(jpe?g|png)$/i, "");
  base = base.replace(/^Artboard\s+/i, "artboard-").replace(/\s+/g, "-").toLowerCase();
  return path.join(dir, base + ".webp");
}

async function convertFile(src) {
  const dest = webpName(src);
  if (path.resolve(src) === path.resolve(dest)) {
    return { src, skipped: true, reason: "same-path" };
  }
  const inSize = fs.statSync(src).size;
  await sharp(src)
    .rotate()
    .webp({ quality: QUALITY, effort: 5, smartSubsample: true })
    .toFile(dest);
  const outSize = fs.statSync(dest).size;
  if (outSize >= inSize * 0.98) {
    fs.unlinkSync(dest);
    return { src, skipped: true, reason: "no-gain", inSize, outSize };
  }
  return { src, dest, inSize, outSize, saved: inSize - outSize };
}

async function main() {
  const roots = [
    "public/lookbook",
    "public/assets/empty_centre.jpg",
    "public/banners",
    "public/assets/products",
  ];

  let files = [];
  for (const r of roots) {
    if (fs.existsSync(r) && fs.statSync(r).isFile()) files.push(r);
    else files = files.concat(walk(r));
  }

  files = files.filter((f) => fs.statSync(f).size >= 80 * 1024);

  console.log("Converting", files.length, "images at webp q=" + QUALITY);
  const results = [];
  for (const f of files) {
    try {
      const r = await convertFile(f);
      results.push(r);
      if (r.skipped) console.log("SKIP", path.relative(".", f), r.reason || "");
      else
        console.log(
          "OK",
          ((r.outSize / r.inSize) * 100).toFixed(0) + "%",
          (r.saved / 1024).toFixed(0) + "KB",
          "->",
          path.relative(".", r.dest)
        );
    } catch (e) {
      console.error("FAIL", f, e.message);
      results.push({ src: f, error: e.message });
    }
  }

  const ok = results.filter((r) => r.dest);
  const saved = ok.reduce((n, r) => n + r.saved, 0);
  console.log("\nDONE", ok.length, "files,", (saved / 1024 / 1024).toFixed(1), "MB saved");

  fs.mkdirSync("scripts", { recursive: true });
  fs.writeFileSync(
    "scripts/.webp-convert-report.json",
    JSON.stringify(
      {
        quality: QUALITY,
        results: ok.map((r) => ({
          src: r.src.replace(/\\/g, "/"),
          dest: r.dest.replace(/\\/g, "/"),
        })),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
