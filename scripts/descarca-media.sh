#!/bin/bash
# Descarca fisierele media din WordPress, pastrand structura an/luna.
DEST="${1:-/home/user/teona/public/poze}"
LISTA="${2:-/home/user/teona/scripts/media-urls.txt}"
ESEC="/home/user/teona/scripts/esecuri.txt"
descarca() {
  u="$1"
  rel="${u#*/wp-content/uploads/}"
  out="$DEST/$rel"
  [ -s "$out" ] && return 0
  mkdir -p "$(dirname "$out")"
  curl -sS -f --max-time 90 -o "$out" "$u" || { echo "$u" >> "$ESEC"; rm -f "$out"; }
}
export -f descarca; export DEST ESEC
: > "$ESEC"
xargs -P 8 -I{} bash -c 'descarca "$@"' _ {} < "$LISTA"
echo "fisiere: $(find "$DEST" -type f | wc -l)"
echo "marime : $(du -sh "$DEST" | cut -f1)"
echo "esecuri: $(wc -l < "$ESEC")"
