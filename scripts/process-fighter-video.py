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
from PIL import Image, ImageFilter
from scipy.ndimage import label, binary_fill_holes
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
            'jump': {
                'frames': [88, 89, 90, 91, 92, 92, 97, 98, 99, 100, 101, 102],
                'folder': 'Jump',
                'prefix': 'Jump'
            },
            'jumpkick': {
                'frames': [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
                'folder': 'JumpKick',
                'prefix': 'JumpKick'
            },
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
    2: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_2.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_2.mp4"
        ],
        'scale': 1.285,  # +7.1% larger than Fighter 1 (1.20) for male physique
        'sharpen': True,  # Edge sharpening & unsharp mask for clarity
        'video_ground_y': 685,
        'video_center_x': 608,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
            'idle': {'range': (0, 10), 'folder': 'Idle', 'prefix': 'Idle'},
            'walk': {'range': (11, 32), 'folder': 'Walk', 'prefix': 'Walk'},
            'jab': {'range': (33, 44), 'folder': 'Jab', 'prefix': 'Jab'},
            'uppercut': {
                'frames': [44, 45, 46, 47, 48, 48, 49, 49, 50, 50, 51, 44],
                'folder': 'Uppercut',
                'prefix': 'Uppercut'
            },
            'kick': {
                'frames': [52, 53, 54, 55, 55, 56, 56, 57, 58, 64, 68, 71],
                'folder': 'Kick',
                'prefix': 'Kick'
            },
            'sweep': {
                'frames': [80, 81, 82, 54, 55, 55, 56, 57, 82, 83, 84, 85],
                'offsets_y': [0, 0, 0, 120, 150, 150, 140, 100, 0, 0, 0, 0],
                'folder': 'Sweep',
                'prefix': 'Sweep'
            },
            'jump': {'range': (86, 102), 'folder': 'Jump', 'prefix': 'Jump'},
            'jumpkick': {
                'frames': [88, 90, 54, 55, 56, 57, 58, 57, 55, 93, 98, 101],
                'offsets_y': [0, -20, -50, -50, -50, -50, -50, -50, -40, -20, 0, 0],
                'folder': 'JumpKick',
                'prefix': 'JumpKick'
            },
            'block': {'range': (104, 125), 'folder': 'Block', 'prefix': 'Block'},
            'special': {'range': (128, 146), 'folder': 'Special', 'prefix': 'Special'},
            'super': {'range': (147, 165), 'folder': 'Super', 'prefix': 'Super'},
            'hit': {'frames': [166, 167, 168, 169, 170, 170, 169, 168, 167, 166, 0, 1], 'folder': 'Hit', 'prefix': 'Hit'},
            'fall': {'range': (171, 180), 'folder': 'Fall', 'prefix': 'Fall'},
            'getup': {'range': (180, 192), 'folder': 'GetUp', 'prefix': 'GetUp'},
            'dizzy': {'range': (193, 213), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
            'death': {'range': (214, 239), 'folder': 'Death', 'prefix': 'Death'}
        }
    },
    3: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_3.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_3.mp4"
        ],
        'scale': 1.285,  # Matches male physique scale with Fighter 2
        'sharpen': True,
        'video_ground_y': 687,
        'video_center_x': 625,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
            'idle': {'range': (0, 11), 'folder': 'Idle', 'prefix': 'Idle'},
            'walk': {'range': (12, 32), 'folder': 'Walk', 'prefix': 'Walk'},
            'jab': {'range': (34, 42), 'folder': 'Jab', 'prefix': 'Jab'},
            'uppercut': {
                'frames': [43, 44, 45, 46, 47, 48, 48, 47, 46, 45, 44, 43],
                'folder': 'Uppercut',
                'prefix': 'Uppercut'
            },
            'kick': {'range': (51, 62), 'folder': 'Kick', 'prefix': 'Kick'},
            'sweep': {
                'frames': [75, 76, 77, 51, 52, 53, 54, 55, 78, 79, 81, 82],
                'offsets_y': [0, 0, 0, 110, 140, 140, 130, 100, 0, 0, 0, 0],
                'folder': 'Sweep',
                'prefix': 'Sweep'
            },
            'jump': {
                'frames': [82, 83, 84, 84, 85, 85, 85, 84, 84, 98, 99, 100],
                'folder': 'Jump',
                'prefix': 'Jump'
            },
            'jumpkick': {
                'frames': [83, 84, 51, 52, 53, 54, 55, 56, 54, 84, 98, 99],
                'offsets_y': [0, -20, -50, -50, -50, -50, -50, -50, -40, -20, 0, 0],
                'folder': 'JumpKick',
                'prefix': 'JumpKick'
            },
            'block': {'range': (109, 118), 'folder': 'Block', 'prefix': 'Block'},
            'special': {'range': (115, 138), 'folder': 'Special', 'prefix': 'Special'},
            'super': {'range': (138, 157), 'folder': 'Super', 'prefix': 'Super'},
            'hit': {'frames': [186, 187, 188, 189, 190, 191, 192, 191, 190, 188, 187, 186], 'folder': 'Hit', 'prefix': 'Hit'},
            'fall': {'range': (205, 221), 'folder': 'Fall', 'prefix': 'Fall'},
            'getup': {'range': (169, 180), 'folder': 'GetUp', 'prefix': 'GetUp'},
            'dizzy': {'range': (192, 204), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
            'death': {'range': (220, 235), 'folder': 'Death', 'prefix': 'Death'}
        }
    },
    4: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_4.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_4.mp4"
        ],
        'scale': 1.25,
        'sharpen': True,
        'video_ground_y': 692,
        'video_center_x': 625,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
            'idle': {'range': (0, 11), 'folder': 'Idle', 'prefix': 'Idle'},
            'walk': {'range': (12, 32), 'folder': 'Walk', 'prefix': 'Walk'},
            'jab': {
                'frames': [33, 34, 35, 36, 37, 38, 38, 39, 40, 41, 42, 33],
                'folder': 'Jab',
                'prefix': 'Jab'
            },
            'uppercut': {
                'frames': [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 43],
                'folder': 'Uppercut',
                'prefix': 'Uppercut'
            },
            'kick': {'range': (54, 66), 'folder': 'Kick', 'prefix': 'Kick'},
            'sweep': {
                'frames': [83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 82, 81],
                'folder': 'Sweep',
                'prefix': 'Sweep'
            },
            'jump': {
                'frames': [96, 97, 98, 99, 100, 101, 102, 103, 102, 101, 111, 112],
                'folder': 'Jump',
                'prefix': 'Jump'
            },
            'jumpkick': {
                'frames': [98, 100, 102, 104, 105, 106, 107, 108, 108, 109, 110, 111],
                'folder': 'JumpKick',
                'prefix': 'JumpKick'
            },
            'block': {
                'frames': [112, 113, 114, 115, 116, 117, 117, 116, 115, 114, 113, 112],
                'folder': 'Block',
                'prefix': 'Block'
            },
            'special': {'range': (137, 149), 'folder': 'Special', 'prefix': 'Special'},
            'super': {'range': (150, 162), 'folder': 'Super', 'prefix': 'Super'},
            'hit': {
                'frames': [172, 173, 174, 175, 176, 176, 175, 174, 173, 172, 180, 180],
                'folder': 'Hit',
                'prefix': 'Hit'
            },
            'fall': {'range': (190, 204), 'folder': 'Fall', 'prefix': 'Fall'},
            'getup': {'range': (216, 224), 'folder': 'GetUp', 'prefix': 'GetUp'},
            'dizzy': {'range': (176, 188), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
            'death': {'range': (224, 238), 'folder': 'Death', 'prefix': 'Death'}
        }
    },
    5: {
        'video_candidates': [
            "client/resources/fighters/fighter-game-assets/Videos/fighter_5.mp4",
            "C:/Users/Student/Dev/fighter-game-assets/Videos/fighter_5.mp4"
        ],
        'scale': 1.20,  # Matches female physique scale with Fighter 1
        'sharpen': True,
        'video_ground_y': 688,
        'video_center_x': 565,
        'target_ground_y': 805,
        'target_center_x': 410,
        'anims': {
            'idle': {'range': (0, 11), 'folder': 'Idle', 'prefix': 'Idle'},
            'walk': {'range': (12, 29), 'folder': 'Walk', 'prefix': 'Walk'},
            'jab': {'frames': [30, 31, 32, 33, 34, 35, 36, 35, 34, 33, 31, 30], 'folder': 'Jab', 'prefix': 'Jab'},
            'uppercut': {'frames': [36, 37, 38, 39, 39, 40, 40, 39, 38, 37, 36, 30], 'folder': 'Uppercut', 'prefix': 'Uppercut'},
            'kick': {'range': (42, 56), 'folder': 'Kick', 'prefix': 'Kick'},
            'sweep': {
                'frames': [70, 71, 72, 73, 74, 75, 76, 77, 76, 73, 71, 70],
                'frame_width': 1000,
                'frame_height': 820,
                'target_center_x': 500,
                'target_ground_y': 805,
                'feather': True,
                'folder': 'Sweep',
                'prefix': 'Sweep'
            },
            'jump': {
                'frames': [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
                'clean_sand': True,
                'folder': 'Jump',
                'prefix': 'Jump'
            },
            'jumpkick': {
                'frames': [79, 80, 47, 48, 49, 50, 51, 52, 51, 48, 86, 87],
                'offsets_y': [0, -20, -60, -60, -60, -60, -60, -60, -50, -30, -10, 0],
                'clean_sand': True,
                'folder': 'JumpKick',
                'prefix': 'JumpKick'
            },
            'block': {'range': (96, 102), 'folder': 'Block', 'prefix': 'Block'},
            'special': {'range': (103, 118), 'folder': 'Special', 'prefix': 'Special'},
            'super': {
                'range': (128, 149),
                'frame_width': 1160,
                'frame_height': 820,
                'target_center_x': 510,
                'target_ground_y': 805,
                'feather': True,
                'folder': 'Super',
                'prefix': 'Super'
            },
            'hit': {'frames': [184, 185, 186, 187, 188, 189, 190, 189, 188, 186, 185, 184], 'folder': 'Hit', 'prefix': 'Hit'},
            'fall': {
                'range': (156, 165),
                'frame_width': 1000,
                'frame_height': 820,
                'target_center_x': 500,
                'target_ground_y': 805,
                'clean_sand': True,
                'mirror': True,
                'folder': 'Fall',
                'prefix': 'Fall'
            },
            'getup': {'range': (172, 184), 'folder': 'GetUp', 'prefix': 'GetUp'},
            'dizzy': {'range': (193, 215), 'folder': 'Dizzy', 'prefix': 'Dizzy'},
            'death': {
                'range': (216, 239),
                'frame_width': 1000,
                'frame_height': 820,
                'target_center_x': 500,
                'target_ground_y': 805,
                'mirror': True,
                'folder': 'Death',
                'prefix': 'Death'
            }
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


def clean_sand_filter(arr, alpha, frame_idx=None):
    """Removes sand dust clouds, ground puffs, and swirling sand waves for character-focused jump and fall animations."""
    if frame_idx is not None and frame_idx < 70:
        return alpha

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    # Special handling for fall animation (frames 150-170)
    if frame_idx is not None and 150 <= frame_idx <= 170:
        is_dark = (r < 95) & (g < 95) & (b < 95)
        is_skin = (r > 90) & (r > g + 8) & (r > b + 12)
        is_hair = (r > 75) & (r > g + 8)
        is_pants = (r < 130) & (g < 115) & (b < 90)
        is_char = is_dark | is_skin | is_hair | is_pants
        char_mask_solid = binary_fill_holes(is_char)

        y_grid = np.arange(arr.shape[0])[:, None]
        x_grid = np.arange(arr.shape[1])[None, :]

        # Outer camera borders
        alpha[714:, :] = 0.0
        alpha[:, :240] = 0.0
        alpha[:, 1050:] = 0.0

        if frame_idx == 156:
            # Airborne start: eliminate ground sand decal, side dirt, and low streaks
            sand_mask = (
                ((y_grid > 654) & (x_grid < 450)) |
                ((y_grid >= 640) & (x_grid >= 390) & (x_grid <= 517)) |
                ((y_grid >= 640) & (x_grid >= 560)) |
                (y_grid > 678) |
                ((y_grid > 674) & (x_grid <= 520))
            )
            alpha[sand_mask] = 0.0
        elif frame_idx == 157:
            # Airborne: eliminate ground sand ring below boots
            sand_mask = (
                ((y_grid > 615) & (x_grid < 380)) |
                ((y_grid > 630) & ((x_grid < 395) | (x_grid > 435))) |
                (y_grid >= 660) |
                ((y_grid >= 658) & (x_grid < 411))
            )
            alpha[sand_mask] = 0.0
        elif frame_idx in [158, 159]:
            # Airborne apex: clean floor sand streak
            sand_mask = (y_grid >= 640) | ((y_grid > 635) & (x_grid > 420))
            alpha[sand_mask] = 0.0
        else:
            # Landing and lying frames (160-170):
            # Clean only the bright yellow/tan ground sand decal and floor dirt below y > 684 outside character
            is_sand_color = (r > 135) & (g > 125) & (b > 85) & (np.abs(r - g) < 28)
            is_floor_sand = (y_grid > 684) & ~char_mask_solid
            alpha[is_floor_sand | (is_sand_color & ~char_mask_solid & (y_grid > 580))] = 0.0

        lbl, num = label(alpha > 0.15)
        if num > 0:
            sizes = np.bincount(lbl.ravel())
            largest = sizes[1:].argmax() + 1
            alpha = np.where(lbl == largest, alpha, 0.0)
            holes = binary_fill_holes(alpha > 0.15)
            alpha = np.where(holes & (alpha == 0), 1.0, alpha)

        return alpha

    # Sand color signatures
    is_sand_tan = (r > 95) & (g > 85) & (b > 35) & (np.abs(r - g) < 30) & (g - b > 15)
    is_sand_dust = (r > 70) & (g > 65) & (b > 45) & (np.abs(r - g) < 22) & (np.abs(g - b) < 25) & (np.abs(r - b) < 30)
    is_ground_dust = (np.arange(arr.shape[0])[:, None] > 440) & (r > 65) & (g > 60) & (np.abs(r - g) < 26) & (b > 35)
    is_sand = is_sand_tan | is_sand_dust | is_ground_dust

    # Protect character skin and dark clothing/boots
    skin_protect = (r > g + 20) & (r > b + 20) & (np.arange(arr.shape[0])[:, None] < 450)
    dark_protect = (r < 80) & (g < 80) & (b < 80)
    is_sand = is_sand & ~(skin_protect | dark_protect)

    # Cut off side ground dust
    bottom_sides = (np.arange(arr.shape[0])[:, None] > 500) & (
        (np.arange(arr.shape[1])[None, :] > 720) | (np.arange(arr.shape[1])[None, :] < 400)
    )
    is_sand = is_sand | bottom_sides

    # Airborne frames: clear ground sand below feet
    if frame_idx is not None:
        if 80 <= frame_idx <= 85:
            is_sand = is_sand | (np.arange(arr.shape[0])[:, None] > 540)
        elif frame_idx in [79, 86]:
            is_sand = is_sand | (np.arange(arr.shape[0])[:, None] > 605)

    alpha[is_sand] = 0.0

    # Retain strictly the character component connected to torso
    lbl, num = label(alpha > 0.15)
    if num > 0:
        torso_mask = np.zeros((arr.shape[0], arr.shape[1]), dtype=bool)
        torso_mask[100:350, 450:680] = True
        torso_labels = np.unique(lbl[torso_mask & (lbl > 0)])
        char_mask = np.isin(lbl, list(torso_labels))
        alpha[~char_mask] = 0.0

    return alpha


def key_and_transform_frame(
    raw_frame, scale, v_ground_y, v_center_x, t_ground_y, t_center_x,
    offset_y=0, offset_x=0, sharpen=False, clean_sand=False, frame_idx=None, feather=False,
    target_w=FRAME_WIDTH, target_h=FRAME_HEIGHT
):
    """Applies chroma-key, despill, grounding/centering, optional sharpening and offsets."""
    arr = raw_frame.astype(np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    max_rb = np.maximum(r, b)
    diff = g - max_rb

    # Chroma key mask (tighter edge when sharpening to prevent halos)
    if sharpen:
        alpha = np.clip((36.0 - diff) / 22.0, 0.0, 1.0)
    else:
        alpha = np.clip((40.0 - diff) / 30.0, 0.0, 1.0)

    # Clean bottom floor camera noise
    side_floor_dirt = (np.arange(arr.shape[0])[:, None] > 675) & (
        (np.arange(arr.shape[1])[None, :] > 750) | (np.arange(arr.shape[1])[None, :] < 350)
    )
    alpha[side_floor_dirt] = 0.0

    if clean_sand:
        alpha = clean_sand_filter(arr, alpha, frame_idx=frame_idx)
    else:
        # Filter out detached background noise and flying debris particles (e.g. hit/impact bursts)
        lbl, num = label(alpha > 0.15)
        if num > 1:
            sizes = np.bincount(lbl.ravel())
            keep = sizes >= 2000
            keep[0] = False
            largest = sizes[1:].argmax() + 1
            keep[largest] = True
            alpha = np.where(keep[lbl], alpha, 0.0)

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

    if sharpen:
        # Subtle unsharp mask to restore sharp arcade edges and textures
        rgb = scaled.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=130, threshold=2))
        alpha_ch = scaled.split()[3]
        scaled = Image.merge('RGBA', (*rgb.split(), alpha_ch))

    # Offsets based on video camera baseline
    paste_x = int(t_center_x - v_center_x * scale + offset_x)
    paste_y = int(t_ground_y - v_ground_y * scale + offset_y)

    # Automatic boundary protection: guarantee character is never clipped on top, right, or left
    alpha_arr = np.array(scaled.split()[3])
    ys, xs = np.where(alpha_arr > 30)
    if len(ys) > 0 and len(xs) > 0:
        # Headroom: prevent cutting off head at top, but NEVER push feet into floor
        head_top_y = paste_y + int(ys.min())
        if head_top_y < 25:
            shift_down = 25 - head_top_y
            max_allowed_shift = max(0, (target_h - 15) - (paste_y + int(ys.max())))
            paste_y += min(shift_down, max_allowed_shift)

        # Ground level protection: character's feet must NEVER exceed bottom of frame
        foot_bottom_y = paste_y + int(ys.max())
        if foot_bottom_y > target_h - 14:
            paste_y -= (foot_bottom_y - (target_h - 14))

        # Boundary protection: if character is too wide for fixed margin, center it
        char_w = int(xs.max() - xs.min())
        if char_w > target_w - 40:
            paste_x = int((target_w - char_w) / 2 - xs.min())
        else:
            # Right margin: never cut off kicking leg or extended attack at right
            right_x = paste_x + int(xs.max())
            if right_x > target_w - 20:
                paste_x -= (right_x - (target_w - 20))

            # Left margin: never cut off character at left
            left_x = paste_x + int(xs.min())
            if left_x < 20:
                paste_x += (20 - left_x)

    canvas = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(scaled, (paste_x, paste_y), scaled)

    if feather:
        alpha_canvas = np.array(canvas.split()[3], dtype=np.float32)
        ramp_left = np.clip(np.arange(target_w, dtype=np.float32) / 35.0, 0.0, 1.0)
        ramp_right = np.clip((target_w - 1.0 - np.arange(target_w, dtype=np.float32)) / 35.0, 0.0, 1.0)
        feather_mask = ramp_left * ramp_right
        alpha_canvas = alpha_canvas * feather_mask[None, :]
        canvas.putalpha(Image.fromarray(alpha_canvas.astype(np.uint8)))

    return canvas


def process_fighter(fighter_id, anim_filter=None):
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

    sharpen = cfg.get('sharpen', False)

    for pose_name, anim_cfg in cfg['anims'].items():
        if anim_filter and pose_name.lower() != anim_filter.lower():
            continue
        folder = anim_cfg['folder']
        prefix = anim_cfg['prefix']

        if 'frames' in anim_cfg:
            indices = np.array(anim_cfg['frames'], dtype=int)
        else:
            start, end = anim_cfg['range']
            indices = np.linspace(start, end, NUM_FRAMES).round().astype(int)
        indices = np.clip(indices, 0, total_video_frames - 1)
        offsets_y = anim_cfg.get('offsets_y', [0] * NUM_FRAMES)
        offsets_x = anim_cfg.get('offsets_x', [0] * NUM_FRAMES)
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

        clean_sand = anim_cfg.get('clean_sand', False)
        anim_scale = anim_cfg.get('scale', scale)
        feather = anim_cfg.get('feather', False) or (pose_name == 'super')
        mirror = anim_cfg.get('mirror', False)
        target_w = anim_cfg.get('frame_width', FRAME_WIDTH)
        target_h = anim_cfg.get('frame_height', FRAME_HEIGHT)
        anim_center_x = anim_cfg.get('target_center_x', t_center_x)
        anim_ground_y = anim_cfg.get('target_ground_y', t_ground_y)

        processed_frames = []
        for i, frame_idx in enumerate(indices):
            raw = frames[frame_idx]
            canvas = key_and_transform_frame(
                raw, anim_scale, v_ground_y, v_center_x, anim_ground_y, anim_center_x,
                offset_y=offsets_y[i], offset_x=offsets_x[i], sharpen=sharpen,
                clean_sand=clean_sand, frame_idx=frame_idx, feather=feather,
                target_w=target_w, target_h=target_h
            )
            if mirror:
                canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
            processed_frames.append(canvas)

            # Save individual PNG frame
            frame_png_path = os.path.join(folder_path, f"{prefix}_{i + 1}.png")
            canvas.save(frame_png_path, "PNG")

        # Create horizontal WebP spritesheet strip (target_w * NUM_FRAMES x target_h)
        strip = Image.new('RGBA', (target_w * NUM_FRAMES, target_h), (0, 0, 0, 0))
        for i, canvas in enumerate(processed_frames):
            strip.paste(canvas, (i * target_w, 0), canvas)

        webp_filename = f"{pose_name.lower()}.webp"
        res_webp_path = os.path.join(res_dir, webp_filename)
        src_webp_path = os.path.join(src_dir, webp_filename)

        strip.save(res_webp_path, "WEBP", quality=95, method=6)
        strip.save(src_webp_path, "WEBP", quality=95, method=6)
        print(f"  -> Saved {res_webp_path} ({os.path.getsize(res_webp_path) // 1024} KB)")

        manifest_animations[pose_name] = {
            "file": webp_filename,
            "frames": NUM_FRAMES,
            "frameWidth": target_w,
            "frameHeight": target_h,
            "totalWidth": target_w * NUM_FRAMES
        }

    # Save manifest.json
    manifest_res_path = os.path.join(res_dir, "manifest.json")
    manifest_src_path = os.path.join(src_dir, "manifest.json")
    manifest_data = {
        "fighter": f"fighter_{fighter_id}",
        "animations": manifest_animations
    }
    if anim_filter and os.path.exists(manifest_res_path):
        try:
            with open(manifest_res_path, "r", encoding="utf-8") as f:
                existing_manifest = json.load(f)
            existing_manifest.setdefault("animations", {}).update(manifest_animations)
            manifest_data = existing_manifest
        except Exception:
            pass

    with open(manifest_res_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    with open(manifest_src_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    print(f"Fighter {fighter_id} processed successfully!")


if __name__ == "__main__":
    target_id = 6
    target_anim = None
    if len(sys.argv) > 1:
        try:
            target_id = int(sys.argv[1])
        except ValueError:
            print("Usage: python scripts/process-fighter-video.py [1|2|3|5|6] [anim_name]")
            sys.exit(1)
    if len(sys.argv) > 2:
        target_anim = sys.argv[2]
    process_fighter(target_id, target_anim)
