FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
run npm install

COPY . .
EXPOSE 8011
CMD [ "npm", "run", "start:prod" ]
# CMD [ "npm", "start"]
