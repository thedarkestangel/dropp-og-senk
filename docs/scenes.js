/* Eau de Deal – bakgrunner: 24-bit eventyr, Japan (anime-duell) og Savanne (malt jaktscene) */
(function(){
var H=document.documentElement,LS=window.localStorage;
function get(k){try{return LS.getItem(k)}catch(e){return null}}
function set(k,v){try{LS.setItem(k,v)}catch(e){}}
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var MOVE=!RM&&get("pv_motion")!=="off";
function an(s){return MOVE?s:""}
function U(w,h,b,crisp){return 'url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='"+w+"' height='"+h+"' viewBox='0 0 "+w+" "+h+"'"+(crisp?" shape-rendering='crispEdges'":"")+">"+b+"</svg>")+'")'}
function R(x,y,w,h,c){return "<rect x='"+x+"' y='"+y+"' width='"+w+"' height='"+h+"'"+(c?" fill='"+c+"'":"")+"/>"}
function pl(pts,c,w){return "<polyline points='"+pts+"' fill='none' stroke='"+c+"' stroke-width='"+w+"' stroke-linecap='round' stroke-linejoin='round'/>"}
function lin(id,stops,v){var s="<linearGradient id='"+id+"'"+(v===false?"":" x1='0' y1='0' x2='0' y2='1'")+">";stops.forEach(function(t){s+="<stop offset='"+t[0]+"' stop-color='"+t[1]+"'"+(t[2]!=null?" stop-opacity='"+t[2]+"'":"")+"/>"});return s+"</linearGradient>"}
function rad(id,stops){var s="<radialGradient id='"+id+"'>";stops.forEach(function(t){s+="<stop offset='"+t[0]+"' stop-color='"+t[1]+"'"+(t[2]!=null?" stop-opacity='"+t[2]+"'":"")+"/>"});return s+"</radialGradient>"}
var P2=Math.PI*2;

/* ---------- 1) 24-bit eventyr (piksler) ---------- */
function ridge(W,Hh,st,f,c,cap){var s="";for(var x=0;x<W;x+=st){var h=Math.round(f(x)/st)*st;s+=R(x,Hh-h,st,h,c);if(cap&&h>cap[0])s+=R(x,Hh-h,st,st*2,cap[1])}return s}
function cloud(x,y,s){var o="";[[2,0,4],[1,1,7],[0,2,10],[0,3,10]].forEach(function(q,i){o+=R(x+q[0]*s,y+q[1]*s,q[2]*s,s,i<2?"#ffffff":"#eaf4ff")});return o+R(x+s,y+4*s,8*s,s,"#c9def5")}
var cl=cloud(30,30,6)+cloud(260,90,5)+cloud(150,10,4);
var far=ridge(480,200,4,function(x){return 110+40*Math.sin(P2*x/480*2)+25*Math.sin(P2*x/480*5+1)},"#6c70c6",[150,"#eef2ff"]);
var mid=ridge(480,160,4,function(x){return 70+25*Math.sin(P2*x/480*3+2)+12*Math.sin(P2*x/480*7)},"#3f9a8f");
var nr=ridge(480,110,4,function(x){return 40+15*Math.sin(P2*x/480*4+.5)+8*Math.sin(P2*x/480*9)},"#2f7d3a");
[40,150,230,350,430].forEach(function(x,i){var b=110-(42+(i%2)*10);nr+=R(x+6,b-6,4,8,"#5a3a1e")+R(x,b-14,16,8,"#1e5e2b")+R(x+2,b-22,12,8,"#22692f")+R(x+4,b-30,8,8,"#2a7a37")+R(x+6,b-36,4,6,"#338a40")});
var gr=R(0,0,32,8,"#58c93a")+R(0,8,32,4,"#3a9e26")+R(0,12,32,36,"#b8692f")+R(4,18,6,4,"#93521f")+R(20,28,6,4,"#93521f")+R(10,38,6,4,"#93521f")+R(6,4,2,4,"#ff6fa8")+R(22,2,2,4,"#ffe24a");
var coin=U(16,16,R(5,1,6,14,"#f5b400")+R(3,3,10,10,"#f5b400")+R(6,3,4,10,"#ffe24a")+R(7,5,2,6,"#fff6b0"),true);
var PIX=U(480,140,cl,true)+" 0 4%/480px repeat-x,"+U(32,48,gr,true)+" 0 100%/32px 48px repeat-x,"+U(480,110,nr,true)+" 0 calc(100% - 46px)/480px 110px repeat-x,"+U(480,160,mid,true)+" 0 calc(100% - 90px)/480px 160px repeat-x,"+U(480,200,far,true)+" 0 calc(100% - 130px)/480px 200px repeat-x,"+coin+" 12% 30%/22px no-repeat,"+coin+" 82% 46%/22px no-repeat,linear-gradient(#1e3c96 0 8%,#2a55b4 8% 16%,#3a6fcc 16% 26%,#4f8ae0 26% 38%,#6aa6ee 38% 52%,#8cc3f5 52% 68%,#b3dcf9 68%)";

/* ---------- 2) Japan: anime-duell under fullmånen ---------- */
// Ninja som tykke streker (silhuett). j = ledd: hode, nakke, hofte, armer og bein.
function ninja(j,c){
  var s=pl(j.n+" "+j.h,c,17)+pl(j.a1,c,8)+pl(j.a2,c,8)+pl(j.l1,c,9)+pl(j.l2,c,9);
  return s+"<circle cx='"+j.hd[0]+"' cy='"+j.hd[1]+"' r='11' fill='"+c+"'/>";
}
var poseA={hd:[150,168],n:"152,182",h:"141,214",a1:"153,186 171,192 188,187",a2:"150,186 134,178 122,166",l1:"141,214 158,225 151,245",l2:"141,214 124,226 106,221"};
function jp(){
  var d=lin("jsky",[[0,"#1a1040",0],[.35,"#2a1a5e"],[.7,"#7a2e6e"],[1,"#d9536f"]])+rad("moon",[[0,"#fff7ec"],[.75,"#ffd9df"],[1,"#ffb3c1"]])+rad("glow",[[0,"#ffffff"],[.35,"#bfe9ff"],[1,"#2aa8ff",0]])+rad("fire",[[0,"#fff3b0"],[.4,"#ffb020"],[1,"#ff3d00",0]])+rad("burst",[[0,"#ffffff"],[.4,"#fff1a8"],[1,"#ff9de2",0]])+lin("flame",[[0,"#ff3d00",0],[.5,"#ff7a00"],[1,"#ffe066"]],false)+lin("bolt",[[0,"#9be7ff"],[1,"#ffffff"]],false)+lin("mist",[[0,"#f3c6e0",0],[.5,"#f3c6e0",.35],[1,"#f3c6e0",0]],false);
  var s="<defs>"+d+"</defs>"+R(0,0,480,360,"url(#jsky)");
  // fullmåne bak duellen
  s+="<circle cx='240' cy='160' r='112' fill='#ffb3c1' opacity='.18'/><circle cx='240' cy='160' r='98' fill='url(#moon)'/><circle cx='205' cy='135' r='14' fill='#f6c7cf' opacity='.6'/><circle cx='268' cy='190' r='20' fill='#f6c7cf' opacity='.45'/><circle cx='275' cy='120' r='8' fill='#f6c7cf' opacity='.5'/>";
  // Fuji og pagode
  s+="<polygon points='0,300 90,214 120,214 220,300' fill='#3b2668'/><polygon points='90,214 120,214 134,230 122,226 112,236 102,226 92,234 80,226' fill='#f4e9ff'/>";
  var pg="";[0,1,2,3].forEach(function(i){var y=228-i*20,w=46-i*8;pg+="<path d='M"+(400-w)+" "+(y+6)+" Q400 "+(y-4)+" "+(400+w)+" "+(y+6)+" L"+(400+w-8)+" "+(y+2)+" L"+(400-w+8)+" "+(y+2)+" Z' fill='#24143f'/>"+R(400-w+12,y+6,2*w-24,14,"#2e1a50")});
  s+=pg+R(398,140,4,14,"#24143f");
  s+=R(0,262,480,40,"url(#mist)");
  // takrygger i forgrunnen
  s+="<path d='M0 330 Q120 300 240 318 Q360 300 480 330 L480 360 L0 360 Z' fill='#140a26'/><path d='M0 330 Q120 300 240 318 Q360 300 480 330' fill='none' stroke='#5b2a6e' stroke-width='3'/>";
  for(var t=10;t<480;t+=22)s+=R(t,334,3,26,"#1e1036");
  // fartsstreker fra midten
  var sl="";for(var k=0;k<18;k++){var a=k/18*P2,r1=40,r2=120+(k%3)*30;sl+="<line x1='"+(240+Math.cos(a)*r1).toFixed(1)+"' y1='"+(186+Math.sin(a)*r1).toFixed(1)+"' x2='"+(240+Math.cos(a)*r2).toFixed(1)+"' y2='"+(186+Math.sin(a)*r2).toFixed(1)+"' stroke='#fff' stroke-width='1.2' opacity='.35'/>"}
  s+="<g>"+sl+an("<animate attributeName='opacity' values='.2;.9;.2' dur='.6s' repeatCount='indefinite'/>")+"</g>";
  // venstre ninja: lyn-jutsu
  s+="<path d='M196 186 L210 178 L216 192 L228 182 L234 190' fill='none' stroke='url(#bolt)' stroke-width='4' stroke-linejoin='round'>"+an("<animate attributeName='opacity' values='1;.3;1;.6;1' dur='.4s' repeatCount='indefinite'/>")+"</path>";
  s+="<circle cx='192' cy='186' r='22' fill='url(#glow)'>"+an("<animate attributeName='r' values='18;26;18' dur='.8s' repeatCount='indefinite'/>")+"</circle>";
  // høyre ninja: ild-jutsu (speilvendt figur)
  s+="<path d='M286 176 Q262 166 244 186 Q262 206 286 196 Z' fill='url(#flame)'>"+an("<animate attributeName='d' values='M286 176 Q262 166 244 186 Q262 206 286 196 Z;M286 172 Q260 162 246 186 Q260 210 286 200 Z;M286 176 Q262 166 244 186 Q262 206 286 196 Z' dur='.45s' repeatCount='indefinite'/>")+"</path>";
  s+="<circle cx='288' cy='186' r='16' fill='url(#fire)'>"+an("<animate attributeName='r' values='13;19;13' dur='.6s' repeatCount='indefinite'/>")+"</circle>";
  // skjerf
  var scarfA="<path d='M150 184 Q128 190 112 182 Q100 176 88 184' fill='none' stroke='#e11d48' stroke-width='5' stroke-linecap='round'>"+an("<animate attributeName='d' values='M150 184 Q128 190 112 182 Q100 176 88 184;M150 184 Q128 178 112 186 Q100 192 86 180;M150 184 Q128 190 112 182 Q100 176 88 184' dur='.7s' repeatCount='indefinite'/>")+"</path>";
  var band="<path d='M142 164 Q130 160 120 166' fill='none' stroke='#0d0818' stroke-width='3' stroke-linecap='round'/><path d='M142 166 Q128 170 118 174' fill='none' stroke='#0d0818' stroke-width='3' stroke-linecap='round'/>";
  s+=scarfA+band+ninja(poseA,"#0d0818")+"<rect x='146' y='164' width='16' height='3' fill='#9aa6c8'/>";
  s+="<g transform='translate(480 0) scale(-1 1)'>"+scarfA.replace("#e11d48","#7c3aed")+band+ninja(poseA,"#0d0818")+"<rect x='146' y='164' width='16' height='3' fill='#9aa6c8'/></g>";
  // sammenstøtet
  var st="";for(var q=0;q<16;q++){var aa=q/16*P2,rr=q%2?9:26;st+=(240+Math.cos(aa)*rr).toFixed(1)+","+(186+Math.sin(aa)*rr).toFixed(1)+" "}
  s+="<circle cx='240' cy='186' r='34' fill='url(#burst)'>"+an("<animate attributeName='r' values='26;40;26' dur='.5s' repeatCount='indefinite'/>")+"</circle><polygon points='"+st+"' fill='#fff'>"+an("<animateTransform attributeName='transform' type='rotate' values='0 240 186;22 240 186;0 240 186' dur='.5s' repeatCount='indefinite'/>")+"</polygon>";
  // shuriken
  var sh="<g transform='translate(70 110)'><g><polygon points='0,-9 2,-2 9,0 2,2 0,9 -2,2 -9,0 -2,-2' fill='#c9d1e8'/><circle r='2' fill='#1a1040'/>"+an("<animateTransform attributeName='transform' type='rotate' from='0' to='360' dur='.35s' repeatCount='indefinite'/>")+"</g>"+an("<animateTransform attributeName='transform' type='translate' values='70 110;420 60' dur='2.6s' repeatCount='indefinite'/>")+"</g>";
  s+=sh;
  // kirsebærgren og fallende blader
  s+="<path d='M0 18 L60 34 L118 26 L160 46 M60 34 L78 66 M118 26 L146 6' stroke='#3a1c22' stroke-width='6' fill='none' stroke-linecap='round'/>";
  [[38,26],[66,42],[92,30],[118,22],[146,10],[156,44],[80,64],[28,14],[132,36],[168,50]].forEach(function(p){s+="<circle cx='"+p[0]+"' cy='"+p[1]+"' r='8' fill='#f9a8c9'/><circle cx='"+p[0]+"' cy='"+p[1]+"' r='2.6' fill='#e0567f'/>"});
  [[60,0,7],[150,-40,9],[260,-80,8],[360,-20,10],[430,-60,7.5]].forEach(function(p){s+="<ellipse cx='"+p[0]+"' cy='"+p[1]+"' rx='4' ry='2.4' fill='#f9a8c9'>"+an("<animateTransform attributeName='transform' type='translate' values='0 0;-40 420' dur='"+p[2]+"s' repeatCount='indefinite'/>")+"</ellipse>"});
  return s;
}
var stars="";[[20,30,1.4],[150,80,1],[90,160,1.2],[220,20,1],[60,220,1.3],[200,190,1],[110,60,1],[240,120,1.4],[280,250,1]].forEach(function(p){stars+="<circle cx='"+p[0]+"' cy='"+p[1]+"' r='"+p[2]+"' fill='#fff' opacity='.8'/>"});
var JAPAN=U(480,360,jp())+" 50% 100%/100vw auto no-repeat,"+U(300,300,stars)+" 0 0/300px repeat,linear-gradient(#0b0820,#1a1040 55%,#1a1040)";

/* ---------- 3) Savanne: malt jaktscene i solnedgang ---------- */
function zebra(x,y,s,flip){
  var id="zb"+x;
  var body="<path d='M0 0 Q26 -10 52 -2 Q60 2 58 14 Q40 22 6 18 Q-4 12 0 0 Z'/><path d='M40 -2 Q50 -18 58 -26 L68 -20 Q60 -6 56 8 Z'/><path d='M56 -28 Q68 -30 80 -14 Q80 -9 75 -9 Q68 -14 60 -16 Z'/>";
  var g="<defs><clipPath id='"+id+"'>"+body+"</clipPath></defs>";
  g+="<g fill='#f6efe4'>"+body+"</g>";
  var str="";for(var k=-6;k<62;k+=7)str+="<line x1='"+k+"' y1='-40' x2='"+(k-6)+"' y2='26' stroke='#1b1310' stroke-width='3.2'/>";
  for(var m=-26;m<6;m+=6)str+="<line x1='40' y1='"+(m+8)+"' x2='76' y2='"+m+"' stroke='#1b1310' stroke-width='2.6'/>";
  g+="<g clip-path='url(#"+id+")'>"+str+"</g>";
  g+="<path d='M74 -13 Q79 -11 80 -13' stroke='#1b1310' stroke-width='5' stroke-linecap='round'/><path d='M42 -6 Q50 -20 58 -28' stroke='#1b1310' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M60 -28 L58 -36 L64 -29 Z' fill='#f6efe4'/><circle cx='66' cy='-21' r='1.3' fill='#1b1310'/>";
  [[6,16],[16,18],[42,18],[52,14]].forEach(function(l,i){g+="<line x1='"+l[0]+"' y1='"+l[1]+"' x2='"+(l[0]+(i%2?2:-1))+"' y2='"+(l[1]+20)+"' stroke='#f6efe4' stroke-width='4' stroke-linecap='round'/><line x1='"+(l[0]+(i%2?2:-1))+"' y1='"+(l[1]+16)+"' x2='"+(l[0]+(i%2?2:-1))+"' y2='"+(l[1]+20)+"' stroke='#1b1310' stroke-width='4'/>"});
  g+="<path d='M0 4 Q-8 10 -6 22' stroke='#1b1310' stroke-width='2' fill='none'>"+an("<animateTransform attributeName='transform' type='rotate' values='0 0 4;18 0 4;0 0 4' dur='1.8s' repeatCount='indefinite'/>")+"</path>";
  return "<g transform='translate("+x+" "+y+") scale("+(flip?-s:s)+" "+s+")'>"+g+"</g>";
}
function leopard(x,y){
  var body="<path d='M0 0 Q20 -12 52 -8 Q66 -6 70 2 Q60 10 30 10 Q6 10 0 0 Z'/><circle cx='74' cy='-2' r='8'/>";
  var g="<defs><clipPath id='lp'>"+body+"</clipPath></defs><g fill='#d9963a'>"+body+"</g><g clip-path='url(#lp)' fill='#3a2410'>";
  for(var i=0;i<16;i++)g+="<circle cx='"+(6+(i*13)%74)+"' cy='"+(-8+(i*7)%16)+"' r='2.2'/>";
  g+="</g><path d='M70 -8 L72 -14 L76 -9 M78 -9 L81 -13 L82 -7' fill='#d9963a' stroke='#d9963a' stroke-width='2'/><circle cx='78' cy='-3' r='1.3' fill='#1b1310'/>";
  [[10,8],[24,9],[50,8],[62,6]].forEach(function(l){g+="<line x1='"+l[0]+"' y1='"+l[1]+"' x2='"+(l[0]+8)+"' y2='"+(l[1]+5)+"' stroke='#c7832e' stroke-width='5' stroke-linecap='round'/>"});
  g+="<path d='M0 0 Q-20 -4 -26 -18' stroke='#d9963a' stroke-width='4' fill='none' stroke-linecap='round'>"+an("<animate attributeName='d' values='M0 0 Q-20 -4 -26 -18;M0 0 Q-22 2 -30 -8;M0 0 Q-20 -4 -26 -18' dur='2.2s' repeatCount='indefinite'/>")+"</path>";
  return "<g transform='translate("+x+" "+y+")'>"+g+"</g>";
}
function hunter(x,y,s,c){
  var j="<g transform='translate("+x+" "+y+") scale("+s+")' stroke='"+c+"' stroke-linecap='round' stroke-linejoin='round' fill='none'>";
  j+="<polyline points='0,-30 8,-6' stroke-width='9'/><polyline points='2,-26 12,-20 22,-24' stroke-width='5'/><polyline points='1,-27 -6,-16 2,-10' stroke-width='5'/><polyline points='8,-6 18,4 14,22' stroke-width='6'/><polyline points='8,-6 -2,8 -10,20' stroke-width='6'/>";
  j+="<line x1='-14' y1='-6' x2='46' y2='-38' stroke-width='2.2'/><path d='M46 -38 L54 -44 L48 -34 Z' fill='"+c+"' stroke-width='1'/><circle cx='-3' cy='-38' r='6' fill='"+c+"' stroke='none'/>";
  return j+"</g>";
}
function sav(){
  var d=lin("ssky",[[0,"#2b1055",0],[.25,"#5b1f5e"],[.5,"#c2453e"],[.72,"#f08a3a"],[1,"#fcd27a"]])+rad("ssun",[[0,"#fff6c9"],[.6,"#ffd166"],[1,"#ff9f43"]])+lin("sgr",[[0,"#9a5418"],[1,"#3a1a08"]])+lin("haze",[[0,"#ffcf8a",0],[1,"#ffcf8a",.5]]);
  var s="<defs>"+d+"</defs>"+R(0,0,480,360,"url(#ssky)");
  s+="<circle cx='300' cy='224' r='86' fill='#ffd166' opacity='.25'/><circle cx='300' cy='224' r='68' fill='url(#ssun)'/>";
  s+="<path d='M-20 120 Q80 108 200 118' stroke='#ff9eb0' stroke-width='6' opacity='.35' fill='none' stroke-linecap='round'/><path d='M260 90 Q360 80 470 92' stroke='#ffb38a' stroke-width='8' opacity='.3' fill='none' stroke-linecap='round'/>";
  s+="<path d='M0 236 Q70 214 150 230 Q240 210 330 232 Q410 216 480 230 L480 260 L0 260 Z' fill='#a0443a' opacity='.75'/>"+R(0,236,480,30,"url(#haze)");
  // akasietrær
  s+="<g fill='#2a1410'><path d='M60 244 Q64 214 58 196 M60 214 Q48 204 40 206 M60 210 Q74 200 86 200' stroke='#2a1410' stroke-width='5' fill='none'/><ellipse cx='60' cy='192' rx='52' ry='11'/><ellipse cx='60' cy='184' rx='34' ry='8'/><path d='M420 248 Q424 226 420 214' stroke='#2a1410' stroke-width='4' fill='none'/><ellipse cx='420' cy='210' rx='34' ry='7'/><ellipse cx='420' cy='204' rx='22' ry='5'/></g>";
  // fugler
  s+="<g fill='none' stroke='#2a1410' stroke-width='1.6' stroke-linecap='round'><path d='M0 0 l5 3 l5 -3'/><path d='M14 -8 l4 2 l4 -2'/><path d='M22 6 l4 2 l4 -2'/>"+an("<animateTransform attributeName='transform' type='translate' values='-40 70;520 40' dur='16s' repeatCount='indefinite'/>")+"</g>";
  // bakke
  s+="<path d='M0 256 Q120 246 240 254 Q360 246 480 256 L480 360 L0 360 Z' fill='url(#sgr)'/>";
  // sebraer til høyre
  s+=zebra(318,262,.9,false)+zebra(380,270,.8,false)+zebra(470,262,.75,true);
  // jegere som sniker seg fra venstre
  var hs=hunter(46,290,1.1,"#150905")+hunter(104,298,.95,"#150905");
  s+="<g>"+hs+an("<animateTransform attributeName='transform' type='translate' values='0 0;10 0;0 0' dur='7s' repeatCount='indefinite'/>")+"</g>";
  // leoparden i graset
  s+=leopard(170,306);
  // høyt gras i forgrunnen
  var g1="",g2="";for(var x=-6;x<490;x+=7){var h=18+((x*37)%23);g1+="<path d='M"+x+" 360 Q"+(x+3)+" "+(360-h/2)+" "+(x+((x%3)-1)*5)+" "+(360-h)+"' stroke='#5a2c0c' stroke-width='3' fill='none'/>";if(x%14===0)g2+="<path d='M"+(x+3)+" 360 Q"+(x+5)+" "+(340-h/3)+" "+(x+8)+" "+(332-h/2)+"' stroke='#c47a2c' stroke-width='2' fill='none'/>"}
  s+="<g>"+g1+an("<animateTransform attributeName='transform' type='skewX' values='0;-3;0;2;0' dur='5s' repeatCount='indefinite'/>")+"</g><g>"+g2+an("<animateTransform attributeName='transform' type='skewX' values='0;3;0;-2;0' dur='4s' repeatCount='indefinite'/>")+"</g>";
  return s;
}
var SAV=U(480,360,sav())+" 50% 100%/100vw auto no-repeat,"+U(300,300,stars)+" 0 0/300px repeat,linear-gradient(#1c0b33,#2b1055 50%,#3a1460)";

/* ---------- Bytte av tema ---------- */
var BG={pix:PIX,japan:JAPAN,afrika:SAV},T=["pix","japan","afrika"],N={pix:"24-bit eventyr",japan:"Japan · ninja-duell",afrika:"Savanne · jakten"},CL={pix:"#1e3c96",japan:"#0b0820",afrika:"#1c0b33"},cur=get("pv_theme");
if(T.indexOf(cur)<0)cur="pix";
var f=document.createElement("link");f.rel="stylesheet";f.href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Bebas+Neue&display=swap";document.head.appendChild(f);
var css=document.createElement("style");css.textContent=
"html.th-japan{--grad:linear-gradient(120deg,#e11d48 0%,#ff4d6d 55%,#ff8fab 100%)}"+
"html.th-afrika{--grad:linear-gradient(120deg,#fbbf24 0%,#f97316 55%,#ef4444 100%)}"+
"html.th-japan h1,html.th-japan .stat .v,html.th-japan .price .p,html.th-japan .big .p{font-family:'Dela Gothic One',sans-serif!important;letter-spacing:0!important}"+
"html.th-japan h1{font-size:21px!important}html.th-japan .stat .v,html.th-japan .price .p{font-size:17px!important}"+
"html.th-afrika h1,html.th-afrika .stat .v,html.th-afrika .price .p,html.th-afrika .big .p{font-family:'Bebas Neue',sans-serif!important;letter-spacing:.03em!important}"+
"html.th-afrika h1{font-size:30px!important}html.th-afrika .stat .v,html.th-afrika .price .p{font-size:24px!important}"+
"html.th-japan .card:not(.t-down):not(.t-up),html.th-japan .stat,html.th-japan header{box-shadow:0 8px 24px rgba(0,0,0,.35)!important;border-color:rgba(255,77,109,.35)}"+
"html.th-afrika .card:not(.t-down):not(.t-up),html.th-afrika .stat,html.th-afrika header{box-shadow:0 8px 24px rgba(0,0,0,.35)!important;border-color:rgba(251,191,36,.3)}";
document.head.appendChild(css);
function ap(t){H.style.setProperty("--thbg",BG[t]);H.style.background=CL[t];T.forEach(function(x){H.classList.toggle("th-"+x,x===t)});var m=document.querySelector("meta[name=theme-color]");if(m)m.content=CL[t]}
ap(cur);
var b=document.createElement("button");b.className="icon-btn";b.setAttribute("aria-label","Bytt bakgrunn");b.textContent="🎨";
var st=document.getElementById("settingsBtn");st.parentNode.insertBefore(b,st);
b.addEventListener("click",function(){cur=T[(T.indexOf(cur)+1)%3];set("pv_theme",cur);ap(cur);if(typeof toast==="function")toast("Bakgrunn: "+N[cur])});
})();
