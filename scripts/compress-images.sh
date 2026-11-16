#!/bin/zsh
# Сжимает фото упражнений из free-exercise-db: ширина 480px, JPEG q=55
# Использование: scripts/compress-images.sh <путь к free-exercise-db/exercises> <выходная папка>
SRC="$1"; OUT="$2"
for f in "$SRC"/*/*.jpg; do
  rel="${f#$SRC/}"; dst="$OUT/$rel"
  [[ -f "$dst" ]] && continue
  mkdir -p "$(dirname "$dst")"
  sips -s format jpeg -s formatOptions 55 --resampleWidth 480 "$f" --out "$dst" >/dev/null 2>&1
done
echo done; du -sh "$OUT"
