# Load Tests Using Jmeter:

First thing first:
1. Install [java](https://java.com/en/download/) and then [Jmeter](https://jmeter.apache.org/download_jmeter.cgi).
2. You need to add extention to Jmeter called [Jmeter - WebSocket Sampler](https://oseublog.wordpress.com/2017/06/25/setting-up-jmeter-for-socket-io-test/) please follow on the instraction their. After the installation you can use is as described [here](https://medium.com/@tomokazukozuma/load-test-of-socket-io-using-jmeter-websocketsampler-f8c6fb1009c2).

## How to start the tests?
1. Open Jmeter.
2. In Jmeter:
    
    2.1 Click File->Open->and choose the file from `<this cloned folder>/server/load_tests/HDP Load Tests.jmx`.
    
    2.2 Whenever CSV file is loading change the path to the csv file to the files: "random discusstions.csv" or "random users.csv" accurdingly.

    2.3 Run the tests by clicking on the green arrow button. 

## What it test?
The load tests are simulates the behavior of users and admin, as bellow:

*Admin*:
1. Register to the system
2. Login into the system.
3. Get all the current discusstions.
4. Post new discusstions.

*User*:
1. Register to the system
2. Login into the system.
3. Get all the current discusstions.
4. Getting into exist discusstion.

Using Jmeter you can see graph of time by adding "aggregate graph" to the thread group.