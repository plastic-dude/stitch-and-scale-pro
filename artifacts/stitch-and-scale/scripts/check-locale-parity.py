import os
import re
import sys

# P2: CI/CD Locale Parity Gate
# This script ensures that all supported locales have 1:1 key parity with English.
# It prevents "English leak" in foreign UI by failing the build if keys are missing.

LOCALES = ['de', 'fr', 'es', 'pt']
BASE_DIR = os.path.join(os.path.dirname(__file__), '../src/lib')

def extract_keys(content, locale):
    # Matches: locale: { ... }
    pattern = rf'{locale}:\s*\{{(.*?)\}}'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return set()
    block = match.group(1)
    # Matches: key: "value" or "key": "value"
    keys = re.findall(r'(\w+|[\'"][\w-]+[\'"]):\s*', block)
    return {k.strip("'").strip('"') for k in keys}

def check_file(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        return []

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    en_keys = extract_keys(content, 'en')
    if not en_keys:
        return []

    errors = []
    for locale in LOCALES:
        keys = extract_keys(content, locale)
        missing = en_keys - keys
        if missing:
            errors.append(f"{filename}: Missing in '{locale}': {', '.join(sorted(missing))}")
    
    return errors

def main():
    copy_files = [f for f in os.listdir(BASE_DIR) if f.endswith('-copy.ts') or f.endswith('-labels.ts')]
    
    all_errors = []
    for f in copy_files:
        all_errors.extend(check_file(f))
    
    if all_errors:
        print("\n❌ LOCALIZATION PARITY ERRORS FOUND:")
        for err in all_errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("✅ All localization files have perfect key parity.")
        sys.exit(0)

if __name__ == "__main__":
    main()
