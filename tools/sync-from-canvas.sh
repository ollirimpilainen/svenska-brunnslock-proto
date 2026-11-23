#!/bin/sh
# Kopioi canvaksen artboardit protoon. Käyttö: tools/sync-from-canvas.sh <canvaksen project-kansio>
set -e
SRC="$1"
DST="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$SRC" ] || { echo "Anna canvaksen project-kansio"; exit 1; }
for f in "$SRC"/Fi*.dc.html "$SRC"/Sv*.dc.html; do
  sed 's#/_blob/e43e04a998d517567fdbb2bd03534f9a#img/mattskiss-ring.jpg#g' "$f" > "$DST/$(basename "$f")"
done
echo "Kopioitu: $(ls "$DST"/*.dc.html | wc -l | tr -d ' ') artboardia"
