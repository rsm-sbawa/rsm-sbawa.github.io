/* Visual effects: cursor smoke in the hero, sparkles on hover, spotlight on cards.
   Everything is skipped for visitors who prefer reduced motion. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&window.matchMedia('(pointer: fine)').matches;
  // ---- card spotlight (follows the pointer)
  document.querySelectorAll('.card,.stats div,.pai section,.sk').forEach(function(el){
    el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');});
  });
  if(reduce) return;
  // ---- hero smoke
  var hero=document.querySelector('.hero');
  if(hero){
    var cv=document.createElement('canvas');cv.className='smoke';hero.prepend(cv);
    var ctx=cv.getContext('2d'),P=[],W,H,dpr=Math.min(2,window.devicePixelRatio||1),mx=null,my=null,t=0;
    function size(){var r=hero.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;
      for(var i=0;i<3;i++)P.push({x:mx,y:my,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2-.3,r:22+Math.random()*34,a:.34,h:Math.random()<.55?42:322});});
    hero.addEventListener('pointerleave',function(){mx=null;});
    (function loop(){
      t+=.01;ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
      if(mx===null&&Math.random()<.35){var ax=W*(.72+.12*Math.sin(t)),ay=H*(.55+.15*Math.cos(t*1.3));P.push({x:ax,y:ay,vx:(Math.random()-.5)*.6,vy:-.2-Math.random()*.3,r:34+Math.random()*44,a:.16,h:Math.random()<.5?42:322});}
      for(var i=P.length-1;i>=0;i--){var p=P[i];p.x+=p.vx;p.y+=p.vy;p.r*=1.012;p.a*=.975;
        var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,'hsla('+p.h+',90%,62%,'+p.a+')');g.addColorStop(1,'hsla('+p.h+',90%,50%,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();if(p.a<.006)P.splice(i,1);}
      if(P.length>260)P.splice(0,P.length-260);
      requestAnimationFrame(loop);
    })();
  }
  // ---- sparkles on hover
  if(!fine) return;
  var layer=document.createElement('div');layer.className='spark-layer';document.body.appendChild(layer);
  function burst(x,y,n){for(var i=0;i<n;i++){var s=document.createElement('span');s.className='spark';var a=Math.random()*6.283,d=18+Math.random()*34;
    s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');
    s.style.background=Math.random()<.6?'#F2CB6B':'#F0A0E0';layer.appendChild(s);setTimeout(function(el){return function(){el.remove();};}(s),700);}}
  document.querySelectorAll('.btn,.chip,.chipq,.card .cover,.demo button,.brand').forEach(function(el){
    var last=0;el.addEventListener('pointermove',function(e){var now=Date.now();if(now-last<60)return;last=now;burst(e.clientX,e.clientY,2);});
    el.addEventListener('pointerenter',function(e){burst(e.clientX,e.clientY,8);});
  });
})();
