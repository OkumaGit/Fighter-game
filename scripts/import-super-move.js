import fs from "fs";
import path from "path";
import sharp from "sharp";
import { execFileSync } from "child_process";

const RESOURCES_BASE_DIR = path.resolve("client/resources/fighters");
const ASSETS_BASE_DIR = path.resolve("client/src/assets/fighters");
const TARGET_SIZE = 820;
const NUM_FRAMES = 8;
const UPSCAYL_BIN = "C:/Program Files/Upscayl/resources/bin/upscayl-bin.exe";
const UPSCAYL_MODELS = "C:/Program Files/Upscayl/resources/models";

const FIGHTER_CONFIGS = {
  1: {
    name: "Astra",
    upscaledPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/Upscaled/fire_sprite_fighter_1_upscayl_2x_digital-art-4x.png",
    rawPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/fire_sprite_fighter_1.png",
    cleanFrame: (f, x, y, fw, fh) => {
      // Frame 2: flame spillover from Frame 3 at x > 620
      if (f === 2 && x > 620) return true;
      // Frame 3: flame spillover from Frame 4 at x > 620
      if (f === 3 && x > 620) return true;
      return false;
    },
  },
  2: {
    name: "Kite",
    upscaledPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/Upscaled/green_plasma_sprite_fighter_2_upscayl_2x_digital-art-4x.png",
    rawPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/green_plasma_sprite_fighter_2.png",
    cleanFrame: null,
  },
  4: {
    name: "Brute",
    upscaledPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/Upscaled/sprite_super_moves_upscayl_2x_digital-art-4x.png",
    rawPath:
      "C:/Users/Student/Dev/fighter-game-assets/Moves 11/super_attack_fighter_4.png",
    cleanFrame: (f, x, y, fw, fh) => {
      if (f === 4 && x > 600) return true;
      if (f === 6 && x < 80 && y < 450) return true;
      return false;
    },
  },
};

/**
 * Ensure 2x upscaled sprite sheet is available, generating it via Upscayl if needed.
 */
function ensureUpscaledSheet(config) {
  if (fs.existsSync(config.upscaledPath)) {
    return config.upscaledPath;
  }
  if (!fs.existsSync(config.rawPath)) {
    throw new Error(`Raw sprite not found at ${config.rawPath}`);
  }
  if (!fs.existsSync(UPSCAYL_BIN)) {
    console.warn(
      `Upscayl binary not found, using raw image: ${config.rawPath}`,
    );
    return config.rawPath;
  }

  console.log(`🚀 Upscaling ${config.rawPath} with digital-art-4x (2x)...`);
  fs.mkdirSync(path.dirname(config.upscaledPath), { recursive: true });
  execFileSync(
    UPSCAYL_BIN,
    [
      "-i",
      config.rawPath,
      "-o",
      config.upscaledPath,
      "-m",
      UPSCAYL_MODELS,
      "-n",
      "digital-art-4x",
      "-s",
      "2",
      "-f",
      "png",
    ],
    { stdio: "inherit" },
  );
  return config.upscaledPath;
}

/**
 * Process a single fighter's Super attack animation.
 */
async function importFighterSuper(fighterId) {
  const config = FIGHTER_CONFIGS[fighterId];
  if (!config) {
    throw new Error(
      `No super move configuration found for fighter ${fighterId}`,
    );
  }

  const inputPath = ensureUpscaledSheet(config);
  console.log(
    `\n🥊 Processing Super Move for [${config.name}] (fighter_${fighterId})...`,
  );
  console.log(`📂 Source: ${inputPath}`);

  const image = sharp(inputPath);
  const meta = await image.metadata();
  const rawFull = await image.raw().toBuffer();
  const width = meta.width;
  const height = meta.height;

  console.log(`📐 Dimensions: ${width}x${height}px, ${NUM_FRAMES} frames`);

  // Build row-by-row background gradient model
  const bgModel = [];
  for (let y = 0; y < height; y += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    const sampleXs = [5, 15, 25, 35, 45];
    for (const x of sampleXs) {
      const idx = (y * width + x) * 3;
      r += rawFull[idx];
      g += rawFull[idx + 1];
      b += rawFull[idx + 2];
    }
    bgModel.push([
      r / sampleXs.length,
      g / sampleXs.length,
      b / sampleXs.length,
    ]);
  }

  const colWidth = width / NUM_FRAMES;
  const processedFrames = [];

  for (let f = 0; f < NUM_FRAMES; f += 1) {
    const left = Math.round(f * colWidth);
    const right = Math.round((f + 1) * colWidth);
    const fw = right - left;
    const fh = height;

    const frameBuf = await sharp(inputPath)
      .extract({ left, top: 0, width: fw, height: fh })
      .raw()
      .toBuffer();

    function isBg(x, y) {
      const idx = (y * fw + x) * 3;
      const r = frameBuf[idx];
      const g = frameBuf[idx + 1];
      const b = frameBuf[idx + 2];
      const exp = bgModel[y];
      return (
        Math.abs(r - exp[0]) <= 6 &&
        Math.abs(g - exp[1]) <= 6 &&
        Math.abs(b - exp[2]) <= 6
      );
    }

    const visited = new Uint8Array(fw * fh);
    const isTransparent = new Uint8Array(fw * fh);

    for (let y = 0; y < fh; y += 1) {
      for (let x = 0; x < fw; x += 1) {
        const idx = y * fw + x;
        if (!visited[idx] && isBg(x, y)) {
          const queue = [x, y];
          visited[idx] = 1;
          const compPixels = [idx];
          let head = 0;
          let touchesBorder = false;

          while (head < queue.length) {
            const qx = queue[head];
            head += 1;
            const qy = queue[head];
            head += 1;

            if (qx === 0 || qx === fw - 1 || qy === 0 || qy === fh - 1) {
              touchesBorder = true;
            }

            const nbrs = [
              [qx + 1, qy],
              [qx - 1, qy],
              [qx, qy + 1],
              [qx, qy - 1],
            ];
            for (let i = 0; i < 4; i += 1) {
              const nx = nbrs[i][0];
              const ny = nbrs[i][1];
              if (nx >= 0 && nx < fw && ny >= 0 && ny < fh) {
                const nIdx = ny * fw + nx;
                if (!visited[nIdx] && isBg(nx, ny)) {
                  visited[nIdx] = 1;
                  compPixels.push(nIdx);
                  queue.push(nx, ny);
                }
              }
            }
          }

          if (touchesBorder || compPixels.length >= 150) {
            for (let i = 0; i < compPixels.length; i += 1) {
              isTransparent[compPixels[i]] = 1;
            }
          }
        }
      }
    }

    // Apply frame-specific boundary cleanup
    if (config.cleanFrame) {
      for (let y = 0; y < fh; y += 1) {
        for (let x = 0; x < fw; x += 1) {
          if (config.cleanFrame(f, x, y, fw, fh)) {
            isTransparent[y * fw + x] = 1;
          }
        }
      }
    }

    const rgba = Buffer.alloc(fw * fh * 4);
    for (let i = 0; i < fw * fh; i += 1) {
      rgba[i * 4] = frameBuf[i * 3];
      rgba[i * 4 + 1] = frameBuf[i * 3 + 1];
      rgba[i * 4 + 2] = frameBuf[i * 3 + 2];
      rgba[i * 4 + 3] = isTransparent[i] ? 0 : 255;
    }

    const framePng = await sharp(rgba, {
      raw: { width: fw, height: fh, channels: 4 },
    })
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    processedFrames.push(framePng);
    console.log(`  ✓ Frame ${f + 1}/${NUM_FRAMES} processed (820x820 contain)`);
  }

  // Save individual frames
  const fighterFolder = `fighter_${fighterId}_sprite`;
  const superDir = path.join(RESOURCES_BASE_DIR, fighterFolder, "Super");
  fs.mkdirSync(superDir, { recursive: true });

  for (let f = 0; f < NUM_FRAMES; f += 1) {
    const frameNum = f + 1;
    const targetPath = path.join(superDir, `Super_${frameNum}.png`);
    fs.writeFileSync(targetPath, processedFrames[f]);
  }
  console.log(`  ✓ Saved 8 Super frames in ${superDir}`);

  // Composite horizontal WebP strip (6560x820)
  const totalStripWidth = TARGET_SIZE * NUM_FRAMES;
  const compositeList = processedFrames.map((buf, index) => ({
    input: buf,
    left: index * TARGET_SIZE,
    top: 0,
  }));

  const webpBuffer = await sharp({
    create: {
      width: totalStripWidth,
      height: TARGET_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .webp({ quality: 90 })
    .toBuffer();

  const fighterResourcesDir = path.join(RESOURCES_BASE_DIR, fighterFolder);
  const fighterAssetsDir = path.join(ASSETS_BASE_DIR, `fighter_${fighterId}`);

  fs.mkdirSync(fighterResourcesDir, { recursive: true });
  fs.mkdirSync(fighterAssetsDir, { recursive: true });

  fs.writeFileSync(path.join(fighterResourcesDir, "super.webp"), webpBuffer);
  fs.writeFileSync(path.join(fighterAssetsDir, "super.webp"), webpBuffer);

  const manifestPaths = [
    path.join(fighterResourcesDir, "manifest.json"),
    path.join(fighterAssetsDir, "manifest.json"),
  ];

  for (const mPath of manifestPaths) {
    let manifest = { fighter: `fighter_${fighterId}`, animations: {} };
    if (fs.existsSync(mPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(mPath, "utf8"));
      } catch {
        // Keep default manifest on error
      }
    }
    manifest.animations = manifest.animations || {};
    manifest.animations.super = {
      file: "super.webp",
      frames: NUM_FRAMES,
      frameWidth: TARGET_SIZE,
      frameHeight: TARGET_SIZE,
      totalWidth: totalStripWidth,
    };
    fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2));
  }

  const sizeKb = (webpBuffer.length / 1024).toFixed(1);
  console.log(
    `  ✓ Deployed super.webp (${sizeKb} KB) and manifest for fighter_${fighterId}`,
  );
}

async function main() {
  const targetId = process.argv[2] || "1";
  if (targetId === "all") {
    for (const id of Object.keys(FIGHTER_CONFIGS)) {
      await importFighterSuper(id);
    }
  } else {
    await importFighterSuper(targetId);
  }
  console.log("\n✨ Super move import completed successfully!");
}

main().catch((err) => {
  console.error("❌ Super move import failed:", err);
  process.exit(1);
});
