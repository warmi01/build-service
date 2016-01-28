# build-service
CI Build Service for Jenkin

To use:

install node.js: https://nodejs.org/en/

Then:

git clone https://github.com/warmi01/build-service.git
cd build-service
npm install
npm start

From a local browser:

list Jenkins jobs: 0.0.0.0:3000/job
get specific job: 0.0.0.0:3000/job/[job name]
get specific job config: 0.0.0.0:3000/job/config/[job name]
get specific job build: 0.0.0.0:3000/build/[job name]/[build number]
