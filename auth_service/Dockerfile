FROM cae-artifactory.jpl.nasa.gov:17001/node:8.6.0

# Setup auth_service
WORKDIR /auth_service
COPY . /auth_service

# Install npm packages
RUN npm install
CMD node app.js
