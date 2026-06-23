import{r as a,j as u,m as w}from"./index-Ct6vriPp.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=(...t)=>t.filter((e,r,o)=>!!e&&e.trim()!==""&&o.indexOf(e)===r).join(" ").trim();/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var b={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=a.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:n="",children:s,iconNode:c,...l},d)=>a.createElement("svg",{ref:d,...b,width:e,height:e,stroke:t,strokeWidth:o?Number(r)*24/Number(e):r,className:i("lucide",n),...l},[...c.map(([h,m])=>a.createElement(h,m)),...Array.isArray(s)?s:[s]]));/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=(t,e)=>{const r=a.forwardRef(({className:o,...n},s)=>a.createElement(p,{ref:s,iconNode:e,className:i(`lucide-${g(t)}`,o),...n}));return r.displayName=`${t}`,r};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=x("Video",[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]]),y={primary:"bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-glow",secondary:"bg-white/10 text-white hover:bg-white/15 border border-line",danger:"bg-rose-500 text-white hover:bg-rose-400 shadow-soft",ghost:"bg-transparent text-slate-200 hover:bg-white/10"};function k({children:t,className:e="",variant:r="primary",...o}){return u.jsx(w.button,{whileTap:{scale:.98},whileHover:{y:-1},className:`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${y[r]} ${e}`,...o,children:t})}export{k as B,v as V,x as c};
