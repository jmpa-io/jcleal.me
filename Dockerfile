FROM texlive/texlive:TL2020-historic

# install deps.
RUN apt-get update && apt-get install -y \
    pandoc \
    fonts-firacode
