"""Create compact report thumbnails from public project and paper figures."""
import argparse
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def build_preview(paper):
    if paper == "libero-gen":
        import fitz

        source = "https://raw.githubusercontent.com/mlresearch/v306/main/assets/zhou26az/zhou26az.pdf"
        with urlopen(source, timeout=30) as response:
            document = fitz.open(stream=response.read(), filetype="pdf")
        with document:
            page = document[2]
            # Figure 2 is the single image on page 3; exclude the running title and caption.
            figure = fitz.Rect(page.get_image_info()[0]["bbox"])
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=figure, alpha=False)
            overview = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        filename = "libero-gen-overview.webp"
    else:
        source = "https://raw.githubusercontent.com/Zxy-MLlab/LIBERO-PRO/master/images/overall.png"
        with urlopen(source, timeout=30) as response:
            overview = Image.open(BytesIO(response.read())).convert("RGB")
        filename = "libero-pro-original.webp"

    overview.thumbnail((640, 360), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (640, 360), "white")
    canvas.paste(overview, ((640 - overview.width) // 2, (360 - overview.height) // 2))
    canvas.save(ROOT / "assets/paper" / filename, quality=88)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--paper", choices=("original", "libero-gen"), default="original")
    build_preview(parser.parse_args().paper)
