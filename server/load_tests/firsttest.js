import http from "k6/http";
import { check, sleep } from "k6";

const portForLoadtests = 3004;
const real = "http://hdm-12.ise.bgu.ac.il:" + portForLoadtests;
const localhost = "http://localhost:" + portForLoadtests;

var serverUrl = localhost;

export let options = {
  vus: 1,
  duration: "10s"
};
export default function() {
    getMainPage();
    register();
};

function register(){
    let res = http.get(serverUrl + "/auth/register");
    check(res, {"success": (r) => r.status == 200});


}

function getMainPage(){
    let res = http.get(serverUrl);
    check(res, {"success": (r) => r.status == 200});
}