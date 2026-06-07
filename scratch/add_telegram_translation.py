import os

translations = {
    "en.json": "Telegram Channel",
    "km.json": "ឆានែលតេឡេក្រាម",
    "zh.json": "Telegram 频道",
    "zh-Hant.json": "Telegram 頻道",
    "tl.json": "Telegram Channel",
    "ur.json": "ٹیلی گرام چینل",
    "fa.json": "کانال تلگرام",
    "fr.json": "Canal Telegram",
    "ru.json": "Telegram-канал"
}

def main():
    dir_path = "/Users/tt/projects/personal/Kimi/apps/web/src/i18n/messages"
    for filename, text in translations.items():
        filepath = os.path.join(dir_path, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        new_lines = []
        replaced = False
        for line in lines:
            new_lines.append(line)
            if '"coffeeDesc":' in line and not replaced:
                # Get the indentation of the line
                indent = len(line) - len(line.lstrip())
                indent_str = " " * indent
                new_lines.append(f'{indent_str}"telegram": "{text}",\n')
                replaced = True
                
        if replaced:
            with open(filepath, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            print(f"Added telegram translation to {filename}")
        else:
            print(f"Could not find coffeeDesc key in {filename}")

if __name__ == "__main__":
    main()
