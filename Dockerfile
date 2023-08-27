FROM node:lts-alpine

RUN apk add --no-cache tini

ENV NODE_ENV production
USER node

WORKDIR /app

COPY --chown=node:node . ./

RUN npm i

EXPOSE 3000

CMD [ "node", "src/index.js" ]