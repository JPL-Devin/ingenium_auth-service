FROM node:22.14.0

# Setup auth_service
WORKDIR /auth_service
COPY . /auth_service

# Install npm packages
RUN npm install
CMD node app.js
