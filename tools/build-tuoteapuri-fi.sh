#!/bin/sh
# Generoi suomiversion tuoteapureista ruotsin lähdetiedostosta.
# Logiikka ja molempien kielten tekstit ovat SvProduktguide.dc.html:ssä; FI-tiedosto eroaa vain kielen, otsikon ja headerin osalta.
cd "$(dirname "$0")/.." || exit 1
sed -e 's/<html lang="sv">/<html lang="fi">/' \
    -e 's#<title>Hitta rätt produkt</title>#<title>Löydä oikea tuote</title>#' \
    -e 's/name="SvHeader"/name="FiHeader"/' \
    -e 's/name="SvFooter"/name="FiFooter"/' \
    -e "s/const LANG = 'sv';/const LANG = 'fi';/" \
    SvProduktguide.dc.html > FiTuoteapuri.dc.html
echo "FiTuoteapuri.dc.html päivitetty"
