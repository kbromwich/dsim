!function(){"use strict";var r={264:function(r,n,e){function t(r,n,e){return n in r?Object.defineProperty(r,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):r[n]=e,r}function i(r,n){var e=Object.keys(r);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(r);n&&(t=t.filter((function(n){return Object.getOwnPropertyDescriptor(r,n).enumerable}))),e.push.apply(e,t)}return e}function o(r){for(var n=1;n<arguments.length;n++){var e=null!=arguments[n]?arguments[n]:{};n%2?i(Object(e),!0).forEach((function(n){t(r,n,e[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(e)):i(Object(e)).forEach((function(n){Object.defineProperty(r,n,Object.getOwnPropertyDescriptor(e,n))}))}return r}var a=e(9439),u=e(7762),s=e(3433),c=function(r){var n=Number(r);return n===parseInt(r,10)?n:NaN},f=e(4873),l=function(r){var n=c(r);return n>=0?n:NaN};function v(){for(var r=[],n=arguments.length,e=new Array(n),t=0;t<n;t++)e[t]=arguments[t];return e.flat().map((function(r){return r.split(",")})).flat().forEach((function(n){if(n.includes("-")){var e=n.split("-"),t=(0,a.Z)(e,2),i=t[0],o=t[1],u=l(i),c=l(o);!Number.isNaN(u)&&!Number.isNaN(c)&&u<=c?r.push.apply(r,(0,s.Z)((0,f.w)(u,c+1))):r.push(NaN)}else r.push(l(n))})),(0,s.Z)(new Set(r))}var p=e(3333),h=e(2959),d=e(8118),m=e(2389),b=e(136),g=e(9388),y=e(5671),O=e(3144),w=function(r){(0,b.Z)(e,r);var n=(0,g.Z)(e);function e(r,t,i,o){var a;return(0,y.Z)(this,e),(a=n.call(this,i.rawExpression,o)).name=void 0,a.level=void 0,a.source=void 0,a.error=void 0,a.name=r,a.level=t,a.source=i,a.error=void 0,a}return(0,O.Z)(e,[{key:"id",value:function(){return"".concat(this.name,"@").concat(this.level)}},{key:"isValid",value:function(){return!this.error}}]),e}(function(){function r(n,e){(0,y.Z)(this,r),this.rawExpression=void 0,this.rootExpression=void 0,this.rawExpression=n,this.rootExpression=e}return(0,O.Z)(r,[{key:"run",value:function(r){return this.rootExpression.eval(r)}}]),r}()),x=function(r){return r.trim().startsWith("#")?"":r},j=function(r){return r.trim().toLowerCase().startsWith("error:")?r.trim().slice(6).trim():r},Z=[].concat((0,s.Z)(p.q),(0,s.Z)(h.A)),E=/[^:#@]+@[- \t,\d]+:(.*)/;function k(r,n){for(var e=0;e<r.length;e++)if(r[e].index===n)return r[e];return null}function N(r,n,e){1===e&&n.startsWith("(")&&n.endsWith(")")&&(n=n.substring(1,n.length-1)),r.push(n)}function P(r,n){var e=(0,s.Z)(r.matchAll(n.globalRegex));if(!e.length)return[[],null,0];for(var t=[],i=0,o="",a=0,u=null,c=0;c<r.length;){var f=r[c];"("===f?i+=1:")"===f&&0===(i-=1)&&(a+=1),0===i&&!u&&(2!==n.numOperands||c>0)&&(u=k(e,c))?(N(t,o,a),o="",a=0,c+=u[0].length):(o+=f,c+=1)}if(0!==i)throw Error('Unbalanced parentheses in expression "'.concat(r,'"'));return N(t,o,a),[t.filter(Boolean),u,a]}function S(r){var n,e=(0,u.Z)(Z);try{for(e.s();!(n=e.n()).done;){var t=n.value,i=P(r,t),o=(0,a.Z)(i,3),s=o[0],c=o[1],f=o[2];if(1===s.length&&1===f&&r.startsWith("(")&&r.endsWith(")"))return S(s[0]);if(c&&s.length===t.numOperands)return t.create(r,s.map(S),c)}}catch(m){e.e(m)}finally{e.f()}var l,v=(0,u.Z)(d.Q);try{for(v.s();!(l=v.n()).done;){var p=l.value,h=p.regex.exec(r);if(h)return p.create(r,[],h)}}catch(m){v.e(m)}finally{v.f()}throw Error('Invalid expression: "'.concat(r,'"'))}function C(r){var n=r.definition.trim().split(/:([\s\S]*)/),e=(0,a.Z)(n,2),t=e[0],i=e[1];if(!i)throw new Error('Simulation definition "'.concat(r.definition,'" is not correctly formatted.'));var u,s,c=[0],f=t;if(t.includes("@")){var l=f.split("@"),p=(0,a.Z)(l,2),h=p[0],d=p[1];f=h,c=v([d])}var m,b=(m=i,m.split("\n").map(x).join("\n")).replace(/\s+/g,"");try{u=S(b)}catch(y){u=S("0"),s=String(y)}var g=o(o({},r),{},{rawExpression:b});return c.map((function(r){var n=new w(f,r,g,u);return n.error=s,n}))}function W(r){var n=C(r);return n.forEach((function(r){if(!r.error)try{r.run(new m.Z({ac:10,pb:2,level:r.level,sm:0}))}catch(n){r.error=String(n)}})),n}onmessage=function(r){var n=function(r){for(var n=[],e=[],t=r.split("\n"),i=0;i<t.length;i++){var o=i,a=t[i];if(x(a).trim()){var u=E.exec(a);if(u){var c=a;if(u[1].includes("(")){var f=0,l=i,v=u[1];do{if(a.trim()){if(E.test(v))break;for(var p=0;p<v.length;p++){var h=v[p];"("===h?f+=1:")"===h&&(f-=1)}v=t[l+=1]}}while(f>0&&l<t.length);var d=t.slice(i+1,l).join("\n");c="".concat(u[0].trim(),"\n").concat(d).trim(),i=l-1}var m=1+i-o;try{var b,g=W({definition:c,lineStart:o,lineCount:m}),y=null===(b=g.find((function(r){return r.error})))||void 0===b?void 0:b.error;y?n.push({lineStart:o,lineCount:m,message:j(y)}):e.push.apply(e,(0,s.Z)(g))}catch(w){n.push({lineStart:o,lineCount:m,message:j(String(w))})}}else n.push({lineStart:o,message:"Invalid name@level: definition"})}}var O=function(r,n){var e={};return r.forEach((function(r){var t=n(r);e[t]||(e[t]=[]),e[t].push(r)})),e}(e,(function(r){return r.name}));return{sims:O,errors:n,names:Object.keys(O)}}(r.data.script);this.postMessage({errors:n.errors})}}},n={};function e(t){var i=n[t];if(void 0!==i)return i.exports;var o=n[t]={exports:{}};return r[t](o,o.exports,e),o.exports}e.m=r,e.x=function(){var r=e.O(void 0,[828,477],(function(){return e(264)}));return r=e.O(r)},function(){var r=[];e.O=function(n,t,i,o){if(!t){var a=1/0;for(f=0;f<r.length;f++){t=r[f][0],i=r[f][1],o=r[f][2];for(var u=!0,s=0;s<t.length;s++)(!1&o||a>=o)&&Object.keys(e.O).every((function(r){return e.O[r](t[s])}))?t.splice(s--,1):(u=!1,o<a&&(a=o));if(u){r.splice(f--,1);var c=i();void 0!==c&&(n=c)}}return n}o=o||0;for(var f=r.length;f>0&&r[f-1][2]>o;f--)r[f]=r[f-1];r[f]=[t,i,o]}}(),e.n=function(r){var n=r&&r.__esModule?function(){return r.default}:function(){return r};return e.d(n,{a:n}),n},e.d=function(r,n){for(var t in n)e.o(n,t)&&!e.o(r,t)&&Object.defineProperty(r,t,{enumerable:!0,get:n[t]})},e.f={},e.e=function(r){return Promise.all(Object.keys(e.f).reduce((function(n,t){return e.f[t](r,n),n}),[]))},e.u=function(r){return"static/js/"+r+"."+{477:"5af00d90",828:"2a738124"}[r]+".chunk.js"},e.miniCssF=function(r){},e.o=function(r,n){return Object.prototype.hasOwnProperty.call(r,n)},e.p="/dsim/",function(){var r={264:1};e.f.i=function(n,t){r[n]||importScripts(e.p+e.u(n))};var n=self.webpackChunkdsim=self.webpackChunkdsim||[],t=n.push.bind(n);n.push=function(n){var i=n[0],o=n[1],a=n[2];for(var u in o)e.o(o,u)&&(e.m[u]=o[u]);for(a&&a(e);i.length;)r[i.pop()]=1;t(n)}}(),function(){var r=e.x;e.x=function(){return Promise.all([e.e(828),e.e(477)]).then(r)}}();e.x()}();
//# sourceMappingURL=264.08fab856.chunk.js.map