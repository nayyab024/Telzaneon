# Telza AI website: static pages plus the small Node server that receives the forms.
FROM node:20-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4879 \
    TELZA_DATA_DIR=/app/data

WORKDIR /app

# No npm dependencies: copy the site and run it as the unprivileged node user.
COPY --chown=node:node . .
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 4879
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "server.cjs"]
