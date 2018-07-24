/**
 * Module dependencies.
 */
var express = require('express');
var passport = require('passport');
var app = express();

module.exports = function(io){
  /**
   * DB configurations
   */ 
  var mongoose = require('mongoose');
  var configDB = require('./config/database.js');

  // Run appropriate instance - test / benzi / baruch / tsafrir
  var curDB;
  switch(process.env.INSTANCE){
    case 'tsafrir':
      curDB = configDB.tsafrir_url;
      break;
    
    case 'loadtests':
      curDB = configDB.loadtest_url;
      break;

    case 'oldbackup':
      curDB = configDB.oldbackup_url;
      break;

    default:
      curDB = configDB.tsafrir_url;//configDB.test_url;
      break;
  }

  console.log("Running on HDP instance of: " + process.env.INSTANCE + " on DB: " + curDB);
  mongoose.connect(curDB, {useMongoClient: true});
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'db connection error'));
  db.once('open', function(){console.log('succefully connected to mongodb');});
  var autoIncrement = require('mongoose-auto-increment');
  autoIncrement.initialize(db);

  /**
   * Middleware of the server
   */ 
  require('./middleware')(app, express, passport, mongoose, io);

  /**
   * Routes of the server + JSON API
   */ 
  require('./routes/routes')(app, passport, autoIncrement, io);

  /**
  * Error handlers the server
  */ 
  require('./server_critic_error_handlers').handleerror(app);

  return app;
};