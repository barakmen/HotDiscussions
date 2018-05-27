import http from "k6/http";
import { check, sleep } from "k6";

const portForLoadtests = 3004;
const real = "http://hdm-12.ise.bgu.ac.il:" + portForLoadtests;
const localhost = "http://localhost:" + portForLoadtests;

var serverUrl = localhost;

export let options = {
  vus: 100,
  duration: "10s"
};
export default function() {
    getMainPage_test();
    registerUsers_test();
};



function registerUsers_test(){
    let res = http.get('http://randomuser.me/api/',  { json: true });
    var userInfo = JSON.parse(res.body).results[0];
      var data = {
        username : userInfo.login.username,
        password : userInfo.login.password,
        lname : userInfo.name.first,
        fname : userInfo.name.last,
        email : userInfo.email
      }
      console.log(JSON.stringify(data));
      register(data);

}
//data is from format : {username:'a', password:'a', fname:'fb', lname:'lb', email:'a@a.com'}
function register(data){
    let res = http.get(serverUrl + "/auth/register");
    check(res, {"success": (r) => r.status == 200});

    let res1 = http.post(serverUrl + "/auth/register", data);
        check(res1, {"success": (r) =>  {
                return r.status == 200 && r.url === '/auth/login';
            }
        });
}

function getMainPage_test(){
    let res = http.get(serverUrl);
    check(res, {"success": (r) => r.status == 200});
}