from pathlib import Path

import fitz


PDF_PATH = Path("attached_assets/JennandAnnaDesignBrief_(1)_1789336247851.pdf")
OUTPUT_DIR = Path(".agents/outputs/wedding-brief-pages")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF_PATH)
    print(f"pages={document.page_count}")

    for index, page in enumerate(document):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        output_path = OUTPUT_DIR / f"page-{index + 1}.png"
        pixmap.save(output_path)
        print(output_path)


if __name__ == "__main__":
    main()