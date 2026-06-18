FROM node:20-alpine

RUN apk add --no-cache ffmpeg python3 curl ca-certificates unzip \
  && curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp \
  && yt-dlp --version \
  && curl -sL https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip -o /tmp/deno.zip \
  && unzip /tmp/deno.zip -d /usr/local/bin/ \
  && rm /tmp/deno.zip \
  && chmod +x /usr/local/bin/deno \
  && deno --version

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY front-end/front-end-sbay-sdab/package*.json ./front-end/front-end-sbay-sdab/
RUN cd front-end/front-end-sbay-sdab && npm install

COPY . .

RUN npm run build
RUN cd front-end/front-end-sbay-sdab && npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
