import os

km_js_path = "/Users/tt/projects/personal/Kimi/packages/data/src/locales/ions/km.js"

if os.path.exists(km_js_path):
    print("Updating km.js...")
    with open(km_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Translate all PRECIPITATE labels
    content = content.replace('"label": "PRECIPITATE"', '"label": "កករ"')

    # 2. Update Magnesium specifically (mg_2plus)
    # We find the mg_2plus section and replace its values to avoid affecting others unless needed.
    mg_section_start = content.find('"mg_2plus":')
    if mg_section_start != -1:
        # Locate slotA inside mg_2plus
        slot_a_start = content.find('"slotA":', mg_section_start)
        if slot_a_start != -1:
            # We search for the specific lines to replace in this block
            # Note: "label" is already replaced with "កករ" by the step above.
            result_line_start = content.find('"result": "ជែលពណ៌ស"', slot_a_start)
            desc_line_start = content.find('"desc": "w/ អ៊ីដ្រូសែន"', slot_a_start)
            
            if result_line_start != -1 and desc_line_start != -1:
                # Replace the result
                content = content[:result_line_start] + '"result": "កករខាប់ពណ៌ស"' + content[result_line_start + len('"result": "ជែលពណ៌ស"'):]
                
                # Re-find desc_line_start because content index might have shifted slightly
                desc_line_start = content.find('"desc": "w/ អ៊ីដ្រូសែន"', slot_a_start)
                content = content[:desc_line_start] + '"desc": "ជាមួយអ៊ីដ្រុកស៊ីត"' + content[desc_line_start + len('"desc": "w/ អ៊ីដ្រូសែន"'):]
                print("Magnesium details successfully updated!")
            else:
                print("Could not locate result or desc lines in mg_2plus slotA.")
        else:
            print("Could not find slotA in mg_2plus.")
    else:
        print("Could not find mg_2plus section.")

    with open(km_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("km.js updated.")
else:
    print("km.js not found!")
