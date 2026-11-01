# NOTE: keep in step with the hugo version used by the e2e suite (see README).
FROM hugomods/hugo:exts-0.139.0

# setup user.
ARG UID=1000
ARG GID=1000
RUN addgroup -S $GID
RUN adduser -S $UID -G $GID
USER $UID:$GID

# setup entrypoint.
ENTRYPOINT ["hugo"]
