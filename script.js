(function(){
  var params=new URLSearchParams(window.location.search);
  var fields={};
  var paramMap={
    'first_name':'firstName','last_name':'lastName','full_name':'fullName',
    'email':'email','phone':'phone','company':'company',
    'city':'city','state':'state','country':'country'
  };
  var skipTags={'SCRIPT':1,'STYLE':1,'NOSCRIPT':1,'TEXTAREA':1,'CODE':1,'PRE':1};
  var hasUrlFields=false;
  for(var p in paramMap){
    var v=params.get(p);
    if(v){fields[paramMap[p]]=v;hasUrlFields=true;}
  }
  var contactId=params.get('contact_id');
  function esc(s){
    if(!s)return s;
    var d=document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function doReplace(data){
    var r={};
    r['{{full_name}}']=esc(((data.firstName||'')+' '+(data.lastName||'')).trim()||((data.fullName||data.name)||''));
    r['{{first_name}}']=esc(data.firstName||(data.name?data.name.split(' ')[0]:'')||'');
    r['{{last_name}}']=esc(data.lastName||(data.name&&data.name.indexOf(' ')>-1?data.name.substring(data.name.indexOf(' ')+1):'')||'');
    r['{{email}}']=esc(data.email||'');
    r['{{phone}}']=esc(data.phone||'');
    r['{{company}}']=esc(data.company||'');
    r['{{city}}']=esc(data.city||'');
    r['{{state}}']=esc(data.state||'');
    r['{{country}}']=esc(data.country||'');
    r['{{date}}']=new Date().toLocaleDateString();
    r['{{time}}']=new Date().toLocaleTimeString();
    r['{{location}}']=[data.city,data.state,data.country].filter(Boolean).join(', ');
    r['{{tracking_id}}']=esc(data.trackingId||'');
    r['{{lastClickedProduct}}']=esc(data.lastClickedProduct||'');
    r['{{lastProductClickDate}}']=esc(data.lastProductClickDate||'');
    r['{{lastClickedProductPrice}}']=esc(data.lastClickedProductPrice||'');
    r['{{lastClickedProductURL}}']=esc(data.lastClickedProductURL||'');
    r['{{productsClickedCount}}']=esc(data.productsClickedCount||'0');
    r['{{ip_address}}']=esc(data.ipAddress||'');
    r['{{ip}}']=esc(data.ipAddress||'');
    if(data.customFields){
      for(var k in data.customFields){
        r['{{'+k+'}}']=esc(String(data.customFields[k]||''));
      }
    }
    params.forEach(function(v,k){
      if(!paramMap[k]&&k!=='contact_id'&&k!=='page_id'&&k.indexOf('utm_')!==0){
        r['{{'+k+'}}']=esc(v);
      }
    });
    var hasValues=false;
    for(var key in r){if(r[key]){hasValues=true;break;}}
    if(!hasValues)return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){
        var p=n.parentNode;
        if(p&&skipTags[p.nodeName])return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while(node=walker.nextNode()){
      var txt=node.nodeValue;
      if(txt&&txt.indexOf('{{')>-1){
        var changed=txt;
        for(var ph in r){
          if(r[ph]&&changed.indexOf(ph)>-1){
            changed=changed.split(ph).join(r[ph]);
          }
        }
        if(changed!==txt)node.nodeValue=changed;
      }
    }
    var attrs=['value','placeholder','content','alt','title'];
    attrs.forEach(function(attr){
      var els=document.querySelectorAll('['+attr+'*="{{"]');
      for(var i=0;i<els.length;i++){
        var tag=els[i].tagName;
        if(skipTags[tag])continue;
        var val=els[i].getAttribute(attr);
        if(val){
          var nv=val;
          for(var ph in r){
            if(r[ph]&&nv.indexOf(ph)>-1){
              nv=nv.split(ph).join(r[ph]);
            }
          }
          if(nv!==val)els[i].setAttribute(attr,nv);
        }
      }
    });
  }
  function run(){
    if(contactId){
      var xhr=new XMLHttpRequest();
      xhr.open('GET','https://paymegpt.com/api/landing/context/'+encodeURIComponent(contactId)+'?page_id=2524');
      xhr.onload=function(){
        if(xhr.status===200){
          try{
            var resp=JSON.parse(xhr.responseText);
            if(resp.success&&resp.contact){
              var merged=resp.contact;
              for(var k in fields){merged[k]=fields[k];}
              doReplace(merged);
              return;
            }
          }catch(e){}
        }
        if(hasUrlFields)doReplace(fields);
      };
      xhr.onerror=function(){if(hasUrlFields)doReplace(fields);};
      xhr.send();
    }else if(hasUrlFields){
      doReplace(fields);
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
  else{run();}
})();

(function(){
  var slug='h5JKJnn6bx';
  var apiBase='https://paymegpt.com';
  function findEmail(){
    var ids=['email','emailAddress','buyer-email','buyerEmail','user-email','userEmail','checkout-email','customer-email','contact-email'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value&&el.value.includes('@'))return el.value.trim();}
    var inputs=document.querySelectorAll('input[type="email"],input[name*="email"],input[placeholder*="email"],input[placeholder*="Email"]');
    for(var j=0;j<inputs.length;j++){if(inputs[j].value&&inputs[j].value.includes('@'))return inputs[j].value.trim();}
    return '';
  }
  function findName(){
    var ids=['name','fullName','full-name','buyer-name','buyerName','customer-name','userName','user-name'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value)return el.value.trim();}
    var inputs=document.querySelectorAll('input[name*="name"]:not([name*="email"]):not([type="email"]),input[placeholder*="name"]:not([placeholder*="email"]):not([type="email"]),input[placeholder*="Name"]:not([type="email"])');
    for(var j=0;j<inputs.length;j++){if(inputs[j].value)return inputs[j].value.trim();}
    return '';
  }
  var __realProcessPayment=function(a,b,c,d,e){
    var amountCents,email,productName,productDescription,customerName,quantity;
    if(a&&typeof a==='object'){
      amountCents=a.amountCents;email=a.email;productName=a.productName;
      productDescription=a.productDescription||'';customerName=a.name||'';quantity=a.quantity||1;
    }else{
      amountCents=typeof a==='number'?a:0;productName=typeof b==='string'?b:'';
      productDescription=typeof c==='string'?c:'';email='';customerName='';quantity=1;
    }
    if(!email)email=findEmail();
    if(!customerName)customerName=findName();
    if(!productName){alert('Product name is required.');return Promise.reject('no_product_name');}
    if(!amountCents||amountCents<100){alert('Amount must be at least $1.00');return Promise.reject('invalid_amount');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    return fetch(apiBase+'/api/landing-pages/public/'+slug+'/payment/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:customerName,amountCents:amountCents,productName:productName,productDescription:productDescription,quantity:quantity,successUrl:successBase+'?payment=success&product='+encodeURIComponent(productName)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?payment=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process payment');throw new Error(d.error);}
    });
  };
  Object.defineProperty(window,'__processPayment',{value:__realProcessPayment,writable:false,configurable:false});
  document.addEventListener('DOMContentLoaded',function(){
    var urlParams=new URLSearchParams(window.location.search);
    if(urlParams.get('payment')==='success'){
      var pName=urlParams.get('product')||'your item';
      var overlay=document.createElement('div');overlay.id='payment-success-overlay';
      overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML='<div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">Payment Successful!</h2><p style="margin:0 0 24px;color:#6b7280;font-size:16px;">Thank you for purchasing '+pName.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'.</p><button onclick="document.getElementById(\'payment-success-overlay\').remove();window.history.replaceState({},\'\',window.location.pathname);" style="padding:12px 32px;font-size:16px;font-weight:600;background:#16a34a;color:white;border:none;border-radius:8px;cursor:pointer;">Continue</button></div>';
      document.body.appendChild(overlay);
    }
  });
})();

(function(){
  var slug='h5JKJnn6bx';
  var apiBase='https://paymegpt.com';
  var currency='USD';
  var minAmt=100;var maxAmt=1000000;
  function fmtD(c){return new Intl.NumberFormat('en-US',{style:'currency',currency:currency}).format(c/100);}
  window.__donationConfig={currency:currency,presets:[25,50,100,250],minAmount:100/100,maxAmount:1000000/100,formatAmount:fmtD,buttonColor:'#4f46e5',buttonText:'Donate Now',thankYouMessage:'Thank you for your generous donation!'};
  window.__processDonation=function(amountCents,email,name,donorMessage){
    if(!amountCents||amountCents<minAmt){alert('Minimum donation is '+fmtD(minAmt));return Promise.reject('below_min');}
    if(amountCents>maxAmt){alert('Maximum donation is '+fmtD(maxAmt));return Promise.reject('above_max');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    fetch(apiBase+'/api/landing-pages/public/'+slug+'/donate/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:name||'',amountCents:amountCents,message:donorMessage||'',successUrl:successBase+'?donation=success&email='+encodeURIComponent(email)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?donation=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process donation');}
    }).catch(function(){alert('Failed to connect to payment server.');});
  };
  document.addEventListener('DOMContentLoaded',function(){
    var urlParams=new URLSearchParams(window.location.search);
    if(urlParams.get('donation')==='success'){
      var overlay=document.createElement('div');overlay.id='donation-success-overlay';
      overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML='<div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">Thank You!</h2><p style="margin:0 0 24px;color:#6b7280;font-size:16px;">Thank you for your generous donation!</p><button onclick="document.getElementById(\'donation-success-overlay\').remove();window.history.replaceState({},\'\',window.location.pathname);" style="padding:12px 32px;font-size:16px;font-weight:600;background:#16a34a;color:white;border:none;border-radius:8px;cursor:pointer;">Continue</button></div>';
      document.body.appendChild(overlay);
    }
  });
})();

// ===== MOBILE MENU TOGGLE =====
        // Function: toggleMobileMenu()
        // Purpose: Show/hide navigation menu on mobile devices
        // Triggers: Click on hamburger menu button
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');

        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });

        // ===== SMOOTH SCROLL TO SECTION =====
        // Function: scrollToSection(sectionName)
        // Purpose: Smooth scroll to a section by its data-section attribute
        // Used by: Navigation links
        function scrollToSection(sectionName) {
            const section = document.querySelector(`[data-section="${sectionName}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // ===== PARTICLE SYSTEM INITIALIZATION =====
        // Canvas-based floating particles for immersive background effect
        // Uses requestAnimationFrame for smooth 60fps animation
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = `rgba(0, 212, 232, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let particle of particles) {
                particle.update();
                particle.draw();
            }
            
            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        });

        // ===== TYPING ANIMATION FOR HERO HEADLINE =====
        // Line 1 types in, then line 2 types in with cursor
        function typeHeadline() {
            const line1 = "STOP LOSING HOT LEADS.";
            const line2 = "CONVERT THEM 24/7 WITH AI.";
            const line1Element = document.querySelector('.hero-headline .line:first-child');
            const line2Container = document.querySelector('.hero-headline .line:nth-child(2)');
            const line2Element = document.getElementById('line2');
            const cursor1 = document.querySelector('.hero-headline .typing-cursor:first-of-type');
            const cursor2 = document.getElementById('cursor2');

            let index = 0;

            function typeFirstLine() {
                if (index < line1.length) {
                    line1Element.textContent = line1.substring(0, index + 1);
                    index++;
                    setTimeout(typeFirstLine, 50);
                } else {
                    if (cursor1) cursor1.style.display = 'none';
                    setTimeout(typeSecondLine, 500);
                }
            }

            function typeSecondLine() {
                line2Container.style.display = 'block';
                let index2 = 0;

                function type() {
                    if (index2 < line2.length) {
                        line2Element.textContent = line2.substring(0, index2 + 1);
                        index2++;
                        setTimeout(type, 50);
                    } else {
                        cursor2.style.display = 'none';
                    }
                }

                type();
            }

            typeFirstLine();
        }

        // Trigger typing animation when page loads
        window.addEventListener('load', typeHeadline);

        // ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
        // Detects when sections enter viewport and triggers animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    const sectionName = section.getAttribute('data-section');

                    // Trigger specific animations based on section
                    if (sectionName === 'stats') {
                        animateCountUp();
                    } else if (sectionName === 'how-it-works') {
                        animateConnectorLine();
                    } else if (sectionName === 'features') {
                        animateFeatureCards();
                    }

                    // Animate all fade-in elements
                    const fadeElements = section.querySelectorAll('[class*="fade"], [class*="slide"]');
                    fadeElements.forEach(el => el.style.animation = el.style.animation);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-section]').forEach(section => {
            observer.observe(section);
        });

        // ===== COUNT-UP ANIMATION FOR STATS =====
        // Uses requestAnimationFrame for smooth counting effect
        function animateCountUp() {
            const statNumbers = document.querySelectorAll('.stat-number[data-count]');
            
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                let current = 0;
                const increment = Math.ceil(target / 30);
                const originalText = stat.textContent;

                function count() {
                    if (current < target) {
                        current += increment;
                        if (current > target) current = target;
                        
                        // Preserve suffix (×, %, /7, etc.)
                        const suffix = originalText.replace(/\d+/g, '');
                        stat.textContent = current + suffix;
                        
                        requestAnimationFrame(count);
                    }
                }

                count();
            });
        }

        // ===== CONNECTOR LINE ANIMATION =====
        // Draws animated line connecting the 3 steps
        function animateConnectorLine() {
            const connector = document.getElementById('steps-connector');
            connector.classList.add('animate');
        }

        // ===== FEATURE CARD BORDER SWEEP =====
        // Border sweeps clockwise when card enters viewport
        function animateFeatureCards() {
            const cards = document.querySelectorAll('.feature-card');
            cards.forEach(card => {
                card.classList.add('in-view');
            });
        }

        // ===== MOUSE TILT EFFECT FOR DASHBOARD =====
        // 3D perspective transform follows mouse movement
        const dashboardMock = document.getElementById('dashboard-mock');
        
        if (dashboardMock) {
            document.addEventListener('mousemove', (e) => {
                const rect = dashboardMock.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 10;
                const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 10;
                
                document.documentElement.style.setProperty('--rotateX', rotateX + 'deg');
                document.documentElement.style.setProperty('--rotateY', rotateY + 'deg');
                document.body.classList.add('has-mouse-move');
            });

            document.addEventListener('mouseleave', () => {
                document.documentElement.style.setProperty('--rotateX', '0deg');
                document.documentElement.style.setProperty('--rotateY', '0deg');
                document.body.classList.remove('has-mouse-move');
            });
        }

        // ===== FAQ ACCORDION TOGGLE =====
        // Click question to expand/collapse answer
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq-item');
                faqItem.classList.toggle('open');
            });
        });