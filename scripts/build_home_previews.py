"""Build lightweight Home previews from the exact HD perturbation demos.

Run after replacing the videos in assets/rollouts/documents. Resizing preserves
every frame, its timestamp and orientation; posters use the same first frame.
"""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def build(clip):
    identifier = clip['perturbation']
    source = ROOT / 'assets/rollouts/documents' / f'{identifier}.mp4'
    output = ROOT / clip['src']
    poster = ROOT / clip['poster']
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error',
        '-xerror', '-y', '-i', str(source), '-map', '0:v:0', '-an',
        '-map_metadata', '-1', '-vf', 'scale=256:256:flags=area',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-threads', '2',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output),
    ], check=True, capture_output=True)

    hd, preview = cv2.VideoCapture(str(source)), cv2.VideoCapture(str(output))
    try:
        assert hd.isOpened() and preview.isOpened(), identifier
        assert (hd.get(cv2.CAP_PROP_FRAME_WIDTH), hd.get(cv2.CAP_PROP_FRAME_HEIGHT)) == (640, 640), identifier
        assert (preview.get(cv2.CAP_PROP_FRAME_WIDTH), preview.get(cv2.CAP_PROP_FRAME_HEIGHT)) == (256, 256), identifier
        assert hd.get(cv2.CAP_PROP_FPS) == preview.get(cv2.CAP_PROP_FPS) == 20, identifier
        frames, error = 0, 0.0
        while True:
            source_ok, original = hd.read()
            preview_ok, small = preview.read()
            assert source_ok == preview_ok, f'{identifier}: frame count differs'
            if not source_ok:
                break
            expected = cv2.resize(original, (256, 256), interpolation=cv2.INTER_AREA)
            difference = float(np.abs(expected.astype(np.float32) - small).mean())
            assert difference < 6, f'{identifier} frame {frames}: different content or direction ({difference:.2f})'
            error = max(error, difference)
            if frames == 0:
                Image.fromarray(cv2.cvtColor(small, cv2.COLOR_BGR2RGB)).save(poster, quality=82)
                with Image.open(poster) as image:
                    first = np.asarray(image.convert('RGB'))
                poster_error = float(np.abs(first.astype(np.float32) - cv2.cvtColor(expected, cv2.COLOR_BGR2RGB)).mean())
                assert poster_error < 6, f'{identifier}: poster differs from HD first frame'
            frames += 1
        assert frames > 0, identifier
    finally:
        hd.release()
        preview.release()
    return {'id': identifier, 'frames': frames, 'max_frame_error': round(error, 3),
            'poster_error': round(poster_error, 3), 'bytes': output.stat().st_size + poster.stat().st_size}


if __name__ == '__main__':
    clips = json.loads((ROOT / 'data/home-rollouts.json').read_text(encoding='utf-8'))['clips']
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(build, clips))
    print(json.dumps({'clips': len(rows), 'frames': sum(row['frames'] for row in rows),
                      'bytes': sum(row['bytes'] for row in rows), 'checks': rows}, indent=2))
