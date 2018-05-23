import http from "k6/http";
import { check, sleep } from "k6";
export let options = {
  vus: 1,
  duration: "10s"
};
export default function() {
  let res = http.get("url");
  check(res, {
    "success": (r) => r.status == 200
  });
};