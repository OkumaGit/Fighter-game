"""
Process AI-generated fighter video into game-ready 12-frame spritesheets.
Keys out green background, despills edges, centers and grounds character,
extracts exactly 12 frames per animation, and generates WebP spritesheet strips.

Usage:
    python scripts/process-fighter-video.py 6
    python scripts/process-fighter-video.py 1
"""

import sys
import os
import shutil
import json
import numpy as np
from PIL import Image
import imageio.v3 as iio

BASE_RESOURCES_DIR = "client/resources/fighters"
BASE_SRC_ASSETS_DIR = "client/src/assets/fighters"

FRAME_WIDTH = 820
FRAME_HEIGHT = 820
NUM_FRAMES = 12

FIGHTER_CONFIGS = {
    1: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_1.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_1.mp4"
        ],
        'scale': 1.20,
        'video_ground_y': 682,
        'video_center_x': 612,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
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
    },
    6: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_6.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_6.mp4"
        ],
        'scale': 1.20,
        'video_ground_y': 681,
        'video_center_x': 610,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
            'idle': {'range': (0, 14), 'folder': 'Idle', 'prefix': 'Idle'},
            'walk': {'range': (15, 32), 'folder': 'Walk', 'prefix': 'Walk'},
            'jab': {'range': (34, 44), 'folder': 'Jab', 'prefix': 'Jab'},
            'uppercut': {'range': (44, 54), 'folder': 'Uppercut', 'prefix': 'Uppercut'},
            'kick': {'range': (56, 70), 'folder': 'Kick', 'prefix': 'Kick'},
            'sweep': {'range': (72, 82), 'folder': 'Sweep', 'prefix': 'Sweep'},
            'jump': {'range': (84, 92), 'folder': 'Jump', 'prefix': 'Jump'},
            'jumpkick': {'range': (90, 99), 'folder': 'JumpKick', 'prefix': 'JumpKick'},
            'block': {'range': (102, 118), 'folder': 'Block', 'prefix': 'Block'},
            'special': {'range': (120, 136), 'folder': 'Special', 'prefix': 'Special'},
            'super': {'range': (138, 158), 'folder': 'Super', 'prefix': 'Super'},
            'hit': {'frames': [159, 160, 161, 162, 163, 163, 162, 161, 160, 159, 0, 1], 'folder': 'Hit', 'prefix': 'Hit'},
            'fall': {'range': (166, 178), 'folder': 'Fall', 'prefix': 'Fall'},
            'getup': {'range': (178, 190), 'folder': 'GetUp', 'prefix': 'GetUp'},
            'dizzy': {'range': (192, 218), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
            'death': {'range': (220, 239), 'folder': 'Death', 'prefix': 'Death'}
        }
    }
}


def key_and_transform_frame(raw_frame, scale, v_ground_y, v_center_x, t_ground_y, t_center_x):
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
    new_w = int(arr.shape[1] * scale)
    new_h = int(arr.shape[0] * scale)
    scaled = keyed_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Offsets based on video camera baseline
    paste_x = int(t_center_x - v_center_x * scale)
    paste_y = int(t_ground_y - v_ground_y * scale)

    canvas = Image.new('RGBA', (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
    canvas.paste(scaled, (paste_x, paste_y), scaled)
    return canvas


def process_fighter(fighter_id):
    if fighter_id not in FIGHTER_CONFIGS:
        print(f"Error: Unknown fighter ID {fighter_id}. Configured IDs: {list(FIGHTER_CONFIGS.keys())}")
        sys.exit(1)

    cfg = FIGHTER_CONFIGS[fighter_id]

    video_path = None
    for cand in cfg['video_candidates']:
        if os.path.exists(cand):
            video_path = cand
            break

    if not video_path:
        print(f"Error: Video file not found for Fighter {fighter_id}. Checked paths: {cfg['video_candidates']}")
        sys.exit(1)

    print(f"--- Processing Fighter {fighter_id} ---")
    print(f"Loading video: {video_path}")
    frames = list(iio.imiter(video_path))
    total_video_frames = len(frames)
    print(f"Total video frames loaded: {total_video_frames}")

    res_dir = os.path.join(BASE_RESOURCES_DIR, f"fighter_{fighter_id}_sprite")
    src_dir = os.path.join(BASE_SRC_ASSETS_DIR, f"fighter_{fighter_id}")
    os.makedirs(res_dir, exist_ok=True)
    os.makedirs(src_dir, exist_ok=True)

    scale = cfg['scale']
    v_ground_y = cfg['video_ground_y']
    v_center_x = cfg['video_center_x']
    t_ground_y = cfg['target_ground_y']
    t_center_x = cfg['target_center_x']

    manifest_animations = {}

    for pose_name, anim_cfg in cfg['anims'].items():
        folder = anim_cfg['folder']
        prefix = anim_cfg['prefix']

        if 'frames' in anim_cfg:
            indices = np.array(anim_cfg['frames'], dtype=int)
        else:
            start, end = anim_cfg['range']
            indices = np.linspace(start, end, NUM_FRAMES).round().astype(int)
        indices = np.clip(indices, 0, total_video_frames - 1)
        print(f"Processing '{pose_name}' ({folder}): frames {list(indices)}...")

        folder_path = os.path.join(res_dir, folder)
        # Clear existing individual frame PNGs to avoid stale files
        if os.path.exists(folder_path):
            for old_f in os.listdir(folder_path):
                if old_f.endswith('.png'):
                    try:
                        os.remove(os.path.join(folder_path, old_f))
                    except Exception:
                        pass
        os.makedirs(folder_path, exist_ok=True)

        processed_frames = []
        for i, frame_idx in enumerate(indices):
            raw = frames[frame_idx]
            canvas = key_and_transform_frame(raw, scale, v_ground_y, v_center_x, t_ground_y, t_center_x)
            processed_frames.append(canvas)

            # Save individual PNG frame
            frame_png_path = os.path.join(folder_path, f"{prefix}_{i + 1}.png")
            canvas.save(frame_png_path, "PNG")

        # Create horizontal WebP spritesheet strip (9840 x 820)
        strip = Image.new('RGBA', (FRAME_WIDTH * NUM_FRAMES, FRAME_HEIGHT), (0, 0, 0, 0))
        for i, canvas in enumerate(processed_frames):
            strip.paste(canvas, (i * FRAME_WIDTH, 0), canvas)

        webp_filename = f"{pose_name.lower()}.webp"
        res_webp_path = os.path.join(res_dir, webp_filename)
        src_webp_path = os.path.join(src_dir, webp_filename)

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
        "fighter": f"fighter_{fighter_id}",
        "animations": manifest_animations
    }

    manifest_res_path = os.path.join(res_dir, "manifest.json")
    manifest_src_path = os.path.join(src_dir, "manifest.json")
    with open(manifest_res_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    with open(manifest_src_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    print(f"Fighter {fighter_id} processed successfully!")


if __name__ == "__main__":
    target_id = 6
    if len(sys.argv) > 1:
        try:
            target_id = int(sys.argv[1])
        except ValueError:
            print(f"Usage: python scripts/process-fighter-video.py [1|6]")
            sys.exit(1)
    process_fighter(target_id)
