"""
Process AI-generated fighter video into game-ready 12-frame spritesheets.
Keys out green background, despills edges, centers and grounds character,
extracts exactly 12 frames per animation, and generates WebP spritesheet strips.
"""

import os
import shutil
import json
import numpy as np
from PIL import Image
import imageio.v3 as iio

VIDEO_PATH = "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_1.mp4"
BASE_RESOURCES_DIR = "client/resources/fighters"
BASE_SRC_ASSETS_DIR = "client/src/assets/fighters"

FRAME_WIDTH = 820
FRAME_HEIGHT = 820
NUM_FRAMES = 12
SCALE = 1.20
TARGET_GROUND_Y = 805
TARGET_CENTER_X = 410
VIDEO_GROUND_Y = 682
VIDEO_CENTER_X = 612

ANIM_CONFIG = {
    'idle': {'range': (0, 15), 'folder': 'Idle', 'prefix': 'Idle'},
    'walk': {'range': (16, 34), 'folder': 'Walk', 'prefix': 'Walk'},
    'jab': {'range': (36, 47), 'folder': 'Jab', 'prefix': 'Jab'},
    'uppercut': {'range': (48, 58), 'folder': 'Uppercut', 'prefix': 'Uppercut'},
    'kick': {'range': (58, 72), 'folder': 'Kick', 'prefix': 'Kick'},
    'sweep': {'range': (72, 86), 'folder': 'Sweep', 'prefix': 'Sweep'},
    'jump': {'range': (86, 98), 'folder': 'Jump', 'prefix': 'Jump'},
    'jumpkick': {'range': (90, 103), 'folder': 'JumpKick', 'prefix': 'JumpKick'},
    'block': {'range': (104, 118), 'folder': 'Block', 'prefix': 'Block'},
    'special': {'range': (120, 138), 'folder': 'Special', 'prefix': 'Special'},
    'super': {'range': (140, 162), 'folder': 'Super', 'prefix': 'Super'},
    'hit': {'frames': [159, 160, 161, 162, 163, 163, 162, 161, 160, 159, 0, 1], 'folder': 'Hit', 'prefix': 'Hit'},
    'fall': {'range': (164, 178), 'folder': 'Fall', 'prefix': 'Fall'},
    'getup': {'range': (177, 191), 'folder': 'GetUp', 'prefix': 'GetUp'},
    'dizzy': {'range': (192, 216), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
    'death': {'range': (218, 239), 'folder': 'Death', 'prefix': 'Death'}
}


def key_and_transform_frame(raw_frame):
    """Applies chroma-key, despill, and grounds/centers into 820x820 frame."""
    arr = raw_frame.astype(np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    max_rb = np.maximum(r, b)
    diff = g - max_rb

    # Chroma key mask (soft edge)
    alpha = np.clip((40.0 - diff) / 30.0, 0.0, 1.0)

    # Despill green reflection on skin and clothing
    g_spill = np.maximum(0.0, g - max_rb)
    g_cleaned = g - g_spill * 0.9

    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(g_cleaned, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)

    keyed_img = Image.fromarray(rgba, 'RGBA')

    # Scaling
    new_w = int(arr.shape[1] * SCALE)
    new_h = int(arr.shape[0] * SCALE)
    scaled = keyed_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Offsets based on video camera baseline
    paste_x = int(TARGET_CENTER_X - VIDEO_CENTER_X * SCALE)
    paste_y = int(TARGET_GROUND_Y - VIDEO_GROUND_Y * SCALE)

    canvas = Image.new('RGBA', (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
    canvas.paste(scaled, (paste_x, paste_y), scaled)
    return canvas


def process_video():
    print(f"Loading video: {VIDEO_PATH}")
    # Read all video frames into memory
    frames = list(iio.imiter(VIDEO_PATH))
    total_video_frames = len(frames)
    print(f"Total video frames loaded: {total_video_frames}")

    f1_res_dir = os.path.join(BASE_RESOURCES_DIR, "fighter_1_sprite")
    f1_src_dir = os.path.join(BASE_SRC_ASSETS_DIR, "fighter_1")
    os.makedirs(f1_res_dir, exist_ok=True)
    os.makedirs(f1_src_dir, exist_ok=True)

    manifest_animations = {}

    for pose_name, cfg in ANIM_CONFIG.items():
        folder = cfg['folder']
        prefix = cfg['prefix']

        if 'frames' in cfg:
            indices = np.array(cfg['frames'], dtype=int)
        else:
            start, end = cfg['range']
            indices = np.linspace(start, end, NUM_FRAMES).round().astype(int)
        indices = np.clip(indices, 0, total_video_frames - 1)
        print(f"Processing '{pose_name}' ({folder}): frames {list(indices)}...")

        folder_path = os.path.join(f1_res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)

        processed_frames = []
        for i, frame_idx in enumerate(indices):
            raw = frames[frame_idx]
            canvas = key_and_transform_frame(raw)
            processed_frames.append(canvas)

            # Save individual PNG frame
            frame_png_path = os.path.join(folder_path, f"{prefix}_{i + 1}.png")
            canvas.save(frame_png_path, "PNG")

        # Create horizontal WebP spritesheet strip (9840 x 820)
        strip = Image.new('RGBA', (FRAME_WIDTH * NUM_FRAMES, FRAME_HEIGHT), (0, 0, 0, 0))
        for i, canvas in enumerate(processed_frames):
            strip.paste(canvas, (i * FRAME_WIDTH, 0), canvas)

        webp_filename = f"{pose_name.lower()}.webp"
        res_webp_path = os.path.join(f1_res_dir, webp_filename)
        src_webp_path = os.path.join(f1_src_dir, webp_filename)

        strip.save(res_webp_path, "WEBP", quality=95, method=6)
        strip.save(src_webp_path, "WEBP", quality=95, method=6)
        print(f"  -> Saved {res_webp_path} ({os.path.getsize(res_webp_path) // 1024} KB)")

        manifest_animations[pose_name] = {
            "file": webp_filename,
            "frames": NUM_FRAMES,
            "frameWidth": FRAME_WIDTH,
            "frameHeight": FRAME_HEIGHT,
            "totalWidth": FRAME_WIDTH * NUM_FRAMES
        }

    # Save manifest.json
    manifest_data = {
        "fighter": "fighter_1",
        "animations": manifest_animations
    }

    manifest_res_path = os.path.join(f1_res_dir, "manifest.json")
    manifest_src_path = os.path.join(f1_src_dir, "manifest.json")
    with open(manifest_res_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    with open(manifest_src_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    print("Manifest files generated successfully.")

    # Sync WebP assets to fighters 2-6 for Vite builds until their unique videos are processed
    for fighter_id in range(2, 7):
        target_src = os.path.join(BASE_SRC_ASSETS_DIR, f"fighter_{fighter_id}")
        os.makedirs(target_src, exist_ok=True)
        for item in os.listdir(f1_src_dir):
            s = os.path.join(f1_src_dir, item)
            d = os.path.join(target_src, item)
            if not os.path.isdir(s):
                shutil.copy2(s, d)

    print("All fighters 1-6 synchronized with 12-frame spritesheets.")


if __name__ == "__main__":
    process_video()
