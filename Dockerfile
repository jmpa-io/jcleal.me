FROM texlive/texlive:TL2020-historic

# install deps.
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    fonts-firacode \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
