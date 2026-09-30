"""Generate our original, seamless 12-second abstract background (no external footage)."""
from pathlib import Path
import sys
import subprocess
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.video-tools'))
import imageio_ffmpeg

out = ROOT / 'public' / 'media'
out.mkdir(parents=True, exist_ok=True)
w, h, fps, seconds = 960, 540, 24, 12
y, x = np.mgrid[0:h, 0:w].astype(np.float32)
x /= w
y /= h
encoder = subprocess.Popen([
    imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
    '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / 'master-waves.mp4')
], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
for frame in range(fps * seconds):
    phase = 2 * np.pi * frame / (fps * seconds)
    pixels = np.full((h, w, 3), [239, 246, 255], dtype=np.float32)
    for cx, cy, color, strength in [
        (.72 + .15*np.sin(phase), .25 + .16*np.cos(phase), [114, 166, 246], .48),
        (.2 + .16*np.cos(phase), .76 + .13*np.sin(phase), [113, 210, 219], .32),
    ]:
        glow = np.exp(-((x-cx)**2/.13 + (y-cy)**2/.22)) * strength
        pixels = pixels * (1-glow[..., None]) + np.array(color) * glow[..., None]
    for strand in range(9):
        curve = .52 + strand*.024 + .17*np.sin(x*5 + phase + strand*.09)
        curve += .07*np.cos(x*9 - phase)
        ribbon = np.exp(-((y-curve)/(.0025 + strand*.0006))**2) * .28
        pixels = pixels*(1-ribbon[..., None]) + np.array([102, 161, 235])*ribbon[..., None]
    image = np.clip(pixels, 0, 255).astype(np.uint8)
    if frame == 0:
        Image.fromarray(image).save(out / 'master-waves.jpg', quality=88)
    encoder.stdin.write(image.tobytes())
encoder.stdin.close()
errors = encoder.stderr.read().decode()
if encoder.wait() != 0:
    raise RuntimeError(errors)
print(f'Created {out / "master-waves.mp4"}')
