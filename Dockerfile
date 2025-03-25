FROM node:18

WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
