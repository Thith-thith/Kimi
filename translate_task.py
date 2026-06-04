import json
import re
import os
import sys
import time
from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='en', target='km')

def batch_translate(texts):
    """
    Translates a list of strings in a single batch to minimize API requests and avoid rate limits.
    """
    if not texts:
        return []
    
    # Pre-process placeholders in each text
    processed_texts = []
    placeholders_map = {}
    
    for idx, text in enumerate(texts):
        if not isinstance(text, str) or not text.strip() or text.isdigit() or re.match(r'^[^a-zA-Z]+$', text):
            processed_texts.append(text)
            continue
            
        placeholders = re.findall(r"\{[^}]+\}", text)
        temp_text = text
        placeholders_map[idx] = placeholders
        
        for p_idx, placeholder in enumerate(placeholders):
            # Use unique placeholder tags that Google Translate won't touch
            temp_text = temp_text.replace(placeholder, f" __PH_{idx}_{p_idx}__ ")
            
        processed_texts.append(temp_text)
        
    # Join texts with newline to translate in one go
    combined_text = "\n".join([t if isinstance(t, str) else "" for t in processed_texts])
    
    try:
        translated_combined = translator.translate(combined_text)
        if not translated_combined:
            raise ValueError("Empty translation response")
            
        translated_list = translated_combined.split("\n")
        
        # Verify sizes match
        if len(translated_list) != len(texts):
            print(f"Warning: Batch size mismatch (expected {len(texts)}, got {len(translated_list)}). Falling back to individual translation.")
            return [translate_individual_text(t, idx, placeholders_map.get(idx, [])) for idx, t in enumerate(processed_texts)]
            
        # Post-process to restore placeholders
        final_list = []
        for idx, (original, translated) in enumerate(zip(texts, translated_list)):
            if not isinstance(original, str) or not original.strip():
                final_list.append(original)
                continue
                
            p_list = placeholders_map.get(idx, [])
            for p_idx, placeholder in enumerate(p_list):
                pattern = re.compile(rf"\s*__PH_{idx}_{p_idx}__\s*|\s*__ph_{idx}_{p_idx}__\s*|\s*__\s*PH_{idx}_{p_idx}\s*__\s*", re.IGNORECASE)
                translated = pattern.sub(placeholder, translated)
            final_list.append(translated)
            
        return final_list
        
    except Exception as e:
        print(f"Batch translation failed: {e}. Falling back to individual translation.")
        return [translate_individual_text(t, idx, placeholders_map.get(idx, [])) for idx, t in enumerate(processed_texts)]

def translate_individual_text(text, idx, placeholders):
    if not isinstance(text, str) or not text.strip():
        return text
    try:
        # Rate limit friendly delay
        time.sleep(0.5)
        translated = translator.translate(text)
        if not translated:
            return text
        for p_idx, placeholder in enumerate(placeholders):
            pattern = re.compile(rf"\s*__PH_{idx}_{p_idx}__\s*|\s*__ph_{idx}_{p_idx}__\s*", re.IGNORECASE)
            translated = pattern.sub(placeholder, translated)
        return translated
    except Exception as e:
        print(f"Individual translate failed for '{text}': {e}")
        return text

def translate_elements():
    print("Reading elements.ts...")
    elements_file_path = "packages/data/src/elements.ts"
    if not os.path.exists(elements_file_path):
        print(f"Error: {elements_file_path} not found.")
        return False
        
    with open(elements_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract id and name
    pattern = r'"id":\s*(\d+),\s*"symbol":\s*"[^"]+",\s*"name":\s*"([^"]+)"'
    matches = re.findall(pattern, content)
    if not matches:
        pattern = r'"id":\s*(\d+)[\s\S]*?"name":\s*"([^"]+)"'
        matches = re.findall(pattern, content)
        
    print(f"Found {len(matches)} elements. Batch translating names in chunks of 30...")
    
    ids = [m[0] for m in matches]
    names = [m[1] for m in matches]
    
    translated_names = []
    chunk_size = 30
    for i in range(0, len(names), chunk_size):
        chunk = names[i:i+chunk_size]
        print(f"Translating elements {i+1} to {min(i+chunk_size, len(names))}...")
        translated_chunk = batch_translate(chunk)
        translated_names.extend(translated_chunk)
        time.sleep(1.0) # Small delay between chunks
        
    km_elements_data = {}
    for el_id, el_name, tr_name in zip(ids, names, translated_names):
        print(f"Element {el_id}: {el_name} -> {tr_name}")
        km_elements_data[el_id] = {
            "name": tr_name
        }
        
    # Generate packages/data/src/locales/km.js
    locales_dir = "packages/data/src/locales"
    os.makedirs(locales_dir, exist_ok=True)
    js_content = "export const km_elements = " + json.dumps(km_elements_data, indent=2, ensure_ascii=False) + ";\n"
    
    output_path = os.path.join(locales_dir, "km.js")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Successfully wrote elements translation to {output_path}")
    return True

# Helper to flatten and unflatten JSON for batch translation
def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            for i, item in enumerate(v):
                items.extend(flatten_dict({f"[{i}]": item}, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def unflatten_dict(d, sep='.'):
    result = {}
    for key, value in d.items():
        parts = key.split(sep)
        curr = result
        for i, part in enumerate(parts[:-1]):
            # Check if next part is an array index like [0]
            next_part = parts[i+1]
            is_array = next_part.startswith('[') and next_part.endswith(']')
            
            if is_array:
                # Array index logic
                arr_idx = int(next_part[1:-1])
                if part not in curr:
                    curr[part] = []
                # Ensure array is long enough
                while len(curr[part]) <= arr_idx:
                    curr[part].append(None)
                # If we're at the end or if the next object needs to be created
                if i + 1 == len(parts) - 1:
                    curr[part][arr_idx] = value
                else:
                    if curr[part][arr_idx] is None:
                        curr[part][arr_idx] = {}
                    curr = curr[part][arr_idx]
                break # Since we handled the next part as an array index, break the inner loop or skip
            else:
                if part.startswith('[') and part.endswith(']'):
                    # Handled by array code
                    pass
                else:
                    if part not in curr:
                        curr[part] = {}
                    curr = curr[part]
        
        # Leaf assignment
        last_part = parts[-1]
        if not last_part.startswith('['):
            curr[last_part] = value
            
    return result

def translate_messages():
    print("Reading en.json...")
    en_json_path = "apps/web/src/i18n/messages/en.json"
    if not os.path.exists(en_json_path):
        print(f"Error: {en_json_path} not found.")
        return False
        
    with open(en_json_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
        
    print("Flattening UI messages...")
    flat_data = flatten_dict(en_data)
    keys = list(flat_data.keys())
    values = [flat_data[k] for k in keys]
    
    print(f"Found {len(values)} strings. Batch translating in chunks of 30...")
    translated_values = []
    chunk_size = 30
    for i in range(0, len(values), chunk_size):
        chunk = values[i:i+chunk_size]
        print(f"Translating chunk {i//chunk_size + 1}/{(len(values)-1)//chunk_size + 1}...")
        translated_chunk = batch_translate(chunk)
        translated_values.extend(translated_chunk)
        time.sleep(1.0)
        
    # Rebuild flat dict and unflatten it
    translated_flat = dict(zip(keys, translated_values))
    km_data = unflatten_dict(translated_flat)
    
    # Fix potential None values in lists if any index was skipped
    def clean_lists(d):
        if isinstance(d, dict):
            return {k: clean_lists(v) for k, v in d.items()}
        elif isinstance(d, list):
            return [clean_lists(v) for v in d if v is not None]
        return d
        
    km_data = clean_lists(km_data)
    
    output_path = "apps/web/src/i18n/messages/km.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(km_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully wrote messages translation to {output_path}")
    return True

if __name__ == "__main__":
    print("--- Starting Khmer Translation Integration (Batch Mode) ---")
    if not translate_elements():
        sys.exit(1)
    if not translate_messages():
        sys.exit(1)
    print("--- Khmer Translation Completed Successfully ---")
