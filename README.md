# Hot Discusstions App

### Install & Uninstall:
#### Installation:

1. install nodejs -> install angularjs
2. install mongo db from [MongoDB](https://www.mongodb.com/)
3. clone the current repository.
4. on the cloned reposytort run the commned: `cd startup_files`
5. in the cloned folder run the cmd commend: `HDPstartup.bat` [if you are used bash terminal run: `./HDPstartup.bat`]
    5.1: Posible errors: (Template: error => solution)
        5.1.1: "the system cannot find the file mongod" => You can modify the file "HDPstartup.bat" and set the path to the "bin/mongod" in the variable "mongodAppPath".
        5.1.2: "Pm2 is starting all the instancess but the brows is not load the page" => You can try the following steps:
            5.1.2.2: run the commend `npm install`
            5.1.2.3: run the commend `"node_modules/.bin/pm2" kill`
6. brows to `localhost:3000` and its will redirect you to the login page.

* In order to create new instance of db and url, please do the following steps:
    1. edit the startup_files/process.json, and add new object instance with the following stracture:
        ```json
        {
            apps: [{..<old-instances>..},{
                    name        : "name of the new instance",
                    script      : "boot.js",
                    force 		: true,
                    env: {
                        "PORT": "new-port-that-NOT-used in one of the <old instances>",
                        "INSTANCE": "name of the new instance"
                    }
                }]
        }
        ```
    2. Edit the server/config/database.js file, add new row in the module.export object:
            `'<name of the new instance>_url' : 'mongodb://localhost:28017/HotDiscDB_<name of the new instance>'`
    3. Edit the server/serve.js file and add new case:
        ```javascript
        switch(process.env.INSTANCE){
            case '<name of the new instance>':
            curDB = configDB.<<name of the new instance>_url>;
            break;
        }
        ```

#### Stop the server:

1. in the cloned folder run the cmd commend: `"node_modules/.bin/pm2" kill`


#### Update The Server(after installation):

In the cloned folder:

1. run `"node_modules/.bin/pm2" kill`
2. run `git pull`.
3. run `cd startup_files`
4. run `HDPstartup.bat`


### Create New Release:
In order to set new release you can run the following commend from the cloned dir: `sh release/bump_version.sh <version like 1.4>`


### Database:
* The data that saved in he server has a description [here](https://docs.google.com/document/d/1apbMwGAUWCuJoToCxUBUX-NPAr0gVeP1hmBYHStxDFE/edit?usp=sharing)


### Git workflow:
The git workflow in this project is as described in Vincent Driessen`s article [here](http://nvie.com/posts/a-successful-git-branching-model/).
You can see an example repository for that in [TestDriessenGitModle](https://github.com/barakmen/TestDriessenGitModle) github project.
To see a grafical GUI for the branches, follow the next commends in the cmd:
1. `git clone https://github.com/barakmen/TestDriessenGitModle.git`
2. `cd TestDriessenGitModle`
3. `gitk`


