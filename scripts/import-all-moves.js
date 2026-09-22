import fs from "fs";
import path from "path";
import sharp from "sharp";

const BASE_ASSETS_DIR = path.resolve(
  "client/resources/fighters/fighter-game-assets",
);
const OUTPUT_BASE_DIR = path.resolve("client/resources/fighters");

const FIGHTER_SHEETS = [
  {
    id: "1",
    name: "Astra",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_8ao8zn8ao8zn8ao8 1_upscayl_2x_digital-art-4x.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_43qu5o43qu5o43qu_fighter_1.png",
    g3: "Moves 10-15/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_xajrh2xajrh2xajr_fighter_1.png",
  },
  {
    id: "2",
    name: "Kite",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_vr6vfqvr6vfqvr6v 2.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_laculklaculklacu_fighter_2.png",
    g3: "Moves 10-15/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_zcpruczcpruczcpr_fighter_2.png",
  },
  {
    id: "3",
    name: "Vex",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_xja0kaxja0kaxja0 3.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_2s72cf2s72cf2s72_fighter_4.png",
    g3: "Moves 10-15/Gemini_Generated_Image_pv8m85pv8m85pv8m_fighter_3.jpg",
  },
  {
    id: "4",
    name: "Brute",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image28ao8zn8ao8 4.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_8z18j88z18j88z18_fighter_3.png",
    g3: "Moves 10-15/Gemini_Generated_Image_g2tcw2g2tcw2g2tc_fighter_4.jpg",
  },
  {
    id: "5",
    name: "Nova",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image28ao8zn8ao8 5.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_o1tf1ho1tf1ho1tf_fighter_5.png",
    g3: "Moves 10-15/Gemini_Generated_Image_klodqmklodqmklod_fighter_5.jpg",
  },
  {
    id: "6",
    name: "Rift",
    g1: "Moves 1-5/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image28ao8zn8ao8 6.png",
    g2: "Moves 6-10/upscayl_png_digital-art-4x_2x/Gemini_Generated_Image_fjx1zefjx1zefjx1_fighter_6.png",
    g3: "Moves 10-15/Gemini_Generated_Image_soskdhsoskdhsosk_fighter_6.jpg",
  },
];

const GROUPS = [
  {
    key: "g1",
    name: "Moves 1-5",
    hasAlpha: true,
    rows: ["Idle", "Jab", "Kick", "Block", "Jump"],
  },
  {
    key: "g2",
    name: "Moves 6-10",
    hasAlpha: false,
    rows: ["Hit", "Uppercut", "Fall", "GetUp", "Death"],
  },
  {
    key: "g3",
    name: "Moves 10-15",
    hasAlpha: false,
    rows: ["Sweep", "Special", "Walk", "JumpKick", "Dizzy"],
  },
];

const COLS = 8;
const ROWS = 5;
const TARGET_SIZE = 820;
const BLACK_THRESHOLD = 22;

/**
 * Remove outer black background using BFS flood-fill from border pixels.
 * Preserves dark pixels inside the character silhouette.
 */
function removeBlackBackground(data, w, h) {
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Enqueue all boundary pixels
  for (let x = 0; x < w; x += 1) {
    queue.push(x, 0);
    queue.push(x, h - 1);
    visited[x] = 1;
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 0; y < h; y += 1) {
    queue.push(0, y);
    queue.push(w - 1, y);
    visited[y * w] = 1;
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head];
    head += 1;
    const y = queue[head];
    head += 1;

    const idx = (y * w + x) * 3;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (let i = 0; i < neighbors.length; i += 1) {
        const [nx, ny] = neighbors[i];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nIdx = ny * w + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const nr = data[nIdx * 3];
            const ng = data[nIdx * 3 + 1];
            const nb = data[nIdx * 3 + 2];
            if (
              nr <= BLACK_THRESHOLD &&
              ng <= BLACK_THRESHOLD &&
              nb <= BLACK_THRESHOLD
            ) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;

    if (
      visited[i] &&
      r <= BLACK_THRESHOLD &&
      g <= BLACK_THRESHOLD &&
      b <= BLACK_THRESHOLD
    ) {
      rgba[i * 4 + 3] = 0;
    } else {
      rgba[i * 4 + 3] = 255;
    }
  }

  return rgba;
}

async function processSheet(fighter, group) {
  const inputPath = path.join(BASE_ASSETS_DIR, fighter[group.key]);
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️ File not found: ${inputPath}`);
    return;
  }

  console.log(
    `  Processing [${fighter.name} (id:${fighter.id})] -> ${group.name}...`,
  );
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const totalWidth = metadata.width;
  const totalHeight = metadata.height;
  const colWidth = totalWidth / COLS;
  const rowHeight = totalHeight / ROWS;

  const fighterDir = path.join(OUTPUT_BASE_DIR, `fighter_${fighter.id}_sprite`);

  for (let r = 0; r < ROWS; r += 1) {
    const actionName = group.rows[r];
    const actionDir = path.join(fighterDir, actionName);
    fs.mkdirSync(actionDir, { recursive: true });

    const rowTop = Math.round(r * rowHeight);
    const actualRowHeight = Math.round((r + 1) * rowHeight) - rowTop;

    for (let c = 0; c < COLS; c += 1) {
      const colLeft = Math.round(c * colWidth);
      const actualColWidth = Math.round((c + 1) * colWidth) - colLeft;

      let frameBuffer;

      if (group.hasAlpha) {
        frameBuffer = await sharp(inputPath)
          .extract({
            left: colLeft,
            top: rowTop,
            width: actualColWidth,
            height: actualRowHeight,
          })
          .resize(TARGET_SIZE, TARGET_SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      } else {
        const rawExtract = await sharp(inputPath)
          .extract({
            left: colLeft,
            top: rowTop,
            width: actualColWidth,
            height: actualRowHeight,
          })
          .raw()
          .toBuffer({ resolveWithObject: true });

        const transparentRgba = removeBlackBackground(
          rawExtract.data,
          rawExtract.info.width,
          rawExtract.info.height,
        );

        frameBuffer = await sharp(transparentRgba, {
          raw: {
            width: rawExtract.info.width,
            height: rawExtract.info.height,
            channels: 4,
          },
        })
          .resize(TARGET_SIZE, TARGET_SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      }

      const frameNumber = c + 1;
      const targetFilePath = path.join(
        actionDir,
        `${actionName}_${frameNumber}.png`,
      );
      fs.writeFileSync(targetFilePath, frameBuffer);
    }
  }
}

async function main() {
  const startTime = Date.now();
  const filterArg = process.argv[2];
  const groupArg = process.argv[3];
  const targetIds = filterArg ? filterArg.split(",") : null;
  const listToProcess = targetIds
    ? FIGHTER_SHEETS.filter((f) => targetIds.includes(f.id))
    : FIGHTER_SHEETS;
  const groupsToProcess = groupArg
    ? GROUPS.filter((g) => g.key === groupArg)
    : GROUPS;

  console.log(
    `🚀 Starting import of moves for ${listToProcess.length} fighter(s) and ${groupsToProcess.length} group(s)...\n`,
  );

  for (let f = 0; f < listToProcess.length; f += 1) {
    const fighter = listToProcess[f];
    console.log(
      `🥊 [${f + 1}/${listToProcess.length}] Importing Fighter ${fighter.id} (${fighter.name})...`,
    );
    for (let g = 0; g < groupsToProcess.length; g += 1) {
      await processSheet(fighter, groupsToProcess[g]);
    }
    console.log(`✅ Fighter ${fighter.name} completed.\n`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Selected sheets sliced and imported in ${durationSec}s!`);
}

main().catch((err) => {
  console.error("❌ Error during import:", err);
  process.exit(1);
});
