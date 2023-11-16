FROM node:16.14.1

WORKDIR /code

COPY . /code

RUN npm install

RUN npm run build

EXPOSE 8080