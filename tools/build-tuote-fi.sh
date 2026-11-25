#!/bin/sh
# Generoi suomenkielisen tuotesivupohjan ruotsin lähdetiedostosta.
# Logiikka ja molempien kielten tekstit ovat SvProdukt.dc.html:ssä; FI-tiedosto eroaa vain kielen, headerin ja footerin osalta.
cd "$(dirname "$0")/.." || exit 1
sed -e 's/<html lang="sv">/<html lang="fi">/' \
    -e 's#<title>Produkt</title>#<title>Tuote</title>#' \
    -e 's/name="SvHeader"/name="FiHeader"/' \
    -e 's/name="SvFooter"/name="FiFooter"/' \
    -e "s/const LANG = 'sv';/const LANG = 'fi';/" \
    SvProdukt.dc.html > FiTuote.dc.html
echo "FiTuote.dc.html päivitetty"
