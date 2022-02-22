# A temporary image that installs dependencies and
# builds the production-ready front-end bundles.

FROM node:12-alpine as bundles
WORKDIR /usr/src/smee.io

COPY package*.json ./
COPY index.ts ./
COPY tsconfig.json ./
COPY bin ./bin

RUN ls

# Install the project's dependencies and build the bundles
RUN npm ci && npm run build && env NODE_ENV=production npm prune

RUN ls

# ------------------------------------------------------------------------------
# ------------- This is the actual container that will be built ----------------
# ------------------------------------------------------------------------------

FROM node:12-alpine
LABEL description="smee-client"

# Let's make our home
WORKDIR /usr/src/smee.io

RUN chown node:node /usr/src/smee.io -R

# This should be our normal running user
USER node

# Copy our dependencies
COPY --chown=node:node --from=bundles /usr/src/smee.io/node_modules /usr/src/smee.io/node_modules
COPY --chown=node:node --from=bundles /usr/src/smee.io/index.js /usr/src/smee.io/index.js

# We should always be running in production mode
ENV NODE_ENV production

# Copy various scripts and files
COPY --chown=node:node bin ./bin
COPY --chown=node:node package*.json ./
COPY --chown=node:node etc ./etc

CMD ["node", "bin/smeed.js", "--file", "etc/smee.json" ]
