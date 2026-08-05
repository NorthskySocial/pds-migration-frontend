FROM node:22-alpine AS development-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

FROM node:22-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --omit=dev \
    && npm cache clean --force

FROM node:22-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build -- --mode=docker

FROM node:22-alpine
RUN addgroup -S app && adduser -S app -G app
COPY ./package.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
RUN chown -R app:app /app
WORKDIR /app
USER app
CMD ["npm", "run", "start"]