FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY index.js ./
COPY users.txt ./
COPY config.txt ./
EXPOSE 5000
CMD [ "node", "index.js" ]
