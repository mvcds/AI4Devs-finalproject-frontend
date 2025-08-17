FROM node:22.7-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${FRONTEND_PORT:-3001}

CMD ["sh", "-c", "npm run build && npm run start"]