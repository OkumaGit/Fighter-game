import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const EXTERNAL_PATH = 'C:/Users/Student/Dev/fighter-game-assets/Moves 11/Upscaled/sprite_super_moves_upscayl_2x_digital-art-4x.png';
const LOCAL_PATH = path.resolve('client/resources/fighters/fighter-game-assets/Moves 11/Upscaled/sprite_super_moves_upscayl_2x_digital-art-4x.png');

const INPUT_PATH = fs.existsSync(EXTERNAL_PATH) ? EXTERNAL_PATH : LOCAL_PATH;
const RESOURCES_BASE_DIR = path.resolve('client/resources/fighters');
const ASSETS_BASE_DIR = path.resolve('client/src/assets/fighters');

const FIGHTER_IDS = ['1', '2', '3', '4', '5', '6'];
const TARGET_SIZE = 820;
const NUM_FRAMES = 8;

async function processSuperMove() {
    console.log('⚡ Starting Super Move import...');
    console.log(`📂 Source: ${INPUT_PATH}`);

    if (!fs.existsSync(INPUT_PATH)) {
        console.error(`❌ Source image not found at ${INPUT_PATH}`);
        process.exit(1);
    }

    const image = sharp(INPUT_PATH);
    const meta = await image.metadata();
    const rawFull = await image.raw().toBuffer();
    const width = meta.width;
    const height = meta.height;

    console.log(`📐 Image Dimensions: ${width}x${height}px, 8 frames`);

    // 1. Compute precise background gradient model for each row y
    const bgModel = [];
    for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0;
        const sampleXs = [5, 15, 25, 35, 45];
        for (const x of sampleXs) {
            const idx = (y * width + x) * 3;
            r += rawFull[idx];
            g += rawFull[idx + 1];
            b += rawFull[idx + 2];
        }
        bgModel.push([r / sampleXs.length, g / sampleXs.length, b / sampleXs.length]);
    }

    const colWidth = width / NUM_FRAMES;
    const processedFrameBuffers = [];

    for (let f = 0; f < NUM_FRAMES; f++) {
        const left = Math.round(f * colWidth);
        const right = Math.round((f + 1) * colWidth);
        const fw = right - left;
        const fh = height;

        const frameBuf = await sharp(INPUT_PATH)
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
                Math.abs(r - exp[0]) <= 5 &&
                Math.abs(g - exp[1]) <= 5 &&
                Math.abs(b - exp[2]) <= 5
            );
        }

        const visited = new Uint8Array(fw * fh);
        const isTransparent = new Uint8Array(fw * fh);

        for (let y = 0; y < fh; y++) {
            for (let x = 0; x < fw; x++) {
                const idx = y * fw + x;
                if (!visited[idx] && isBg(x, y)) {
                    const queue = [x, y];
                    visited[idx] = 1;
                    const compPixels = [idx];
                    let head = 0;
                    let touchesBorder = false;

                    while (head < queue.length) {
                        const qx = queue[head++];
                        const qy = queue[head++];
                        if (qx === 0 || qx === fw - 1 || qy === 0 || qy === fh - 1) {
                            touchesBorder = true;
                        }

                        const nbrs = [
                            [qx + 1, qy],
                            [qx - 1, qy],
                            [qx, qy + 1],
                            [qx, qy - 1]
                        ];
                        for (let i = 0; i < 4; i++) {
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

                    // Mark background if it touches image border OR is an enclosed background pocket (>= 150px)
                    if (touchesBorder || compPixels.length >= 150) {
                        for (let i = 0; i < compPixels.length; i++) {
                            isTransparent[compPixels[i]] = 1;
                        }
                    }
                }
            }
        }

        // Clean boundary spillover from oversized Frame 5
        if (f === 4) {
            // Frame 4: spillover from Frame 5 on right border
            for (let y = 0; y < fh; y++) {
                for (let x = 600; x < fw; x++) {
                    isTransparent[y * fw + x] = 1;
                }
            }
        }
        if (f === 6) {
            // Frame 6: spillover from Frame 5 on left upper border
            for (let y = 0; y < fh; y++) {
                for (let x = 0; x < 80; x++) {
                    if (y < 450) {
                        isTransparent[y * fw + x] = 1;
                    }
                }
            }
        }

        const rgba = Buffer.alloc(fw * fh * 4);
        for (let i = 0; i < fw * fh; i++) {
            rgba[i * 4] = frameBuf[i * 3];
            rgba[i * 4 + 1] = frameBuf[i * 3 + 1];
            rgba[i * 4 + 2] = frameBuf[i * 3 + 2];
            rgba[i * 4 + 3] = isTransparent[i] ? 0 : 255;
        }

        // Resize each frame to standard 820x820 contain with transparent background
        const finalPngBuffer = await sharp(rgba, {
            raw: { width: fw, height: fh, channels: 4 }
        })
            .resize(TARGET_SIZE, TARGET_SIZE, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        processedFrameBuffers.push(finalPngBuffer);
        console.log(`  ✓ Processed frame ${f + 1}/8 (contained 820x820)`);
    }

    // 2. Distribute frames to all 6 fighters in client/resources/fighters/fighter_${id}_sprite/Super/
    console.log('\n📦 Saving Super move frames to all 6 fighters...');
    for (const id of FIGHTER_IDS) {
        const fighterFolder = `fighter_${id}_sprite`;
        const superDir = path.join(RESOURCES_BASE_DIR, fighterFolder, 'Super');
        fs.mkdirSync(superDir, { recursive: true });

        for (let f = 0; f < NUM_FRAMES; f++) {
            const frameNum = f + 1;
            const targetPath = path.join(superDir, `Super_${frameNum}.png`);
            fs.writeFileSync(targetPath, processedFrameBuffers[f]);
        }
        console.log(`  ✓ Saved 8 Super frames for fighter_${id}`);
    }

    // 3. Composite horizontal 8-frame WebP spritesheet (6560x820)
    console.log('\n🎞️ Generating super.webp strips for all 6 fighters...');
    const totalStripWidth = TARGET_SIZE * NUM_FRAMES;
    const compositeList = processedFrameBuffers.map((buf, index) => ({
        input: buf,
        left: index * TARGET_SIZE,
        top: 0
    }));

    const webpBuffer = await sharp({
        create: {
            width: totalStripWidth,
            height: TARGET_SIZE,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite(compositeList)
        .webp({ quality: 90 })
        .toBuffer();

    console.log(`  ✓ Built 6560x820 WebP strip (${(webpBuffer.length / 1024).toFixed(1)} KB)`);

    for (const id of FIGHTER_IDS) {
        const fighterResourcesDir = path.join(RESOURCES_BASE_DIR, `fighter_${id}_sprite`);
        const fighterAssetsDir = path.join(ASSETS_BASE_DIR, `fighter_${id}`);

        fs.mkdirSync(fighterResourcesDir, { recursive: true });
        fs.mkdirSync(fighterAssetsDir, { recursive: true });

        // Save WebP strip in both locations
        fs.writeFileSync(path.join(fighterResourcesDir, 'super.webp'), webpBuffer);
        fs.writeFileSync(path.join(fighterAssetsDir, 'super.webp'), webpBuffer);

        // Update manifest.json in both locations
        const manifestPaths = [
            path.join(fighterResourcesDir, 'manifest.json'),
            path.join(fighterAssetsDir, 'manifest.json')
        ];

        for (const mPath of manifestPaths) {
            let manifest = { fighter: `fighter_${id}`, animations: {} };
            if (fs.existsSync(mPath)) {
                try {
                    manifest = JSON.parse(fs.readFileSync(mPath, 'utf8'));
                } catch {
                    // Ignore parse error and keep default
                }
            }
            manifest.animations = manifest.animations || {};
            manifest.animations.super = {
                file: 'super.webp',
                frames: NUM_FRAMES,
                frameWidth: TARGET_SIZE,
                frameHeight: TARGET_SIZE,
                totalWidth: totalStripWidth
            };
            fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2));
        }

        console.log(`  ✓ Deployed super.webp & manifest for fighter_${id}`);
    }

    console.log('\n✨ Super move import completed successfully!');
}

processSuperMove().catch(err => {
    console.error('❌ Super move import failed:', err);
    process.exit(1);
});
