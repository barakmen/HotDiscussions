module.exports = function(autoIncrement, io){

    var Discussion = require('../models/discussion');
    var User = require('../models/user');
    var Pm = require('../models/pm');
    var Chat = require('../models/chat');
    var usersGroup = require('../models/users_group');
    var Argument = require('../models/argument')(autoIncrement);
    var Support = require('../models/support')(autoIncrement);
    var nodemailer = require('nodemailer');
    var express = require('express');
    var router = express.Router();
    var fs = require('fs');

    var discussionDuplicator = require('../tools/discussionDuplicator')(autoIncrement);

    var discussionNsp = io.of('/discussions');
    var argumentsNsp = io.of('/arguments');
    
    var allScokets = {};

	/**
     * Export csv of all the db
     */ 
    router.get('/exporttocsv', function(req, res, next) {
        var filename   = "Database.csv";
        var dataArray;
        
        var allDb = {};
        const Json2csvParser = require('json2csv').Parser;
        try {
            Discussion.find().lean().exec({}, function(err, discRes) {
                if (err) res.send(err);          
                allDb.discussions = new Json2csvParser({withBOM:'EF BB BF'}).parse(discRes);
                User.find().lean().exec({}, function(err, users) {
                    if (err) res.send(err);   
                    var userArr = [];
                    for(u in users){
                        userArr.push(users[u].local);
                    }
                    allDb.users = new Json2csvParser({withBOM:'EF BB BF'}).parse(userArr);
                    usersGroup.find().lean().exec({}, function(err, usersGroups) {
                        if (err) res.send(err);   
                        allDb.usersGroups = new Json2csvParser({withBOM:'EF BB BF'}).parse(usersGroups);
                        
                        Pm.find().lean().exec({}, function(err, pms) {
                            if (err) res.send(err);   
                            allDb.pms = pms;
                            Argument.find().lean().exec({}, function(err, arguments) {
                                if (err) res.send(err);   
                                allDb.arguments = new Json2csvParser({withBOM:'EF BB BF'}).parse(arguments);
                                Chat.find().lean().exec({}, function(err, chats) {
                                    if (err) res.send(err);   
                                    allChatMessages = [];
                                    for(chatindex in chats){
                                        chats[chatindex].chatId = chatindex;
                                        for(messageindex in chats[chatindex].messages){
                                            message = chats[chatindex].messages[messageindex];
                                            message.inChatId = chatindex;
                                            allChatMessages.push(message);
                                        }
                                    }

                                    allDb.chats = new Json2csvParser({withBOM:'EF BB BF'}).parse(chats);
                                    allDb.allChatMessages = new Json2csvParser({withBOM:'EF BB BF'}).parse(allChatMessages);

                                    
                                    var zip = new require('node-zip')();
                                    zip.file("Users.csv", allDb.users);
                                    zip.file("UsersGroups.csv",  allDb.usersGroups);
                                    zip.file("Discussions.csv",  allDb.discussions);
                                    zip.file("Pms.csv",  allDb.pms);
                                    zip.file("Arguments.csv",  allDb.arguments);
                                    zip.file("Chats.csv",  allDb.chats);
                                    zip.file("ChatMessages.csv",  allDb.allChatMessages);
                                    var content = zip.generate({base64:false,compression:'DEFLATE'});
                                    res.end(content,"binary");
                                });
                                
                            });


                        });


                        
                    });
                });
            });
        } catch (err) {
            res.send(err);
        }
    
     });
   

    
    var sortArgs = function (args){
        var remove = function(arr, item){
            var index = arr.indexOf(item);
            if (index > -1) {
                arr.splice(index, 1);
            }
        }
        var sortByIncTime = (argA,argB) => {
            if(argA.createdAt < argB.createdAt){
                return -1;
            }
            if (argA.createdAt > argB.createdAt){
                return 1;
            }
            else{
                return 0;
            }
        };
        args.sort(sortByIncTime);
        for(let i in args){
            var currentArg = args[i];
            if(currentArg.parent_id != 0){
                for(let j in args){
                    var parentArg = args[j];
                    if(currentArg.parent_id == parentArg._id){
                        if(parentArg.sub_arguments){
                            parentArg.sub_arguments.push(currentArg);
                        }else{
                            parentArg.sub_arguments = [currentArg];
                        }
                    }
                }
            }
        }
        let mainArgs = args.filter((arg) => arg.parent_id == 0);

        let flatNestedArray = function (argsNestedArr){
            return argsNestedArr.reduce((acc, arg) => {
                if(Array.isArray(arg.sub_arguments) && arg.sub_arguments.length > 0){
                    return acc.concat([arg,...flatNestedArray(arg.sub_arguments)]);
                }else{
                    return acc.concat(arg);
                }
            }, []);
        }
        return flatNestedArray(mainArgs);
    }

    var argsToDiscussionFormatCSV = function(args, fields){
        const Json2csvParser = require('json2csv').Parser;
        const endline = '\r\n';
        const headers = new Json2csvParser({withBOM:true, fields}).parse([{}]);
        
        const addNoneFieldsCsvFormat = function (row, numOfNone, delimiter){
            let res = '';
            while(numOfNone > 0){
                res += '""' + delimiter;
                numOfNone--;
            }
            return res + row;
        }  

        const argToCsv = function(arg){            
            let argcsv = '';
           
            argcsv += new Json2csvParser({header:false, fields}).parse([arg]);
            let res = argcsv + ',"",┇┃,"",' + addNoneFieldsCsvFormat(argcsv, arg.depth, ',');
            return arg.parent_id == 0? endline + res : res;
        }
        const reducer = (accumulator, currentArg) => accumulator + argToCsv(currentArg) + endline;
        
        var argscsv = args.reduce(reducer, headers);
        return argscsv;
    }

    router.post('/exporttocsv/:discid/:disctitle', function(req, res, next) {
        var discid = req.params.discid;
        var disctitle = req.params.disctitle;
        try{
            Discussion.find({_id: discid}).lean().exec({}, function(err, discRes) {
                if (err) { res.send(err); return; }
                Argument.find({disc_id: discid}).lean().exec({}, function(err, args) {
                    if (err) { res.send(err); return; } 
                    var jsdom = require('jsdom');
                    const { JSDOM } = jsdom;
                    const { window } = new JSDOM();
                    const { document } = (new JSDOM('')).window;
                    global.document = document;
                    var $ = jQuery = require('jquery')(window);
                    args.map((arg) => arg.content = $('<html><body>' + arg.content + '</body></html>').text());
                    let fields = ['fname', 'lname', 'content', 'createdAt','_id', 'parent_id', 'depth'];
                    var argsFormated = argsToDiscussionFormatCSV(sortArgs(args.filter(arg => !arg.isReflection)), fields);
                    res.send(new Buffer(argsFormated));
                });
            });
        
        }
        catch (err){
            res.send(err);
        }
    });


     /***
     *          _ _                        _
     *         | (_)                      (_)
     *       __| |_ ___  ___ _   _ ___ ___ _  ___  _ __  ___
     *      / _` | / __|/ __| | | / __/ __| |/ _ \| '_ \/ __|
     *     | (_| | \__ | (__| |_| \__ \__ | | (_) | | | \__ \
     *      \__,_|_|___/\___|\__,_|___|___|_|\___/|_| |_|___/
     *
     *
     */

   
     //get all the discussions by the role
    //TODO: show the discussions that the requesting user is registred to only.
    //    this may be unnecassary for the future, and just get the arguments of the relevant discussion for
    //    non-admin user.

    var getAllGroupsConsistsOfUser = function(user_id){
        usersGroup.find({users: { $in : [user_id]}},function(err, groups){
            return groups;
        });
    };

    router.get('/discussions', function(req, res, next) {
        var user = req.session.passport.user;
        var groupsOfUser = usersGroup.find({users: { $in : [user.id]}});
        usersGroup.find({users: { $in : [user.id]}}, {_id:1},function(err, groupsOfUser){
            if (user){
                var role = user.role;
                switch (role) {
                    case "admin":
                        Discussion.find().lean().exec( function(err, discs){
                            //for sync foreach
                            var discProcessed = 0;

                            if(discs.length == 0){
                                User.find({}, function(err, users){
                                    var data = {discs : discs, users : users};
                                    res.json(data);
                                });
                            }
                            else{
                                discs = discs.reverse();
				                if(req.query.numOfDiscussions != 'All' ){
                                    discs = discs.slice(0, req.query.numOfDiscussions);
                                }
                                discs.forEach(function(disc){
                                    Argument.count({$or: [{disc_id:disc._id, isReflection: false}, {disc_id:disc._id, isReflection: null}]}, function(err, count){
                                        disc.args_count = count;
                                        discProcessed++;
                                        if(discProcessed == discs.length){
                                            User.find({}, function(err, users){
                                                usersGroup.find({}, function(err, groups){
                                                    var data = {discs : discs, users : users, groups:groups};
                                                    res.json(data);
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });
                        break;

                    case "student":
                        Discussion.find({restriction: "student", $or: [{users_group_id: {$in: groupsOfUser}},{users_group_id:null}]}).lean().exec( function(err, discs){
                            //for sync foreach
                            var discProcessed = 0;

                            if(discs.length == 0){
                                resObj = {data : discs,role : role};
                                res.json(resObj);
                            }
                            else{
                                discs.forEach(function(disc){
                                    Argument.count({$or: [{disc_id:disc._id, isReflection: false}, {disc_id:disc._id, isReflection: null}]}, function(err, count){
                                        disc.args_count = count;
                                        discProcessed++;
                                        if(discProcessed == discs.length){
                                            resObj = {data : discs,role : role};
                                            res.json(resObj);
                                        }
                                    });
                                });
                            }
                        });
                        break;
                    case "instructor":
                        Discussion.find({restriction: "instructor", $or: [{users_group_id: {$in: groupsOfUser}},{users_group_id:null}]}).lean().exec( function(err, discs){
                            //for sync foreach
                            var discProcessed = 0;

                            if(discs.length == 0){
                                resObj = {data : discs,role : role};
                                res.json(resObj);
                            }
                            else{
                                discs.forEach(function(disc){
                                    Argument.count({$or: [{disc_id:disc._id, isReflection: false}, {disc_id:disc._id, isReflection: null}]}, function(err, count){
                                        disc.args_count = count;
                                        discProcessed++;
                                        if(discProcessed == discs.length){
                                            resObj = {data : discs,role : role};
                                            res.json(resObj);
                                        }
                                    });
                                });
                            }
                        });
                        break;
                }
            }
        });
    });

    //post a new discussion
    router.post('/discussions', function(req, res){
        // console.log('debugMesg: discussion post');
        var discussion = new Discussion();
        discussion.title = req.body.title;
        discussion.description = req.body.description;
        discussion.restriction = req.body.restriction;
        discussion.moderator_id = req.body.moderator_id;
        discussion.moderator_fname = req.body.moderator_fname;
        discussion.moderator_lname = req.body.moderator_lname;
        discussion.permittedPoster_id = req.body.permittedPoster_id;
        discussion.permittedPoster_fname = req.body.permittedPoster_fname;
        discussion.permittedPoster_lname = req.body.permittedPoster_lname;
        discussion.users_group_id = req.body.users_group_id;
        discussion.reflective_users_group_id = req.body.reflective_users_group_id;
        //Adding chat to discussion 09/09
        var chat = new Chat();
        discussion.chat_id = chat._id;

        chat.save(function(err, data){
            if (err)
                throw err;
            discussion.save(function(err, data){
                if (err)
                    throw err;
                res.json(data);
            });
        });
    });

    //get a specific discussion
    router.get('/discussions/:id', function(req, res){
        Discussion.findOne({_id: req.params.id}, function(err, data){
            res.json(data);
        });
    });

    //TODO: add this functionality to the front end
    router.delete('/discussions/:id', function(req, res, next){
        /*
         * the discussion gets a new status
         */
        var id = req.params.id;
        Discussion.findByIdAndUpdate(id, {$set: {isActive: false}}, function(err, disc){
            res.json(disc);
        });
    });

    //update an existing discussion
    router.put('/discussions/:id', function(req, res, next){
        var id = req.params.id;
        var body = req.body;

        Discussion.findByIdAndUpdate(id, body, {new: true}, function(err, disc){
            if (err) return next(err);
            if (!disc){
                return res.status(404).json({
                    message: 'Discussion with id ' + id + ' can not be found.'
                });
            }

            if(!body.moderator_id){
                disc.moderator_id = undefined;
                disc.moderator_fname = undefined;
                disc.moderator_lname = undefined;
            }

            if(!body.permittedPoster_id){
                disc.permittedPoster_id = undefined;
                disc.permittedPoster_fname = undefined;
                disc.permittedPoster_lname = undefined;
            }

            if(!body.users_group_id){
                disc.users_group_id = undefined;
            }

            if(!body.reflective_users_group_id){
                disc.reflective_users_group_id = undefined;
            }

            disc.save(function(err, data){
                if (err)
                    throw err;
                res.json(data);
            });
        });
    });

    var sendSupportMessageToEmail = function (data, user, currentSocket){
        let content = data.content;
        let support = new Support({
            sender_user_id: user.id,
            sender_username: user.username,
            sender_role: user.role,
            sender_fname: user.fname,
            sender_lname: user.lname,
            support_message_content: content,
        });
        
        support.save((err, data) => {
            if(err) throw err;
            //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                
                auth: {
                  user: 'benzi.hdp@gmail.com',
                  pass: fs.readFileSync('server/tmp.txt', 'utf8')
                },

                tls: {
                    rejectUnauthorized: false
                }
              });
              
              var mailOptions = {
                from: 'benzi.hdp@gmail.com',
                to: 'benzi.hdp@gmail.com',
                subject: 'הודעה על תקלה במערכת הדיונים',
                html: "<body dir=\"rtl\"><h3> המשתמש: " + support.sender_fname + " " + support.sender_lname + ", עם הזהות: "  + support.sender_user_id + ", כתב את ההודעה הבאה: </h3><p>\n\"" + support.support_message_content + "\"</p></body>"
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                  currentSocket.emit('support-email-sent');
                }
              });
        });
    };
    discussionNsp.on('connection', function(socket){

        if (socket.request.session.passport) {

            var user = socket.request.session.passport.user;

            allScokets[user.id] = socket;

            socket.on('disconnect', function () {
                delete allScokets[user.id];
            });

            socket.on('new-discussion', function (newDiscussion) {
                discussionNsp.emit('new-discussion', newDiscussion);
            });
            // socket.on('delete-discussion', function(deletedDiscussion){
            //   discussionNsp.emit('delete-discussion', deletedDiscussion);
            // });
            socket.on('edit-discussion', function (editedDiscuusion) {
                // console.log('about to emit for edit discussion to everyone');
                // console.log(editedDiscuusion._id);
                discussionNsp.emit('edit-discussion');
                argumentsNsp.to(editedDiscuusion._id).emit('edit-discussion', editedDiscuusion);
            });

            socket.on('requesting-user-info', function () {
                User.findOne({_id: user.id}, function(err, user) {
                    if (err){
                        throw err;
                    }
                    else{
                        discussionNsp.emit('sending-user-info', {userInfo:user.local.info});
                    }
                });
            });

            socket.on('updating-user-info', function (data) {
                var userInfo = data.userInfo;

                User.findByIdAndUpdate(user.id, {$set: {"local.info": userInfo}}, function(err, res) {
                    if (err){
                        throw err;
                    }
                })
            });

            socket.on('request-all-logged-users', function(){
                var loggedUsers = [];

                Object.keys(allScokets).forEach(function(sid){
                    if(allScokets[sid].request.session.passport)
                    {
                        var user = allScokets[sid].request.session.passport.user;
                        loggedUsers.push(user.fname + " " + user.lname);
                    }
                });

                socket.emit('send-all-logged-users',{loggedUsers:loggedUsers});
            });

            /*
            Users groups in dashboard
             */

            socket.on('request-users-groups', function () {
                usersGroup.find({}, function(err,groups){
                    if(err) throw err;
                    else
                        socket.emit('sending-users-groups',{users_groups : groups});
                });
            });

            socket.on('create-users-group', function (data) {
                var newGroup = new usersGroup();

                newGroup.name = data.users_group.name;
                newGroup.body_prefix = data.users_group.body_prefix;
                newGroup.users = [];

                data.users_group.users.forEach(function(user){
                    console.log("user is : " + user)
                    newGroup.users.push(user._id);
                })

                newGroup.save(function(err, data){
                    if (err)
                        throw err;
                });
            });

            socket.on('update-users-group', function (data) {

                var id = data.users_group._id;

                var updatedGroup = {};

                updatedGroup.name = data.users_group.name;
                updatedGroup.body_prefix = data.users_group.body_prefix;
                updatedGroup.users = [];

                data.users_group.users.forEach(function(user){
                    updatedGroup.users.push(user._id);
                });

                usersGroup.findByIdAndUpdate(id, updatedGroup, {new: true}, function(err, group){
                    if (err) return next(err);
                });
            });

            socket.on('new-pm', function (data) {

                var senderID = socket.request.session.passport.user.id;

                usersGroup.findById(data.group_id, function(err, group){
                    if(err) throw err;
                    else{
                        group.users.forEach(function(receiverID){
                            var newPM = new Pm();
                            newPM.sender_id = senderID;
                            newPM.receiver_id = receiverID;

                            newPM.body = data.body;
                            newPM.isRead = false;

                            newPM.save(function(err, data){
                                if (err)
                                    throw err;
                            });

                            sendPM(newPM);
                        });
                    }
                });
            });

            var sendPM = function(msg){
                var allSocketCounter = 0,
                    msgSent = false;
                Object.keys(allScokets).forEach(function(sid){
                    allSocketCounter++;
                    if(allScokets[sid].request.session.passport.user.id == msg.receiver_id){
                        allScokets[sid].emit('sending-pm',{body:msg.body});
                        msgSent = true;
                    }

                    //if user is offline, save unread message for when user comes online.
                    if((allSocketCounter==Object.keys(allScokets).length)&&(!msgSent)){
                        User.findByIdAndUpdate(msg.receiver_id, {$push: {"local.unreadMessages":msg}}, {new: true}, function(err, user){
                            if(err) throw err;
                        });
                    }
                });
            };

            socket.on('check-unread-messages',function(){
                var userID = socket.request.session.passport.user.id;
                User.findById(userID, function(err, user){
                    var unreadMsgs = user.local.unreadMessages;
                    var unreadMessagesCount = 0;
                    if(unreadMsgs){
                        unreadMsgs = unreadMsgs.reverse();
                        unreadMsgs.forEach(function(msgID){
                            unreadMessagesCount++;
                            Pm.findById(msgID,function(err,msg){
                                sendPM(msg);
                                if(unreadMsgs.length == unreadMessagesCount){
                                    User.findByIdAndUpdate(userID, {$set: {"local.unreadMessages":[]}}, {new: true}, function(err,user){
                                        if(err) throw err;
                                    });
                                }
                            })
                        });
                    };
                });
            });

            socket.on('send-support-email',function(data){
                sendSupportMessageToEmail(data, user, socket);
            });

            socket.on('update-discussion-content',function(data){
                Discussion.findByIdAndUpdate(data.disc_id, {$set: {"content":data.content}}, {new: true}, function(err, disc){
                    if(err) throw err;
                })
            });

            socket.on('requesting-discussion-content',function(data){
                Discussion.findById(data.disc_id, function(err, disc) {
                    if (err) throw err;
                    socket.emit('sending-discussion-content', {content:disc.content});
                });
            });

            socket.on('copy-discussion',function(data){
                discussionDuplicator(data.disc_id, function(res){
                    discussionNsp.emit('copied-discussion', {newDisc:res.newDisc,args_count:res.args_count});
                });
            });

            socket.on('requesting-arguments-involving-user',function(data){

                var argsIDsOfUser = [];
                Argument.find({user_id:data.user_id},function(err,argsByUser){
                    if (err) throw err;

                    var parentArgsIDs =[];

                    for(var i=0;i<argsByUser.length;i++){
                        if(argsByUser[i].parent_id)
                            parentArgsIDs.push(argsByUser[i].parent_id);
                    }

                    if(argsByUser.length==0){
                        socket.emit('sending-arguments-involving-user',[]);
                    }
                    else{
                        var count = 0;
                        argsByUser.forEach(function(arg){
                            argsIDsOfUser.push(arg._id);
                            count++;
                            if(count == argsByUser.length){
                                Argument.find({parent_id: {$in : argsIDsOfUser}},function(err,argsToUser){
                                    if (err) throw err;
                                    Argument.find({_id: {$in : parentArgsIDs}},function(err,parentArgs){
                                        if (err) throw err;
                                        var argsInvolingUser = argsByUser.concat(argsToUser.concat(parentArgs));
                                        socket.emit('sending-arguments-involving-user',argsInvolingUser);
                                    })
                                })
                            }
                        })
                    }
                });
            });
        }
    });


    /***
     *                                                 _
     *                                                | |
     *       __ _ _ __ __ _ _   _ _ __ ___   ___ _ __ | |_ ___
     *      / _` | '__/ _` | | | | '_ ` _ \ / _ | '_ \| __/ __|
     *     | (_| | | | (_| | |_| | | | | | |  __| | | | |_\__ \
     *      \__,_|_|  \__, |\__,_|_| |_| |_|\___|_| |_|\__|___/
     *                 __/ |
     *                |___/
     */

    function contains(myArray, searchTerm, property) {
        for(var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }

    argumentsNsp.on('connection', function(socket){
        //TODO: support here the "online" users utility for the different discussions rooms
        if (socket.request.session.passport && socket.request.session.passport.user) {

            var discussionId = socket.handshake.query.discussion;
            var user = socket.request.session.passport.user;

            allScokets[user.id] = socket;

            // console.log(socket.request.session.passport);
            socket.join(discussionId);
            
            argumentsNsp.to(discussionId).emit('user-joined', user);
            
            // console.log('user ' + user.username + ' joined the discussion!');

            /**
             * EVENT1
             */
            socket.on('get-all-arguments', function(){
                // console.log('getting all the arguments from server..');
                Discussion.findOne({_id: discussionId}, function(err, discussion){
                    if (err){
                        throw err;
                    }
                    else{

                        //Adding chat to discussion 09/09 -- TEMPORARY - redundant after new DB is created
                        if(discussion.chat_id == null){
                            var chat = new Chat();
                            discussion.chat_id = chat._id;

                            chat.save(function(err, data){
                                if (err)
                                    throw err;
                                Discussion.findByIdAndUpdate(discussion._id, {$set: {chat_id:chat._id}}, {new: true}, function(err, chat){
                                    if(err) throw err;
                                });
                            });
                        }

                        Chat.findById(discussion.chat_id,function(err,chat){
                            if(err) throw err;
                            if(chat == null) chat = {messages: []};
                            Argument.find({$or:[ {disc_id: discussionId}, {trimmed: true}]}, function(err, discArguments){
                                if (err){
                                    throw err;
                                }
                                if(!discArguments){
                                    console.log('ERROR retrieving the arguments..')
                                }
                                else {
                                    var onlineUsers = [];
                                    // console.log('==================================>');
                                    Object.keys(argumentsNsp.adapter.rooms[discussionId].sockets).forEach(function(sid){
                                        var aUser = argumentsNsp.sockets[sid].request.session.passport.user;
                                        // console.log(aUser);
                                        var idx = contains(onlineUsers, aUser.username, 'username');
                                        if (idx < 0) onlineUsers.push(argumentsNsp.sockets[sid].request.session.passport.user);
                                    });
                                    // console.log('<==================================');
                                    // console.log(onlineUsers);
                                    usersGroup.find({_id: discussion.reflective_users_group_id},function(err, groups){
                                        let reflactionGroup = groups[0];              
                                        socket.emit('init-discussion', {discArguments: discArguments, user:user, discussion: discussion, onlineUsers:onlineUsers, chatMessages:chat.messages, reflectiveGroup: reflactionGroup});    
                                    });
                                }
                            });
                        })
                    }
                });
            });

            /**
             * EVENT2
             */
            var saveArgument = function(argument, quotesFromThePAD, callback){
                var discRest = "";
                Discussion.findOne({_id: argument.disc_id}, function(err, disc) {
                    if (err){
                        throw err;
                    }
                    else{
                        discRest = disc.restriction;
                        // 19/08/16 - indicator whether admin posted from student or insturctor discussion
                        if(argument.role == "admin"){
                            if(discRest == "student"){
                                argument.role = "adminFromStudent"
                            }
                            else{ //instructor
                                argument.role = "adminFromInstructor"
                            }
                        }
                        else{
                            if(argument.user_id.equals(disc.moderator_id)){
                                argument.role = "moderator";
                            }
                        }

                        // saving the number of qotes from pad in the discuission
                        if(!disc.quotesFromThePAD) disc.quotesFromThePAD = [];
                        if(!quotesFromThePAD) quotesFromThePAD = [];
                        quotesFromThePAD.forEach(newQuote =>{
                            var foundQuote = disc.quotesFromThePAD.find(quote => {
                                return quote.start == newQuote.start && quote.end == newQuote.end;
                            });
                            if(foundQuote){
                                foundQuote.numOfOccurence++;
                            }else{
                                disc.quotesFromThePAD = disc.quotesFromThePAD.concat([{start: newQuote.start, end: newQuote.end, numOfOccurence:1}]);
                            }
                        });                      
                        disc.save(function (err, data){
                            if(err){throw err;} 
                        });
                        
                    }

                    //-- 27/07/16
                    if(discRest == "none")
                        return; // Inactive discussion doesn't accept new arguments.

                    argument.save(function(err, data){
                        if (err)
                            throw err;
                        //TODO: add here to save the new argument's id into its parent children array...Now not used anyway..
                        Argument.findOne({_id: argument.main_thread_id}, function(err, mainArg) {
                            // console.log('updating the timestamp of the mainThread..');
                            if (mainArg){
                                // 27/07/16 - New instructor discussion comments should not update the main thread update date - initiating a new field
                                // Not using role because of admin - should be discussion restriction based.
                                if(discRest == "student")
                                    mainArg.treeStructureUpdatedAt = Date.now();
                                //-- 27/07/16
                                //mainArg.updatedAt = Date.now();
                                mainArg.save(function (err) {
                                    if (err) throw err;
                                    if (argument.depth === 0) argumentsNsp.to(discussionId).emit('submitted-new-argument', {data: data});
                                    else argumentsNsp.to(discussionId).emit('submitted-new-reply', {data: data});
                                })
                            }
                            else{
                                if (argument.depth === 0) argumentsNsp.to(discussionId).emit('submitted-new-argument', {data: data});
                                else argumentsNsp.to(discussionId).emit('submitted-new-reply', {data: data});
                            }
                        })

                        if(callback) callback(data);
                    });
                });


            }

            var submitNewArgument = function (newArgument, callback) {
                    // console.log('got new argument from client..: ', newArgument);
                    var argument = new Argument();
                    argument.treeStructureUpdatedAt = Date.now();
                    argument.disc_id = discussionId;
                    argument.parent_id = (newArgument.parent_id ? newArgument.parent_id : 0);
                    argument.main_thread_id = (newArgument.main_thread_id ? newArgument.main_thread_id : 0);
                    argument.user_id = user.id;
                    argument.username = user.username;
                    argument.role = newArgument.role;
                    argument.fname = user.fname;
                    argument.lname = user.lname;
                    argument.color = user.color;
                    argument.hidden = false;
                    argument.content = newArgument.content;
                    argument.depth = (newArgument.depth ? newArgument.depth : 0);
                    argument.sub_arguments = [];
                    argument.isReflection = newArgument.isReflection;
                    argument.reflectionParts = [];
                    // 27/07/16 - Looking up discussion restriction and (13/08/16) mod ID
                    saveArgument(argument, newArgument.quotesFromThePAD, callback);
            };

         

            socket.on('submitted-new-argument', function(newArgument){submitNewArgument(newArgument, undefined)});
            socket.on('submitted-new-reflaction-argument-and-replay', function(newArgAndReplay){
                var replay = newArgAndReplay.replayText;

                var sourceId = Number(newArgAndReplay.sourceId);
                var sourceStart = newArgAndReplay.sourceStart;
                var sourceEnd = newArgAndReplay.sourceEnd;
                var role = newArgAndReplay.role;
                newArgAndReplay.role = 'reflection';
                submitNewArgument(newArgAndReplay, function(savedArg){
                    
                    Argument.findOne({_id: sourceId}, function(err, argument){
                        if (err) throw err;
                        else{
                            var newRefPart = {
                                start: sourceStart,
                                end: sourceEnd,
                                refArgId: savedArg._id
                            };
                            argument.reflectionParts.unshift(newRefPart);              
                            argument.save(function (err) {
                                if (err) throw err;
                                else{
                                    argumentsNsp.to(argument.disc_id).emit('argument-reflection-updated', {_id: argument._id, reflectionPart: newRefPart});
                                }
                            });
                            
                        }
                    });
                   
                    var id = savedArg._id;
                        
                    var postData = {
                        content: replay,
                        parent_id: id,
                        depth: 1,
                        main_thread_id: id,
                        role: role,
                        quotesFromThePAD: [],
                        isReflection: savedArg.isReflection
                    };

                    submitNewArgument(postData, undefined);

                });
            });

            /**
             * EVENT3
             */
            socket.on('update-online-users-list', function () {
                // console.log('*********************************');
                var onlineUsers = [];
                Object.keys(argumentsNsp.adapter.rooms[discussionId].sockets).forEach(function(sid){
                    var aUser = argumentsNsp.sockets[sid].request.session.passport.user;
                    // console.log(aUser);
                    var idx = contains(onlineUsers, aUser.username, 'username');
                    if (idx < 0) onlineUsers.push(argumentsNsp.sockets[sid].request.session.passport.user);
                });
                // console.log(onlineUsers);
                // console.log('*********************************');
                argumentsNsp.to(discussionId).emit('new-online-users-list', onlineUsers);
            });

            /**
             * EVENT4
             */
            socket.on('disconnect', function () {
                console.log('DISCONNECT EVENT! by: ' + user.username);
                socket.leave(discussionId);
                delete allScokets[user.id];
                if (argumentsNsp.adapter.rooms[discussionId]) {
                    argumentsNsp.to(discussionId).emit('user-left');
                }
            });

            /**
             * EVENT5
             */
            socket.on('logout-user', function () {
                Object.keys(argumentsNsp.adapter.rooms[discussionId].sockets).forEach(function(sid){
                    if (argumentsNsp.sockets[sid].request.session.passport.user.username === user.username){
                        argumentsNsp.sockets[sid].emit('logout-redirect', '/auth/logout');
                        argumentsNsp.sockets[sid].request.logout();
                    }
                });
            });

            /**
             * EVENT6 - admin hid or revealed argument
             */
            socket.on('flip-argument-hidden-status', function (data) {
                var argumentID = data._id;
                Argument.findOne({_id: argumentID}, function(err, argument) {
                    if (err){
                        throw err;
                    }
                    else{
                        argument.hidden = !argument.hidden;
                        argument.save(function (err) {
                            if (err){
                                throw err;
                            }
                            else{
                                argumentsNsp.to(argument.disc_id).emit('flip-argument-hidden-status', {_id: argumentID});
                            }
                        })
                    }
                });
            });

            socket.on('flip-discussion-locked-status', function () {
                Discussion.findById(discussionId, function(err, disc) {
                    if (err){
                        throw err;
                    }
                    else{
                        disc.locked = !disc.locked;
                        disc.save(function (err) {
                            if (err){
                                throw err;
                            }
                            else{
                                argumentsNsp.to(discussionId).emit('flip-discussion-locked-status');
                            }
                        })
                    }
                });
            });

            /**
             * copy and paste
             */
            function cloneArg(argSource,argTarget){
                argTarget.treeStructureUpdatedAt = argSource.treeStructureUpdatedAt;
                argTarget.disc_id = argSource.disc_id;
                argTarget.parent_id = argSource.parent_id;
                argTarget.main_thread_id = argSource.main_thread_id;
                argTarget.user_id = argSource.user_id;
                argTarget.username = argSource.username;
                argTarget.role = argSource.role;
                argTarget.fname = argSource.fname;
                argTarget.lname = argSource.lname;
                argTarget.color = argSource.color;
                argTarget.content = argSource.content;
                argTarget.depth = argSource.depth;
                argTarget.hidden = argSource.hidden;
                argTarget.trimmed = argSource.trimmed;
            
                argTarget.updatedAt = argSource.updatedAt;
            
                argTarget.cloned = true;
            }

            socket.on('send-support-email',function(data){
                sendSupportMessageToEmail(data, user, socket);
            });

            socket.on('paste-all', function (data){
                var discusstionID = data.discusstionID;
                var i = 0;
                var datalen = data.data.length;
                var newArguments = [];
                var oldVsNewArguments = {};

                var callback = function (newArguments, oldVsNewArguments){
                    newArguments.forEach(arg => {
                        if(arg.parent_id != 0)
                            arg.parent_id = oldVsNewArguments[arg.parent_id];
                    });

                    var hasNoParents = newArguments.filter(arg => 
                        newArguments.filter(oArg => 
                            oArg._id == arg.parent_id).length == 0);
                    var hasParents = newArguments.filter(arg => newArguments.filter(oArg => oArg._id == arg.parent_id).length > 0);
                    var getOldestParent = function (argument){
                        var oldestParent = hasNoParents.filter(arg => argument.parent_id == arg._id)[0];//if the oldest parent is the father of this argument
                        if(oldestParent){
                            return oldestParent
                        }else{
                            return getOldestParent(hasParents.filter(arg => arg._id == argument.parent_id)[0]);
                        }
                    }
                    
                    hasParents.forEach(arg => {
                        var oldestParent = getOldestParent(arg);
                        arg.depth = arg.depth - oldestParent.depth;
                        arg.main_thread_id = oldestParent._id;
                    });

                    hasNoParents = hasNoParents.map(arg => {
                        arg.depth = 0;
                        arg.parent_id = 0;
                        arg.main_thread_id = 0;
                        return arg;
                    });


                    hasNoParents.forEach(arg => {
                       saveArgument(arg);
                    });
                    
                    hasParents.forEach(arg => {
                        saveArgument(arg);
                    });
                }

                //save the argument first in order to get new id;
                data.data.forEach(arg => {
                    arg.disc_id = discusstionID;                    
                    var newArg = new Argument();
                    cloneArg(arg, newArg);
                    newArg.disc_id = discusstionID;                    
                    newArg.trimmed = !newArg.trimmed;
                    newArg.sourceTrimmedId = arg._id;
                    newArg.save(function(err, data){
                        if (err)
                            throw err;
                        else{
                            oldVsNewArguments[arg._id] = newArg._id;
                            i++;
                            newArguments.push(newArg);
                            if(i == datalen){
                                callback(newArguments, oldVsNewArguments);
                            }
                            
                        }
                        
                    });
                });                
                
            });

            socket.on('flip-argument-trimmed-status', function (data) {
                var discID = data.discusstionID;
                var argumentID = data._id;

                Argument.findOne({_id: argumentID}, function(err, argument) {
                    if (err){
                        throw err;
                    }
                    else if(argument){
                        argument.trimmed = !argument.trimmed;
                        
                        if(argument.trimmed){ //copy
                            Argument.find({$and:[{trimmed: true}, {disc_id:{$ne: argument.disc_id}}]},function(err, args) {
                                if (err){
                                    throw err;
                                }
                                args.forEach(arg => {
                                    arg.trimmed = !arg.trimmed;
                                    if (err){ throw err;}
                                    arg.save(function (err) {
                                        if (err){
                                            throw err;
                                        }
                                        else {
                                        }
                                    });
                                });
                            }); 
                            argument.save(function (err) {
                                if (err){
                                    throw err;
                                }
                                else {
                                    argumentsNsp.to(argument.disc_id).emit('flip-argument-trimmed-status', {_id: argumentID});
                                }
                            });
                        }
                        else{ //paste   
                            argument.save(function (err) {
                                if (err){
                                    throw err;
                                }
                                else {
                                    argumentsNsp.to(argument.disc_id).emit('flip-argument-trimmed-status', {_id: argumentID});
                                }
                            });
                        }
                    }
                });

            
            });

            socket.on('requesting-user-info', function (data) {
                User.findOne({_id: data._id}, function(err, user) {
                    if (err){
                        throw err;
                    }
                    else{
                        var userInfo = "";
                        if(user)
                            userInfo = user.local.info;
                        argumentsNsp.to(discussionId).emit('sending-user-info', {userInfo:userInfo});
                    }
                });
            });

            socket.on('new-chat-message',function(chatMsg){

                Discussion.findById(discussionId, function(err, disc) {
                    if (err) throw err;
                    else {

                        if(user.id == disc.moderator_id)
                            chatMsg.role = 'moderator';

                        Chat.findByIdAndUpdate(disc.chat_id, {$push: {"messages":chatMsg}}, {new: true}, function(err, chat){
                            if(err) throw err;
                            argumentsNsp.to(discussionId).emit('sending-chat-message', chatMsg);
                        });
                    }
                });
            });
        }
    });

    return router;

};

