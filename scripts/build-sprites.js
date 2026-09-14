import fs from "fs";
import path from "path";
import sharp from "sharp";

// Paths relative to project root
const INPUT_DIR = fs.existsSync(path.resolve("client/resources/fighters"))
  ? path.resolve("client/resources/fighters")
  : path.resolve("resources/fighters");

const ASSETS_OUTPUT_DIR = path.resolve("client/src/assets/fighters");
const RESOURCES_OUTPUT_DIR = fs.existsSync(
  path.resolve("client/resources/fighters"),
)
  ? path.resolve("client/resources/fighters")
  : path.resolve("resources/fighters");

/**
 * Extract numerical index from frame file name (e.g. 'Idle_1.png' -> 1).
 */
function extractFrameNumber(filename) {
  const match =
    filename.match(/_(\d+)\.png$/i) || filename.match(/(\d+)\.png$/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Composite individual frames into a single horizontal WebP spritesheet strip.
 */
async function stitchFrames(actionPath, outputFiles) {
  // Read and sort files numerically by frame index (Idle_1.png, Idle_2.png...)
  const files = fs
    .readdirSync(actionPath)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .sort((a, b) => extractFrameNumber(a) - extractFrameNumber(b));

  if (files.length === 0) return null;

  // Read metadata from the first frame to establish uniform width and height
  const firstFrameMetadata = await sharp(
    path.join(actionPath, files[0]),
  ).metadata();
  const frameWidth = firstFrameMetadata.width || 820;
  const frameHeight = firstFrameMetadata.height || 820;
  const totalWidth = frameWidth * files.length;

  // Prepare horizontal composite coordinates
  const compositeList = await Promise.all(
    files.map(async (file, index) => ({
      input: await sharp(path.join(actionPath, file))
        .resize(frameWidth, frameHeight)
        .toBuffer(),
      left: index * frameWidth,
      top: 0,
    })),
  );

  // Generate WebP buffer with transparent background
  const webpBuffer = await sharp({
    create: {
      width: totalWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .webp({ quality: 90 })
    .toBuffer();

  // Save to all target destination paths
  for (const outputFile of outputFiles) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, webpBuffer);
  }

  const sizeKb = (webpBuffer.length / 1024).toFixed(1);
  return {
    frames: files.length,
    frameWidth,
    frameHeight,
    totalWidth,
    sizeKb,
  };
}

/**
 * Scan all fighter folders and generate WebP spritesheets for each action pose.
 */
async function buildAllSprites() {
  const startTime = Date.now();
  console.log("🎮 Starting WebP sprite builder...");
  console.log(`📂 Source directory: ${INPUT_DIR}`);

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  const fighterFolders = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => fs.statSync(path.join(INPUT_DIR, f)).isDirectory());

  let totalStrips = 0;
  let totalFrames = 0;

  for (const fighter of fighterFolders) {
    const fighterPath = path.join(INPUT_DIR, fighter);
    const fighterName = fighter.replace("_sprite", "");

    // Output target directories
    const targetAssetsDir = path.join(ASSETS_OUTPUT_DIR, fighterName);
    const targetResourcesDir = path.join(RESOURCES_OUTPUT_DIR, fighter);

    const actions = fs
      .readdirSync(fighterPath)
      .filter((a) => fs.statSync(path.join(fighterPath, a)).isDirectory());

    console.log(
      `\n🥊 Processing [${fighterName}] (${actions.length} animations):`,
    );

    const manifest = {
      fighter: fighterName,
      animations: {},
    };

    for (const action of actions) {
      const actionPath = path.join(fighterPath, action);
      const actionName = action.toLowerCase();
      const filename = `${actionName}.webp`;

      const outputFiles = [
        path.join(targetAssetsDir, filename),
        path.join(targetResourcesDir, filename),
      ];

      const result = await stitchFrames(actionPath, outputFiles);
      if (result) {
        totalStrips += 1;
        totalFrames += result.frames;
        manifest.animations[actionName] = {
          file: filename,
          frames: result.frames,
          frameWidth: result.frameWidth,
          frameHeight: result.frameHeight,
          totalWidth: result.totalWidth,
        };

        console.log(
          `  ✓ ${actionName.padEnd(8)}: ${result.frames} frames -> ${filename} (${result.totalWidth}x${result.frameHeight}px, ${result.sizeKb} KB)`,
        );
      }
    }

    // Write animation manifest for this fighter
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(path.join(targetAssetsDir, "manifest.json"), manifestJson);
    fs.writeFileSync(
      path.join(targetResourcesDir, "manifest.json"),
      manifestJson,
    );
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Build completed in ${durationSec}s!`);
  console.log(
    `📊 Summary: ${totalStrips} WebP strips created from ${totalFrames} source frames.`,
  );
}

buildAllSprites().catch((err) => {
  console.error("❌ Sprite build failed:", err);
  process.exit(1);
});
