import json
import re
import os
import sys
import time
from deep_translator import GoogleTranslator

# Add project root to path to import translate_task
sys.path.append("/Users/tt/projects/personal/Kimi")
from translate_task import batch_translate

def translate_ions():
    print("Reading ions.ts...")
    with open("packages/data/src/ions.ts", "r", encoding="utf-8") as f:
        content = f.read()

    # Clean the TS file content to parse it as JSON
    json_str = content
    # Remove the import line
    json_str = re.sub(r'import\s+.*?;', '', json_str)
    # Remove the export line prefix
    json_str = re.sub(r'export\s+const\s+ions:\s*Ion\[\]\s*=\s*', '', json_str)
    json_str = json_str.strip()
    if json_str.endswith(';'):
        json_str = json_str[:-1]

    try:
        ions_list = json.loads(json_str)
    except Exception as e:
        print(f"Error parsing ions.ts as JSON: {e}")
        return False

    print(f"Loaded {len(ions_list)} ions.")
    
    # We will translate:
    # - name
    # - customData.level1.type, source, phase, valence, keyCompounds
    # - customData.level2.statusBanner
    # - customData.level2.slotA.label, result, desc
    # - customData.level2.slotB.label, result, desc
    # - customData.level3.config, oxidation, ionicRadius, hydrationEnthalpy, coordination
    # - customData.level4.discoveryYear, discoveredBy, namedBy, stse, commonUses, hazards
    
    to_translate = []
    keys_map = [] # List of tuples: (ion_index, path)
    
    for idx, ion in enumerate(ions_list):
        # 1. Ion name
        to_translate.append(ion["name"])
        keys_map.append((idx, ["name"]))
        
        cd = ion.get("customData", {})
        
        # 2. Level 1
        lvl1 = cd.get("level1", {})
        for k in ["type", "source", "phase", "valence", "keyCompounds"]:
            if k in lvl1 and lvl1[k]:
                to_translate.append(lvl1[k])
                keys_map.append((idx, ["customData", "level1", k]))
                
        # 3. Level 2
        lvl2 = cd.get("level2", {})
        if "statusBanner" in lvl2 and lvl2["statusBanner"]:
            to_translate.append(lvl2["statusBanner"])
            keys_map.append((idx, ["customData", "level2", "statusBanner"]))
            
        for slot in ["slotA", "slotB"]:
            s_data = lvl2.get(slot, {})
            for k in ["label", "result", "desc"]:
                if k in s_data and s_data[k]:
                    to_translate.append(s_data[k])
                    keys_map.append((idx, ["customData", "level2", slot, k]))
                    
        # 4. Level 3
        lvl3 = cd.get("level3", {})
        for k in ["config", "oxidation", "ionicRadius", "hydrationEnthalpy", "coordination"]:
            if k in lvl3 and lvl3[k]:
                to_translate.append(lvl3[k])
                keys_map.append((idx, ["customData", "level3", k]))
                
        # 5. Level 4
        lvl4 = cd.get("level4", {})
        for k in ["discoveryYear", "discoveredBy", "namedBy", "stse", "commonUses", "hazards"]:
            if k in lvl4 and lvl4[k]:
                to_translate.append(lvl4[k])
                keys_map.append((idx, ["customData", "level4", k]))

    print(f"Total strings to translate: {len(to_translate)}")
    
    translated_texts = []
    chunk_size = 35
    for i in range(0, len(to_translate), chunk_size):
        chunk = to_translate[i:i+chunk_size]
        print(f"Translating chunk {i//chunk_size + 1}/{(len(to_translate)-1)//chunk_size + 1}...")
        translated_chunk = batch_translate(chunk)
        translated_texts.extend(translated_chunk)
        time.sleep(1.0)
        
    print(f"Translation completed. Rebuilding structure...")
    
    km_ions = {}
    for (idx, path), trans_text in zip(keys_map, translated_texts):
        ion_id = ions_list[idx]["id"]
        if ion_id not in km_ions:
            km_ions[ion_id] = {}
            
        curr = km_ions[ion_id]
        for p in path[:-1]:
            if p not in curr:
                curr[p] = {}
            curr = curr[p]
        curr[path[-1]] = trans_text
        
    # Write to packages/data/src/locales/ions/km.js
    output_dir = "packages/data/src/locales/ions"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "km.js")
    
    js_content = f"// km ion locale data\nexport const km_ions = {json.dumps(km_ions, indent=2, ensure_ascii=False)};\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Successfully wrote Khmer ions translation to {output_path}")
    return True

if __name__ == "__main__":
    translate_ions()
