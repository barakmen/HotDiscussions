# Loadtests Using K6:

In order to run the loadtests you can following the turorial on medium [here](https://medium.com/codeinsights/how-to-load-test-your-node-js-app-using-k6-74d7339bc787).

Or simply do the following steps:
1. Download k6 from [here](https://github.com/loadimpact/k6/releases).
2. Extract the downloaded zip and use the terminal to `cd` into the extracted folder.
3. copy the file: `<cloned-repository-folder>/server/load_tests/firsttest.js`
3. from the extracted folder run `k6 run <cloned-repository-folder>/server/load_tests/firsttest.js`


Install influxdb and go on Windows: [here](https://stackoverflow.com/questions/26116711/how-to-install-influxdb-in-windows)