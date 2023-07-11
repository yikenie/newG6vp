FROM node:16-alpine

WORKDIR /code

ADD . /code

RUN npm install

RUN npm run build

RUN npm start

EXPOSE 8080