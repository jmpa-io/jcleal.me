FROM pandoc/core:2.11.3.1
RUN apk add --no-cache \
    texmf-dist=2020.54593-r0 \
    texlive=20190410-r13 \
    && rm -rf /var/cache/apk
