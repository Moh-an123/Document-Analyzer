const a=1*100,b=85.10,c=1.8365019011406845*100;
            let cp=document.getElementById('a'),pv=document.getElementById('b');
            let cp1=document.getElementById('a1'),pv1=document.getElementById('b1');
            let cp2=document.getElementById('a2'),pv2=document.getElementById('b2');
            let psv=0,pev=100,speed=50;
            let progress=setInterval(()=>{
                psv++;
                if(psv<=a){
                pv.textContent=psv+"%";
                cp.style.background="conic-gradient(#0766ad "+ psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv<=b){
                pv1.textContent=psv+"%";
                cp1.style.background="conic-gradient(#0766ad  "+psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv<=c){
                pv2.textContent=psv+"%";
                cp2.style.background="conic-gradient(#0766ad "+psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv==pev){
                    clearInterval(progress);
                }
            },speed);