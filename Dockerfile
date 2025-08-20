FROM node:22.7-alpine

WORKDIR /app

COPY package*.json ./

# TODO: Remove --omit=optional when ai4devs-api-client is published for real in NPM
# We also need to remove its installation from the compose file
RUN npm install --no-fund --no-audit --omit=optional

COPY . .

EXPOSE ${FRONTEND_PORT:-3001}

CMD ["sh", "-c", "npm run build && npm run start"]