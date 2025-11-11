import{c as r,f as a}from"./index-BBnXsfSu.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]],d=r("refresh-ccw",s),n=()=>a.get("/refer/me"),o=e=>a.get("/refer/history",{params:e}),c=e=>a.get("/refer/withdrawals",{params:e}),h=e=>a.post("/refer/withdraw",e),f=e=>a.get("/admin/referrals",{params:e}),l=e=>a.get("/admin/referrals/stats",{params:e}),m=(e,t)=>a.patch(`/admin/referrals/${e}`,t),p=e=>a.get("/admin/referrals/export",{params:e,responseType:"blob"}),w=e=>a.get("/admin/withdrawals",{params:e}),g=(e,t)=>a.patch(`/admin/withdrawals/${e}`,t);export{d as R,l as a,f as b,p as c,m as d,w as e,g as f,n as g,o as h,c as i,h as s};
