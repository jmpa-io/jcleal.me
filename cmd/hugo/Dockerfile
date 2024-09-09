FROM klakegg/hugo:0.78.2-alpine

# setup user.
RUN addgroup -S mygroup && adduser -S 1000 -G mygroup
USER 1000:mygroup

# setup entrypoint.
ENTRYPOINT ["hugo"]
