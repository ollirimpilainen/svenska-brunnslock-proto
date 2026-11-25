#!/bin/sh
# Generoi suomiversion yleisestä kategoriasivusta ruotsin lähdetiedostosta.
# Logiikka ja molempien kielten tekstit ovat SvSortiment.dc.html:ssä; FI-tiedosto eroaa vain kielen, otsikon, headerin ja linkkien osalta.
cd "$(dirname "$0")/.." || exit 1
sed -e 's/<html lang="sv">/<html lang="fi">/' \
    -e 's#<title>Sortiment</title>#<title>Valikoima</title>#' \
    -e 's/name="SvHeader"/name="FiHeader"/' \
    -e 's/name="SvFooter"/name="FiFooter"/' \
    -e 's/href="SvProduktguide.dc.html"/href="FiTuoteapuri.dc.html"/' \
    -e "s/const LANG = 'sv';/const LANG = 'fi';/" \
    SvSortiment.dc.html > FiValikoima.dc.html
echo "FiValikoima.dc.html päivitetty"
