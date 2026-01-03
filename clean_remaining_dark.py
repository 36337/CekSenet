import re
import os

# Temizlenecek dosyalar
files = [
    "F:/projects/ceksenet/frontend/src/components/AppInitializer.tsx",
    "F:/projects/ceksenet/frontend/src/components/dashboard/DurumPieChart.tsx",
    "F:/projects/ceksenet/frontend/src/components/dashboard/SonHareketler.tsx",
    "F:/projects/ceksenet/frontend/src/components/dashboard/StatCard.tsx",
    "F:/projects/ceksenet/frontend/src/components/dashboard/VadeBarChart.tsx",
    "F:/projects/ceksenet/frontend/src/components/dashboard/VadeUyarilari.tsx",
    "F:/projects/ceksenet/frontend/src/components/ui/auth-layout.tsx",
    "F:/projects/ceksenet/frontend/src/components/ui/combobox.tsx",
    "F:/projects/ceksenet/frontend/src/components/ui/description-list.tsx",
    "F:/projects/ceksenet/frontend/src/components/ui/divider.tsx",
    "F:/projects/ceksenet/frontend/src/components/ui/stacked-layout.tsx",
]

total_removed = 0

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_length = len(content)
        
        # dark: ile baslayan class'lari kaldir
        new_content = re.sub(r' dark:[^\s"\'>\n]+', '', content)
        
        new_length = len(new_content)
        removed = original_length - new_length
        total_removed += removed
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"[OK] {os.path.basename(file_path)}: {removed} karakter kaldirildi")
    except Exception as e:
        print(f"[ERROR] {file_path}: {e}")

print(f"\n[DONE] Toplam {total_removed} karakter kaldirildi!")
