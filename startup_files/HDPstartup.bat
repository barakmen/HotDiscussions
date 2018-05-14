date /t
@echo on
echo echo turned on
date /t

REM booting our HDP database
call npm install
REM REM  start mongod --config C:\Users\srominm\Documents\Projects\HotDiscussions\DB\mongodb.conf

timeout 5

REM pm2 is an npm package that restarts after crashing - restarts node in case of crashing to keep the server live

set pm2App=../node_modules/.bin/pm2

REM boot starts our HDP server
REM set serverBootApp=C:\Users\srominm\Documents\GitHub\HotDiscussionsV2/boot.js

REM as of end of October we are going to use a cluster of apps running, each for clients and a single app for testing environment
REM each app will be running on its unique port. Testing:3000, Benzi:3001, Baruch:3002, Tsafrir:3003.
REM TEMP!! each app will be running on its unique port. Testing:3003, Benzi:3001, Baruch:3002, Tsafrir:3001.

REM starting node app on 4 different instances 
REM REM %pm2App% start process.json
