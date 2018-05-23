# Hot Discusstions App

### Install & Uninstall:
#### Installation:

0. install nodejs -> install angularjs
1. install mongo db from [MongoDB](https://www.mongodb.com/)
2. clone the current repository.
3. on the cloned reposytort run the commned: `cd startup_files`
4. in the cloned folder run the cmd commend: `HDPstartup.bat`
    3.1: Posible errors: (Template: error => solution)
        3.1.1: "the system cannot find the file mongod" => You can modify the file "HDPstartup.bat" and set the path to the "bin/mongod" in the variable "mongodAppPath".
        3.1.2: "Pm2 is starting all the instancess but the brows is not load the page" => You can try the following steps:
            3.1.2.2: run the commend `npm install`
            3.1.2.3: run the commend `"node_modules/.bin/pm2" kill`
5. brows to `localhost:3000` and its will redirect you to the login page.

#### Stop the server:

0. in the cloned folder run the cmd commend: `"node_modules/.bin/pm2" kill`

###Update The Server(after installation):
In the cloned folder:
0. run `"node_modules/.bin/pm2" kill`
1. run `git pull`.
2. run `cd startup_files`
3. run `HDPstartup.bat`

### Create New Release:
In order to set new release you can run the following commend from the cloned dir: `sh release/bump_version.sh <version like 1.4>`


### Database:
The data that saved in he server has a description [here](https://docs.google.com/document/d/1apbMwGAUWCuJoToCxUBUX-NPAr0gVeP1hmBYHStxDFE/edit?usp=sharing)

### Git workflow:
The git workflow in this project is as described in Vincent Driessen`s article [here](http://nvie.com/posts/a-successful-git-branching-model/).
You can see an example repository for that in [TestDriessenGitModle](https://github.com/barakmen/TestDriessenGitModle) github project.
To see a grafical GUI for the branches, follow the next commends in the cmd:
1. `git clone https://github.com/barakmen/TestDriessenGitModle.git`
2. `cd TestDriessenGitModle`
3. `gitk`


