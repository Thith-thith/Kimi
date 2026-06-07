import os
from PIL import Image

def main():
    src_path = "/Users/tt/.gemini/antigravity/brain/53a02f96-674e-42c5-a38a-9bc1257223ed/og_share_preview_1780829617102.png"
    dest_path = "/Users/tt/projects/personal/Kimi/apps/web/public/images/og-share-preview.png"
    dest_app_path = "/Users/tt/projects/personal/Kimi/apps/web/src/app/opengraph-image.png"

    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return

    img = Image.open(src_path)
    
    # 1. Crop to 1.91:1 ratio (1024 x 536) centered vertically
    width, height = img.size
    crop_width = 1024
    crop_height = 536
    
    left = (width - crop_width) // 2
    top = (height - crop_height) // 2
    right = left + crop_width
    bottom = top + crop_height
    
    cropped_img = img.crop((left, top, right, bottom))
    
    # 2. Resize to exactly 1200 x 630 for high-quality Open Graph standard
    final_img = cropped_img.resize((1200, 630), Image.Resampling.LANCZOS)
    
    # Ensure destination directories exist
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    os.makedirs(os.path.dirname(dest_app_path), exist_ok=True)
    
    # Save as PNG
    final_img.save(dest_path, "PNG")
    final_img.save(dest_app_path, "PNG")
    print(f"Saved cropped and resized OG image to:\n  {dest_path}\n  {dest_app_path}")

if __name__ == "__main__":
    main()
