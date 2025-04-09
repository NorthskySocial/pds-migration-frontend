FROM debian:bookworm

RUN apt-get update

RUN apt install -y curl

# Use bash for the shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Create a script file sourced by both interactive and non-interactive bash shells
ENV BASH_ENV /root/.bash_env
RUN touch "${BASH_ENV}"
RUN echo '. "${BASH_ENV}"' >> ~/.bashrc

# Download and install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | PROFILE="${BASH_ENV}" bash

WORKDIR /app

ARG GITHUB_TOKEN

RUN echo -e "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}\n@northskysocial:registry=https://npm.pkg.github.com/" > ~/.npmrc

COPY .nvmrc .

RUN nvm install

COPY .gitignore . 
COPY .gitmodules .
COPY package.json . 
COPY package-lock.json .

RUN npm install


ADD ./public ./public

COPY jest-puppeteer.config.js . 
COPY jest.config.js . 
COPY wrangler.toml .
COPY vite.config.ts . 
COPY tsconfig.tests.json . 
COPY tsconfig.json . 
COPY tsconfig.build.json . 
COPY react-router.config.ts . 

ADD ./test ./test
ADD ./util ./util
ADD ./workers ./workers
ADD ./app ./app

RUN npm run typecheck

EXPOSE 5173:5173

CMD [ "/bin/bash", "-c", "npm run dev -- --host"]