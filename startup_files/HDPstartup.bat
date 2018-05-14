date /t
set currentFolder="startup_files"

set nodeModules="node_modules"
if not exist %nodeModules% REM installing npm...
if not exist %nodeModules% CMD /C npm install


REM booting our HDP database...
set mongodApp=C:/bin/mongod
start %mongodApp% --config mongodb.conf

timeout 5

REM pm2 is an npm package that restarts after crashing - restarts node in case of crashing to keep the server live
set pm2App=node_modules/.bin/pm2

:: as of end of October we are going to use a cluster of apps running, each for clients and a single app for testing environment
:: each app will be running on its unique port. Testing:3000, Benzi:3001, Baruch:3002, Tsafrir:3003.
:: TEMP!! each app will be running on its unique port. Testing:3003, Benzi:3001, Baruch:3002, Tsafrir:3001.

REM starting node app on 4 different instances 
%pm2App% start %currentFolder%/process.json
::%pm2App% delete all

