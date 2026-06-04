import os

km_js_path = "/Users/tt/projects/personal/Kimi/packages/data/src/locales/ions/km.js"
km_json_path = "/Users/tt/projects/personal/Kimi/apps/web/src/i18n/messages/km.json"

# 1. Update km.js
if os.path.exists(km_js_path):
    print("Updating km.js...")
    with open(km_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements for technical classifications (ion types)
    replacements = {
        '"type": "ជាតិគីមី / អាស៊ីត"': '"type": "កាដ្យុង / អាស៊ីត"',
        '"type": "ជាតិអាល់កាឡាំងលោហធាតុ"': '"type": "កាដ្យុងលោហៈអាល់កាឡាំង"',
        '"type": "ការផ្លាស់ប្តូរលោហៈធាតុ"': '"type": "កាដ្យុងលោហៈឆ្លង"',
        '"type": "ជាតិអាល់កាឡាំងផែនដី"': '"type": "កាដ្យុងលោហៈអាល់កាឡាំងផែនដី"',
        '"type": "ជាតិអាល់កាឡាំងផែនដីធ្ងន់"': '"type": "កាដ្យុងលោហៈអាល់កាឡាំងផែនដីធ្ងន់"',
        '"type": "វិញ្ញាបនបត្រក្រោយការផ្លាស់ប្តូរ"': '"type": "កាដ្យុងលោហៈក្រោយឆ្លង"',
        '"type": "អ៊ីយ៉ូត ហាឡូហ្សែន"': '"type": "អាញ៉ុងហាឡូហ្សែន"',
        '"type": "Chalcogen Anion"': '"type": "អាញ៉ុងឆាល់កូសែន"',
        '"type": "Pnictogen Anion"': '"type": "អាញ៉ុងភ្នីកតូសែន"',
        '"type": "អុកស៊ីហ្សែន"': '"type": "អុកស៊ីអាញ៉ុង"',
        '"type": "Anion សរីរាង្គ"': '"type": "អាញ៉ុងសរីរាង្គ"',
        '"type": "អុកស៊ីហ្សែន Halogen"': '"type": "អុកស៊ីអាញ៉ុងហាឡូហ្សែន"',
        '"type": "ការផ្លាស់ប្តូរលោហៈ Oxyanion"': '"type": "អុកស៊ីអាញ៉ុងលោហៈឆ្លង"',
        '"type": "សារធាតុប៉ូលីអាតូមិច"': '"type": "កាដ្យុងពហុអាតូម"',
        '"type": "Polyatomic Anion / មូលដ្ឋាន"': '"type": "អាញ៉ុងពហុអាតូម / បាស"',
        '"type": "Amphoteric Oxyanion"': '"type": "អុកស៊ីអាញ៉ុងអំភូទែ"',
        '"type": "អាស៊ីតអុកស៊ីតកម្ម"': '"type": "អុកស៊ីអាញ៉ុងអាស៊ីត"',
        '"type": "សារធាតុពុល Pseudo-Halogen"': '"type": "អាញ៉ុងស៊ូដូហាឡូហ្សែន"',
    }

    for target, replacement in replacements.items():
        content = content.replace(target, replacement)

    with open(km_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("km.js updated successfully.")
else:
    print("km.js not found!")

# 2. Update km.json
if os.path.exists(km_json_path):
    print("Updating km.json...")
    with open(km_json_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements for json keys
    json_replacements = {
        '"carbonPolyatomic": "កាបូន Polyatomic"': '"carbonPolyatomic": "កាបូនពហុអាតូម"',
        '"nitrogenPolyatomic": "អាសូតប៉ូលីអាតូមិច"': '"nitrogenPolyatomic": "អាសូតពហុអាតូម"',
        '"sulfurPolyatomic": "ស្ពាន់ធ័របំផ្លាញប៉ូលីអាតូមិក"': '"sulfurPolyatomic": "ស្ពាន់ធ័រពហុអាតូម"',
        '"sulfurPolyatomic": "ស្ពាន់ធ័រប៉ូលីអាតូមិក"': '"sulfurPolyatomic": "ស្ពាន់ធ័រពហុអាតូម"',
        '"phosphorusPolyatomic": "ផូស្វ័រប៉ូលីអាតូមិក"': '"phosphorusPolyatomic": "ផូស្វ័រពហុអាតូម"',
        '"chlorinePolyatomic": "ក្លរីនប៉ូលីអាតូមិច"': '"chlorinePolyatomic": "ក្លរពហុអាតូម"',
        '"stateInWater": "រដ្ឋនៅក្នុងទឹក។"': '"stateInWater": "ភាពរលាយក្នុងទឹក"',
        '"hydrationEnthalpy": "ជាតិទឹក Enthalpy"': '"hydrationEnthalpy": "អង់តាលពីអ៊ីដ្រាតកម្ម"',
        '"namedBy": "ហៅឈ្មោះតាមរយះ"': '"namedBy": "ហៅឈ្មោះតាមរយៈ"'
    }

    for target, replacement in json_replacements.items():
        content = content.replace(target, replacement)

    with open(km_json_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("km.json updated successfully.")
else:
    print("km.json not found!")
