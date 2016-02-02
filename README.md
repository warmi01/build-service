# build-service
CI Build Service for Jenkins

To use:

install node.js: https://nodejs.org/en/

Then:

git clone https://github.com/warmi01/build-service.git

cd build-service

npm install

npm start (or debug via 'npm run-script debug')


From a local browser:

list Jenkins jobs: 0.0.0.0:3000/jobs
create job: 0.0.0.0:3000/jobs/[job name]
delete job: 0.0.0.0:3000/jobs/[job name]
get specific job: 0.0.0.0:3000/jobs/[job name]
run specific job build: 0.0.0.0:3000/jobs/[job name]/builds
get specific job build: 0.0.0.0:3000/jobs/[job name]/builds/[build number]

