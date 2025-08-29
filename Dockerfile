FROM node:22.7-alpine

WORKDIR /app

COPY package*.json ./

# TODO: Remove --no-optional --omit=optional for ai4devs-api-client when that is published for real in NPM
# We also need to remove its installation from the compose file
RUN npm install --no-fund --no-audit --no-optional --omit=optional

COPY . .

EXPOSE ${FRONTEND_PORT:-3001}

CMD ["sh", "-c", "npm run build && npm run start"]