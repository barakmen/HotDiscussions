function registerUsers_test(){

    const request = require('request');

    request('https://randomuser.me/api/', { json: true }, (err, res) => {
      if (err) { return console.log(err); }
      var userInfo = res.body.results[0];
      var data = {
        username : userInfo.login.username,
        password : userInfo.login.password,
        lname : userInfo.name.first,
        fname : userInfo.name.last,
        email : userInfo.email
      }
      console.log(data);

    });
   
}
registerUsers_test()