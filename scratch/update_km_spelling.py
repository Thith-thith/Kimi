import os

km_js_path = "/Users/tt/projects/personal/Kimi/packages/data/src/locales/ions/km.js"
km_json_path = "/Users/tt/projects/personal/Kimi/apps/web/src/i18n/messages/km.json"

# Update km.js
if os.path.exists(km_js_path):
    print("Updating km.js...")
    with open(km_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    content = content.replace('"តេស្តអណ្តាតភ្លើង"', '"តេស្តអណ្ដាតភ្លើង"')
    content = content.replace('"ក្រហមក្រហម"', '"ក្រហមទុំ"')

    with open(km_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("km.js updated.")
else:
    print("km.js not found!")

# Update km.json
if os.path.exists(km_json_path):
    print("Updating km.json...")
    with open(km_json_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    content = content.replace('"ការធ្វើតេស្តអណ្តាតភ្លើង"', '"ការធ្វើតេស្តអណ្ដាតភ្លើង"')

    with open(km_json_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("km.json updated.")
else:
    print("km.json not found!")
