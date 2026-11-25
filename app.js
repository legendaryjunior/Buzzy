const creators=[
  {id:"maya",name:"Maya Chen",handle:"@mayamakes",category:"slow living",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",followers:682400,engagementRate:0.068},
  {id:"marco",name:"Marco Rivera",handle:"@marco.vibes",category:"outdoors",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",verified:true},
  {id:"lena",name:"Lena Okafor",handle:"@lena.moves",category:"creative",avatar:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=96&h=96&q=80",verified:false},
  {id:"jules",name:"Jules Park",handle:"@jules.cooks",category:"easy recipes",avatar:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",verified:false}
];
const posts=[
  {id:"p1",creator:"maya",time:"2h ago",title:"A slower kind of Sunday",kicker:"LITTLE MOMENTS",overlay:"coffee, fresh flowers & nowhere to be",caption:"Making a little space for the things that make a day feel like yours. ☁️",hashtags:"#slowliving #sundayreset #littlethings",image:"https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&h=900&q=85",videoUrl:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",likes:1842,comments:38,views:"12.4k",sound:"Sunday kind of feeling · honey.wav",liked:false,saved:false,commentsList:[{creator:"lena",text:"This feels like a deep breath. ☁️",time:"1h ago"},{creator:"jules",text:"Adding this to my Sunday moodboard.",time:"48m ago"}]},
  {id:"p2",creator:"marco",time:"5h ago",title:"Took the long way home",kicker:"OUT THERE",overlay:"sometimes the detour is the whole point",caption:"No plans, fresh air, and a trail that just kept going. Needed this one. 🌿",hashtags:"#getoutside #weekendwanders #freshair",image:"https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&h=900&q=85",likes:3261,comments:64,views:"28.1k",sound:"Golden Hour · The Paper Kites",liked:false,saved:false,commentsList:[{creator:"maya",text:"That light!! Where is this? 🌱",time:"3h ago"},{creator:"lena",text:"The best kind of plans are no plans.",time:"2h ago"}]},
  {id:"p3",creator:"lena",time:"Yesterday",title:"A tiny colour study",kicker:"MADE BY HAND",overlay:"playing with colour, just because",caption:"A little reminder that making things doesn't need a reason. What colours are you into lately? 🎨",hashtags:"#creativeprocess #artistsonbuzzy #colourstudy",image:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&h=900&q=85",likes:927,comments:21,views:"8.7k",sound:"Peach Tea · original audio",liked:false,saved:false,commentsList:[{creator:"maya",text:"The little pops of orange are everything.",time:"Yesterday"}]}
];
const CREATOR_METRICS={followers:1248,views:42860};
const CREATOR_THRESHOLDS={liveFollowers:1000,monetizationFollowers:10000,monetizationViews:100000};
const AUTH_USERS_KEY="buzzy.localAccounts.v1",AUTH_SESSION_KEY="buzzy.localSession.v1";
const COMMUNITY_KEY="buzzy.localCommunities.v1";
const storyExpiry=24*60*60*1000;
const state={feed:"foryou",search:"",followed:new Set(["marco"]),subscribed:new Set(),activeTopic:"",soundEnabled:false,toastTimer:null,authMode:"login",authMethod:"email",currentUser:null,stories:[],activeChat:"maya",chats:{maya:[{id:"m1",from:"maya",text:"Hey! Thanks for watching my latest loop ☁️",time:Date.now()-3600000},{id:"m2",from:"me",text:"The flowers were such a lovely touch!",time:Date.now()-3300000}],marco:[{id:"m3",from:"marco",text:"Found a new trail for this weekend 🌿",time:Date.now()-7200000}]},coins:50,communities:[],joinedCommunities:new Set(),marketListings:[],gamesJoined:new Set(),janetResult:"",storyObjectUrls:[],messageMediaUrls:[],cameraObjectUrls:[],cameraStream:null,cameraRequestId:0,cameraFacing:"user",cameraMode:"photo",voiceRecorder:null,pageMode:false,currentPage:"home",pageTitle:"",pageKicker:"",pageDescription:"",profileTab:"posts",profileHighlightDismissed:false};
const feedElement=document.querySelector("#feed"),emptyState=document.querySelector("#empty-state"),modalRoot=document.querySelector("#modal-root"),toastElement=document.querySelector("#toast"),pageRoot=document.querySelector("#page-root");

function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function creatorFor(id){return creators.find(creator=>creator.id===id);}
function isGoldenVerified(creator){return Boolean(creator&&creator.followers>=500000&&creator.engagementRate>=0.05);}
function verifiedBadge(creator){return isGoldenVerified(creator)?'<span class="gold-verified" title="Golden verified · 500K+ followers and strong engagement" aria-label="Golden verified: 500 thousand or more followers and strong engagement">✓</span>':"";}
function formatCount(count){return count>=1000?`${(count/1000).toFixed(count>=10000?0:1).replace(/\.0$/,"")}k`:String(count);}
function readAccounts(){
  const saved=localStorage.getItem(AUTH_USERS_KEY);
  if(saved===null)return [];
  const accounts=JSON.parse(saved);
  if(!Array.isArray(accounts))throw new Error("Saved account data is invalid. Clear this browser's Buzzy demo data and try again.");
  return accounts;
}
function saveAccounts(accounts){localStorage.setItem(AUTH_USERS_KEY,JSON.stringify(accounts));}
function setAuthError(message){
  const error=document.querySelector("[data-auth-error]");
  if(error)error.textContent=message;
}
function setPhoneAuthError(message){
  const error=document.querySelector("[data-phone-auth-error]");
  if(error)error.textContent=message;
}
function renderAuth(){
  const signup=state.authMode==="signup",phone=state.authMethod==="phone";
  document.querySelector("#auth-screen").innerHTML=`
    <div class="auth-layout">
      <section class="auth-welcome">
        <a class="brand auth-brand" href="#" aria-label="Buzzy home"><img class="brand-icon" src="buzzy-icon.svg" alt=""><span>buzzy<span class="brand-period">.</span></span></a>
        <div class="auth-welcome-copy"><p class="eyebrow"><span class="eyebrow-dot"></span> YOUR PEOPLE ARE HERE</p><h1>Good things<br>happen when<br>you <span>show up.</span></h1><p>Find your people. Share your little moments. Make a little buzz.</p></div>
        <div class="auth-welcome-bottom"><span>✳</span> A place for the things you love.</div>
      </section>
      <section class="auth-card" aria-labelledby="auth-title">
        <div class="auth-card-top"><span class="auth-mobile-mark">✳</span><span>Already part of the buzz?</span><button class="auth-mode-link" data-auth-mode="${signup?"login":"signup"}">${signup?"Log in":"Sign up"}</button></div>
        <p class="auth-kicker">${signup?"YOUR NEXT CHAPTER STARTS HERE":"WELCOME BACK"}</p>
        <h2 id="auth-title">${signup?"Create your account":"Log in to Buzzy"}</h2>
        <p class="auth-subtitle">${signup?"A few details and you’re in.":"Your people and favorite moments are waiting."}</p>
        <div class="auth-mode-tabs" role="tablist" aria-label="Account access">
          <button role="tab" aria-selected="${!signup}" class="${!signup?"is-active":""}" data-auth-mode="login">Log in</button>
          <button role="tab" aria-selected="${signup}" class="${signup?"is-active":""}" data-auth-mode="signup">Sign up</button>
        </div>
        <div class="auth-method-tabs" role="tablist" aria-label="Sign-in method">
          <button role="tab" aria-selected="${!phone}" class="${!phone?"is-active":""}" data-auth-method="email">Email</button>
          <button role="tab" aria-selected="${phone}" class="${phone?"is-active":""}" data-auth-method="phone">Phone</button>
        </div>
        <p class="auth-error" data-auth-error role="alert"></p>
        ${phone?`<form id="phone-auth-form">
          ${signup?'<label class="auth-field">Your name<input name="name" type="text" autocomplete="name" maxlength="60" placeholder="How should we call you?" required></label>':""}
          <label class="auth-field">Phone number<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+1 555 123 4567" required></label>
          <label class="auth-field">One-time passcode<input name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter your OTP" required></label>
          <p class="auth-error" data-phone-auth-error role="alert"></p>
          <button class="secondary-button auth-otp-request" type="button" data-action="request-otp">Request OTP</button>
          <button class="auth-submit" type="button" data-action="verify-otp">Verify and continue <span>→</span></button>
          <p class="auth-demo-note">SMS verification is not connected in this prototype. No OTP will be sent or accepted.</p>
        </form>`:`<form id="auth-form">
          ${signup?'<label class="auth-field">Your name<input name="name" type="text" autocomplete="name" maxlength="60" placeholder="How should we call you?" required></label>':""}
          <label class="auth-field">Email address<input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
          <label class="auth-field">Password<input name="password" type="password" autocomplete="${signup?"new-password":"current-password"}" minlength="8" placeholder="At least 8 characters" required></label>
          ${signup?'<label class="biometric-opt-in"><input name="enablePasskey" type="checkbox"><span>Set up passkey / biometrics on this device</span></label>':""}
          <button class="auth-submit" type="submit">${signup?"Create account":"Log in"} <span>→</span></button>
        </form>`}
        <div class="auth-or"><span></span>OR<span></span></div>
        <button class="google-auth-button" type="button" data-action="google-auth"><span aria-hidden="true">G</span> Continue with Google</button>
        ${phone?"":'<button class="passkey-button" data-action="passkey-login"><span class="passkey-icon">◉</span> Sign in with passkey / biometrics</button>'}
        <p class="auth-legal">By continuing, you agree to Buzzy’s <a href="#terms" data-footer="Terms">Terms</a> and <a href="#privacy" data-footer="Privacy">Privacy Policy</a>.</p>
        <p class="auth-demo-note">Prototype email accounts are stored only in this browser. Google sign-in needs OAuth configuration and a secure server.</p>
      </section>
    </div>`;
}
function requestPhoneOtp(){
  const phone=document.querySelector("#phone-auth-form [name='phone']")?.value.trim()||"";
  if(!/^\+?[0-9\s().-]{7,24}$/.test(phone)){setPhoneAuthError("Enter a valid phone number first.");return;}
  setPhoneAuthError("SMS delivery is not configured for Buzzy yet, so no OTP was sent.");
}
function bytesToHex(bytes){return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");}
function bytesToBase64Url(bytes){
  let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function base64UrlToBytes(value){
  const base64=value.replace(/-/g,"+").replace(/_/g,"/"),padded=base64+"=".repeat((4-base64.length%4)%4);
  return Uint8Array.from(atob(padded),character=>character.charCodeAt(0));
}
async function hashPassword(password,saltHex){
  if(!crypto.subtle)throw new Error("Secure password hashing is unavailable in this browser context. Open Buzzy through HTTPS or localhost.");
  const salt=Uint8Array.from(saltHex.match(/.{2}/g)||[],byte=>parseInt(byte,16));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},key,256);
  return bytesToHex(new Uint8Array(bits));
}
function canUsePasskeys(){return Boolean(window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials);}
async function registerPasskey(account){
  if(!canUsePasskeys())throw new Error("Passkeys need a secure HTTPS or localhost address and browser support.");
  const challenge=crypto.getRandomValues(new Uint8Array(32));
  const credential=await navigator.credentials.create({publicKey:{
    challenge,rp:{name:"Buzzy"},user:{id:new TextEncoder().encode(account.id),name:account.email,displayName:account.name},
    pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
    authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"preferred",userVerification:"required"},
    timeout:60000,attestation:"none"
  }});
  if(!credential)throw new Error("The device did not create a passkey.");
  const accounts=readAccounts(),index=accounts.findIndex(saved=>saved.id===account.id);
  if(index<0)throw new Error("Could not find the new account to save its passkey.");
  accounts[index].passkeyId=bytesToBase64Url(new Uint8Array(credential.rawId));
  saveAccounts(accounts);
  return accounts[index];
}
function activateUser(account){
  state.currentUser=account;
  document.querySelector("#auth-screen").hidden=true;
  document.querySelector(".app-shell").hidden=false;
  document.querySelector(".mobile-nav").hidden=false;
  const profile=document.querySelector(".profile-chip");
  if(profile){profile.querySelector("strong").textContent=account.name;profile.querySelector("small").textContent=`@${account.email.split("@")[0]}`;}
  render();
}
function showAuth(){
  state.currentUser=null;
  document.querySelector("#auth-screen").hidden=false;
  document.querySelector(".app-shell").hidden=true;
  document.querySelector(".mobile-nav").hidden=true;
  renderAuth();
}
async function handleAuthSubmit(event){
  event.preventDefault();
  const form=event.target,fields=new FormData(form),email=fields.get("email").toString().trim().toLowerCase(),password=fields.get("password").toString();
  setAuthError("");
  try{
    const accounts=readAccounts();
    if(state.authMode==="signup"){
      const name=fields.get("name").toString().trim();
      if(name.length<2){setAuthError("Please enter a name with at least 2 characters.");return;}
      if(password.length<8){setAuthError("Choose a password with at least 8 characters.");return;}
      if(accounts.some(account=>account.email===email)){setAuthError("An account with that email already exists on this browser. Try logging in.");return;}
      const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const account={id:crypto.randomUUID(),name,email,salt,passwordHash:await hashPassword(password,salt)};
      accounts.push(account);saveAccounts(accounts);
      let passkeyWarning="";
      if(fields.get("enablePasskey")==="on"){
        try{await registerPasskey(account);}
        catch(error){passkeyWarning=` Account created, but passkey setup didn’t finish: ${error.message}`;}
      }
      sessionStorage.setItem(AUTH_SESSION_KEY,account.id);activateUser(account);
      notify(passkeyWarning?`Welcome to Buzzy!${passkeyWarning}`:"Welcome to Buzzy! Your account is saved on this browser.");
      return;
    }
    const account=accounts.find(saved=>saved.email===email);
    if(!account){setAuthError("No Buzzy account for that email on this browser. Sign up to create one.");return;}
    const candidate=await hashPassword(password,account.salt);
    if(candidate!==account.passwordHash){setAuthError("That email and password don’t match.");return;}
    sessionStorage.setItem(AUTH_SESSION_KEY,account.id);activateUser(account);notify(`Welcome back, ${account.name}!`);
  }catch(error){setAuthError(error.message||"Could not complete sign-in. Please try again.");}
}
async function handlePasskeyLogin(){
  const email=document.querySelector("#auth-email")?.value.trim().toLowerCase();
  setAuthError("");
  if(!email){setAuthError("Enter your email first so we can find your passkey.");return;}
  if(!canUsePasskeys()){setAuthError("Passkeys need a secure HTTPS or localhost address and browser support.");return;}
  try{
    const account=readAccounts().find(saved=>saved.email===email);
    if(!account?.passkeyId){setAuthError("No passkey saved for this email on this browser. Log in with your password or sign up and enable biometrics.");return;}
    const challenge=crypto.getRandomValues(new Uint8Array(32));
    const assertion=await navigator.credentials.get({publicKey:{challenge,allowCredentials:[{type:"public-key",id:base64UrlToBytes(account.passkeyId)}],userVerification:"required",timeout:60000}});
    if(!assertion||bytesToBase64Url(new Uint8Array(assertion.rawId))!==account.passkeyId){setAuthError("Passkey verification did not match this account.");return;}
    sessionStorage.setItem(AUTH_SESSION_KEY,account.id);activateUser(account);notify(`Welcome back, ${account.name}!`);
  }catch(error){
    if(error.name==="NotAllowedError")setAuthError("Passkey sign-in was cancelled or not approved.");
    else setAuthError(`Passkey sign-in failed: ${error.message||"try password sign-in instead."}`);
  }
}
function initializeAuth(){
  try{
    const userId=sessionStorage.getItem(AUTH_SESSION_KEY);
    if(userId){const account=readAccounts().find(saved=>saved.id===userId);if(account){activateUser(account);return;}}
    showAuth();
  }catch(error){showAuth();setAuthError(`Could not load local accounts: ${error.message}`);}
}
function getVisiblePosts(){
  return posts.filter(post=>{
    const creator=creatorFor(post.creator),query=state.search.trim().toLowerCase();
    return (state.feed!=="following"||state.followed.has(post.creator))
      &&(!state.activeTopic||creator.category===state.activeTopic||post.caption.toLowerCase().includes(state.activeTopic))
      &&(!query||`${post.caption} ${post.title} ${post.hashtags} ${creator.name} ${creator.handle} ${post.sound}`.toLowerCase().includes(query));
  });
}
function renderPost(post){
  const creator=creatorFor(post.creator),following=state.followed.has(creator.id);
  const media=post.videoUrl?`<video class="video-content" src="${post.videoUrl}" loop playsinline preload="metadata"></video>`:"";
  return `<article class="post" data-post-id="${post.id}"><div class="post-card">
    <div class="post-head"><img class="avatar" src="${creator.avatar}" alt=""><div class="post-user"><strong>${escapeHTML(creator.name)} ${verifiedBadge(creator)}</strong><small>${escapeHTML(creator.handle)} · ${escapeHTML(post.time)}</small></div>
      <button class="follow-button ${following?"is-following":""}" data-action="follow" data-creator="${creator.id}" aria-pressed="${following}">${following?"Following":"＋ Follow"}</button><button class="post-more" aria-label="More options" data-action="more">···</button></div>
    <div class="post-visual" role="img" aria-label="${escapeHTML(post.title)} by ${escapeHTML(creator.name)}" style="background-image:url('${post.image||""}')">${media}<span class="visual-indicator">▶ &nbsp; BUZZ</span>
      <button class="visual-mute" data-action="mute" data-post="${post.id}" aria-label="${state.soundEnabled?"Mute":"Unmute"} sound">${state.soundEnabled?"♫":"♩"}</button><button class="play-button" data-action="play" data-post="${post.id}" aria-label="Play ${escapeHTML(post.title)}">▶</button>
      <div class="visual-caption"><div class="caption-kicker">${escapeHTML(post.kicker)}</div><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.overlay)}</p></div></div>
    <div class="post-info"><p class="post-caption"><strong>${escapeHTML(creator.handle)}</strong> ${escapeHTML(post.caption)}<span class="hashtags">${escapeHTML(post.hashtags)}</span></p><div class="post-meta"><span>♫ ${escapeHTML(post.sound)}</span><span>${escapeHTML(post.views)} views</span></div><button class="post-subscribe ${state.subscribed.has(creator.id)?"is-subscribed":""}" data-action="subscribe" data-creator="${creator.id}">${state.subscribed.has(creator.id)?"Subscribed ✓":"Subscribe · $2/month"}</button></div></div>
    <div class="post-actions" aria-label="Post actions"><button class="action-button ${post.liked?"is-liked":""}" data-action="like" data-post="${post.id}" aria-label="${post.liked?"Unlike":"Like"} this loop" aria-pressed="${post.liked}"><span>${post.liked?"♥":"♡"}</span><small>${formatCount(post.likes)}</small></button>
      <button class="action-button" data-action="comments" data-post="${post.id}" aria-label="View ${post.comments} comments"><span>▢</span><small>${formatCount(post.comments)}</small></button>
      <button class="action-button ${post.saved?"is-saved":""}" data-action="save" data-post="${post.id}" aria-label="${post.saved?"Remove from":"Add to"} saved loops" aria-pressed="${post.saved}"><span>${post.saved?"◆":"◇"}</span><small>Save</small></button>
      <button class="action-button" data-action="share" data-post="${post.id}" aria-label="Share this loop"><span>↗</span><small>Share</small></button></div></article>`;
}
function renderFeedPost(post){
  const creator=creatorFor(post.creator),following=state.followed.has(creator.id);
  const video=post.videoUrl?`<video class="short-video" src="${post.videoUrl}" poster="${post.image}" muted autoplay loop playsinline preload="metadata"></video>`:"";
  const liveButton=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.liveFollowers
    ?'<button class="short-live" data-action="feature-demo" data-feature="live" aria-label="Open livestream">◉ <span>LIVE</span></button>':"";
  return `<article class="short-post" data-post-id="${post.id}">
    <div class="short-stage" role="group" aria-label="${escapeHTML(post.title)} by ${escapeHTML(creator.name)}" style="background-image:url('${escapeHTML(post.image||"")}')">
      ${video}
      <header class="short-topbar">
        ${liveButton}
        <nav class="short-tabs" aria-label="Feed sections">
          <button class="short-tab" data-nav="explore">Explore</button>
          <button class="short-tab ${state.feed==="following"?"is-active":""}" data-nav="following">Following</button>
          <button class="short-tab ${state.feed==="foryou"?"is-active":""}" data-nav="home">For You</button>
        </nav>
        <button class="short-search" data-nav="explore" aria-label="Search">⌕</button>
      </header>
      <aside class="short-actions" aria-label="Loop actions">
        <button class="short-creator" data-action="follow" data-creator="${creator.id}" aria-label="${following?"Unfollow":"Follow"} ${escapeHTML(creator.name)}" aria-pressed="${following}">
          <img src="${creator.avatar}" alt=""><span>${following?"✓":"＋"}</span>
        </button>
        <button class="short-action ${post.liked?"is-liked":""}" data-action="like" data-post="${post.id}" aria-label="${post.liked?"Unlike":"Like"} this loop" aria-pressed="${post.liked}"><span>♥</span><small>${formatCount(post.likes)}</small></button>
        <button class="short-action" data-action="comments" data-post="${post.id}" aria-label="View comments"><span>▢</span><small>${formatCount(post.comments)}</small></button>
        <button class="short-action ${post.saved?"is-saved":""}" data-action="save" data-post="${post.id}" aria-label="${post.saved?"Remove saved loop":"Save loop"}" aria-pressed="${post.saved}"><span>▣</span><small>Save</small></button>
        <button class="short-action" data-action="share" data-post="${post.id}" aria-label="Share loop"><span>➦</span><small>Share</small></button>
      </aside>
      <div class="short-caption">
        <div class="short-author"><strong>${escapeHTML(creator.handle)} ${verifiedBadge(creator)}</strong><span>${escapeHTML(post.time)}</span></div>
        <p>${escapeHTML(post.caption)} <span class="short-hashtags">${escapeHTML(post.hashtags)}</span></p>
        <div class="short-sound"><span>♫</span> ${escapeHTML(post.sound)}</div>
      </div>
    </div>
  </article>`;
}
function renderFeed(){const scrollTop=feedElement.scrollTop,visible=getVisiblePosts();feedElement.classList.add("short-feed");feedElement.innerHTML=visible.map(renderFeedPost).join("");feedElement.scrollTop=scrollTop;emptyState.hidden=visible.length>0;feedElement.hidden=visible.length===0;}
function renderCreators(){
  const suggestions=creators.filter(creator=>!state.followed.has(creator.id)).slice(0,3),list=document.querySelector("#suggested-creators");
  list.innerHTML=suggestions.length?suggestions.map(creator=>`<div class="creator-row"><img src="${creator.avatar}" alt=""><div class="creator-details"><strong>${escapeHTML(creator.name)} ${verifiedBadge(creator)}</strong><small>${escapeHTML(creator.handle)} · ${escapeHTML(creator.category)}</small></div><button class="creator-follow" data-action="follow" data-creator="${creator.id}" aria-label="Follow ${escapeHTML(creator.name)}">Follow</button></div>`).join(""):'<p class="modal-empty">You’re all caught up — nice!</p>';
}
function renderStories(){
  const now=Date.now();state.stories=state.stories.filter(story=>story.expiresAt>now);
  const root=document.querySelector("#stories-list");if(!root)return;
  root.innerHTML=`<button class="story-item story-add" data-action="add-story"><span class="story-avatar"><img src="${state.currentUser?.avatar||creators[0].avatar}" alt=""><i>＋</i></span><strong>Your story</strong></button>`+
    state.stories.map(story=>`<button class="story-item" data-action="view-story" data-story="${escapeHTML(story.id)}"><span class="story-avatar ${story.owner?"own-story":"has-story"}"><img src="${story.avatar}" alt=""></span><strong>${escapeHTML(story.owner?"Your story":story.name.split(" ")[0])}</strong></button>`).join("");
}
function render(){if(["home","following"].includes(state.currentPage))document.querySelector(".app-shell").classList.add("is-short-feed");renderFeed();renderCreators();renderStories();}
function initializeStories(){
  const now=Date.now();
  state.stories=creators.slice(0,3).map((creator,index)=>({id:`story-${creator.id}`,name:creator.name,avatar:creator.avatar,mediaUrl:creator.avatar,mediaType:"image",caption:["A little moment from today ☀️","Taking the scenic route 🌿","Making something just for fun 🎨"][index],createdAt:now-(index+1)*3600000,expiresAt:now+storyExpiry-(index+1)*3600000,owner:false}));
  window.setInterval(()=>{const old=state.stories.length;state.stories=state.stories.filter(story=>story.expiresAt>Date.now());if(old!==state.stories.length)renderStories();},60000);
}
function notify(message){toastElement.textContent=message;toastElement.classList.add("is-visible");clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>toastElement.classList.remove("is-visible"),2600);}
function setFeed(feed){
  state.feed=feed;state.activeTopic="";
  document.querySelectorAll(".feed-tab").forEach(tab=>{const active=tab.dataset.feed===feed;tab.classList.toggle("is-active",active);tab.setAttribute("aria-selected",String(active));});
  const activeDestination=feed==="following"?"following":"home";
  document.querySelectorAll(".short-tab").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.nav===activeDestination));
  document.querySelectorAll(".mobile-nav [data-nav]").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.nav===activeDestination));
  document.querySelector(".feed-tabs").classList.toggle("following-active",feed==="following");
  document.querySelectorAll(".topic-pills button").forEach(button=>button.classList.remove("is-selected"));renderFeed();
}
function findPost(id){return posts.find(post=>post.id===id);}
function closeModal(){modalRoot.innerHTML="";document.body.style.overflow="";}
function stopCameraPreview(){
  state.cameraRequestId++;
  const preview=document.querySelector("#camera-preview");
  if(preview)preview.srcObject=null;
  if(state.cameraStream){state.cameraStream.getTracks().forEach(track=>track.stop());state.cameraStream=null;}
}
function leaveCameraPage(){
  stopCameraPreview();
  document.querySelector(".app-shell").classList.remove("is-camera-page");
  pageRoot.classList.remove("camera-page-root");
}
async function requestCameraAccess(){
  const status=document.querySelector("[data-camera-status]");
  if(!navigator.mediaDevices?.getUserMedia){
    if(status){status.textContent="Camera access is unavailable here. Choose a photo or video from your device instead.";status.hidden=false;}
    return;
  }
  const requestId=++state.cameraRequestId;
  if(status){status.textContent="Requesting camera access…";status.hidden=false;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.cameraFacing},audio:false});
    if(state.currentPage!=="camera"||requestId!==state.cameraRequestId){stream.getTracks().forEach(track=>track.stop());return;}
    state.cameraStream=stream;
    const preview=document.querySelector("#camera-preview");
    if(preview){preview.srcObject=stream;await preview.play();}
    if(status&&requestId===state.cameraRequestId)status.hidden=true;
  }catch(error){
    if(requestId===state.cameraRequestId){
      stopCameraPreview();
      const currentStatus=document.querySelector("[data-camera-status]");
      if(currentStatus){
        currentStatus.textContent=error.name==="NotAllowedError"?"Camera permission was denied. Allow camera access or choose media from your device.":`Could not open the camera: ${error.message||"camera unavailable"}. Choose media from your device instead.`;
        currentStatus.hidden=false;
      }
    }
  }
}
function showCreateCamera(){
  if(modalRoot.firstElementChild)closeModal();
  leaveCameraPage();
  state.pageMode=false;state.currentPage="camera";state.cameraMode="photo";
  const appShell=document.querySelector(".app-shell");
  appShell.classList.remove("is-short-feed","is-profile-page");
  appShell.classList.add("is-camera-page");
  document.body.classList.remove("is-profile-page");
  pageRoot.classList.remove("profile-page-root");
  pageRoot.classList.add("camera-page-root");
  const liveMode=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.liveFollowers
    ?'<button class="camera-mode" role="tab" data-camera-mode="live">LIVE</button>':"";
  pageRoot.innerHTML=`<section class="camera-screen" aria-label="Create a post">
    <video id="camera-preview" class="camera-preview" autoplay muted playsinline></video>
    <div class="camera-shade"></div>
    <header class="camera-header">
      <button class="camera-icon-button" data-action="close-camera" aria-label="Close camera">×</button>
      <span class="camera-header-title">Create</span>
      <button class="camera-icon-button" data-action="camera-setting" data-setting="flash" aria-label="Toggle flash">⚡</button>
    </header>
    <p class="camera-status" data-camera-status role="status">Requesting camera access…</p>
    <aside class="camera-tools" aria-label="Camera tools">
      <button data-action="camera-setting" data-setting="sound" aria-label="Sound">♫<small>Sound</small></button>
      <button data-action="camera-setting" data-setting="timer" aria-label="Timer">◷<small>Timer</small></button>
      <button data-action="camera-setting" data-setting="effects" aria-label="Effects">✧<small>Effects</small></button>
      <button data-action="flip-camera" aria-label="Flip camera">⟳<small>Flip</small></button>
    </aside>
    <div class="camera-footer">
      <div class="camera-modes" role="tablist" aria-label="Capture mode">
        <button class="camera-mode" role="tab" aria-selected="false" data-camera-mode="text">TEXT</button>
        <button class="camera-mode" role="tab" aria-selected="false" data-camera-mode="15s">15s</button>
        <button class="camera-mode is-active" role="tab" aria-selected="true" data-camera-mode="photo">PHOTO</button>
        <button class="camera-mode" role="tab" aria-selected="false" data-camera-mode="60s">60s</button>
        ${liveMode}
      </div>
      <div class="camera-capture-row">
        <button class="camera-gallery" data-action="upload" aria-label="Choose from gallery">▧<small>Gallery</small></button>
        <button class="camera-capture" data-action="camera-capture" aria-label="Take photo"><span></span></button>
        <button class="camera-flip" data-action="flip-camera" aria-label="Flip camera">⟳</button>
      </div>
      <nav class="camera-bottom-tabs" aria-label="Create tools">
        <button data-camera-mode="15s">STORY</button><button class="is-active" data-camera-mode="photo">CAMERA</button><button data-action="upload">UPLOAD</button>
      </nav>
    </div>
  </section>`;
  pageRoot.hidden=false;
  document.querySelector(".content-layout").hidden=true;
  requestCameraAccess();
}
function showCameraTextComposer(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close text post">×</button><p class="studio-eyebrow">A LITTLE NOTE</p><h2>Create a text post</h2><form id="camera-text-form"><label class="auth-field">What’s on your mind?<textarea class="upload-caption camera-text-input" name="caption" maxlength="220" required placeholder="Write something worth sharing..."></textarea></label><button class="primary-button upload-submit" type="submit">Share your post</button></form>`);
}
function showCameraPhotoReview(imageUrl){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close photo preview">×</button><h2>Looks like a moment</h2><img class="camera-review-image" src="${imageUrl}" alt="Captured photo"><form id="camera-share-form"><label class="auth-field">Add a caption<textarea class="upload-caption" name="caption" maxlength="220" placeholder="What’s the little story behind it?"></textarea></label><button class="primary-button upload-submit" type="submit">Share to your feed</button></form><button class="secondary-button upload-submit" data-action="close-modal">Retake photo</button>`);
}
function publishCameraPost(imageUrl,caption){
  const title=caption.trim().slice(0,42)||"A little moment";
  posts.unshift({id:`local-${Date.now()}`,creator:"maya",time:"Just now",title,kicker:"FRESH FROM YOU",overlay:caption.trim()||"a little moment worth keeping",caption:caption.trim()||"A little moment worth sharing.",hashtags:"#yourbuzz #littlemoments",image:imageUrl,likes:0,comments:0,views:"0",sound:"original audio",liked:false,saved:false,commentsList:[]});
  state.followed.add("maya");state.search="";state.activeTopic="";
  document.querySelector("#search-input").value="";
  closeModal();showHomePage();notify("Your photo is live — thanks for sharing a little moment!");
}
function captureCameraPhoto(){
  if(state.cameraMode==="text"){showCameraTextComposer();return;}
  if(state.cameraMode!=="photo"){notify("Video capture is not available in this preview yet. Use Gallery to upload a clip.");return;}
  const preview=document.querySelector("#camera-preview");
  if(!preview?.videoWidth){notify("Camera is not ready. Allow camera access or choose media from Gallery.");return;}
  const canvas=document.createElement("canvas");
  canvas.width=preview.videoWidth;canvas.height=preview.videoHeight;
  canvas.getContext("2d")?.drawImage(preview,0,0,canvas.width,canvas.height);
  canvas.toBlob(blob=>{
    if(!blob){notify("Could not capture this photo. Try again or choose media from Gallery.");return;}
    const imageUrl=URL.createObjectURL(blob);state.cameraObjectUrls.push(imageUrl);showCameraPhotoReview(imageUrl);
  },"image/jpeg",.92);
}
function openPage(title,kicker,description,content){
  if(state.currentPage==="camera")leaveCameraPage();
  state.currentPage=title;
  document.querySelector(".app-shell").classList.remove("is-short-feed");
  document.querySelector(".app-shell").classList.remove("is-profile-page");
  document.body.classList.remove("is-profile-page");
  pageRoot.classList.remove("profile-page-root");
  pageRoot.innerHTML=`<section class="page-view"><header class="page-header"><div><p class="studio-eyebrow">${escapeHTML(kicker)}</p><h1>${escapeHTML(title)}</h1><p>${escapeHTML(description)}</p></div><button class="page-back" data-nav="home">← Feed</button></header><div class="page-content">${content}</div></section>`;
  pageRoot.hidden=false;document.querySelector(".content-layout").hidden=true;window.scrollTo({top:0,behavior:"smooth"});
}
function openProfilePage(content){
  if(state.currentPage==="camera")leaveCameraPage();
  state.currentPage="Your profile";
  document.querySelector(".app-shell").classList.remove("is-short-feed");
  document.querySelector(".app-shell").classList.add("is-profile-page");
  document.body.classList.add("is-profile-page");
  pageRoot.classList.add("profile-page-root");
  pageRoot.innerHTML=`<section class="profile-screen">${content}</section>`;
  pageRoot.hidden=false;document.querySelector(".content-layout").hidden=true;window.scrollTo({top:0,behavior:"smooth"});
}
function showHomePage(feed="foryou"){
  if(state.currentPage==="camera")leaveCameraPage();
  state.currentPage=feed==="following"?"following":"home";document.querySelector(".app-shell").classList.remove("is-profile-page");document.body.classList.remove("is-profile-page");pageRoot.classList.remove("profile-page-root");document.querySelector(".app-shell").classList.add("is-short-feed");pageRoot.hidden=true;pageRoot.innerHTML="";document.querySelector(".content-layout").hidden=false;feedElement.scrollTop=0;setFeed(feed);window.scrollTo({top:0,behavior:"smooth"});
}
function openModal(content){
  if(state.pageMode){
    state.pageMode=false;
    const body=content
      .replace(/<button class="modal-close"[^>]*>×<\/button>/,"")
      .replace(/<p class="studio-eyebrow">[\s\S]*?<\/p>/,"")
      .replace(/<h2>[\s\S]*?<\/h2>/,"")
      .replace(/<p class="modal-intro">[\s\S]*?<\/p>/,"");
    openPage(state.pageTitle,state.pageKicker,state.pageDescription,body);
    return;
  }
  modalRoot.innerHTML=`<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`;document.body.style.overflow="hidden";modalRoot.querySelector(".modal-close")?.focus();
}
function renderSavedPage(){
  const saved=posts.filter(post=>post.saved);
  openPage("Saved loops","YOUR COLLECTION",`${saved.length} loops saved for a little later.`,saved.length?`<div class="feed-list">${saved.map(renderPost).join("")}</div>`:'<div class="page-empty"><span>♧</span><h2>Your saved loops will live here</h2><p>Tap the bookmark on a loop to keep it close.</p><button class="primary-button" data-nav="home">Explore the feed</button></div>');
}
function showFollowingPage(){
  showHomePage("following");
}
function showExplorePage(){
  openPage("Explore","FIND YOUR NEXT FAVOURITE","Discover creators, sounds, and ideas from across Buzzy.",`<div class="explore-page-grid">${creators.map(creator=>`<article class="explore-creator"><img src="${creator.avatar}" alt=""><div><strong>${escapeHTML(creator.name)} ${verifiedBadge(creator)}</strong><small>${escapeHTML(creator.handle)} · ${escapeHTML(creator.category)}</small></div><button class="creator-follow" data-action="follow" data-creator="${creator.id}">${state.followed.has(creator.id)?"Following":"Follow"}</button></article>`).join("")}</div><h2 class="page-section-heading">Browse by mood</h2><div class="topic-pills">${["slow living","easy recipes","outdoors","creative"].map(topic=>`<button data-topic="${topic}">${escapeHTML(topic)}</button>`).join("")}</div>`);
}
function showNotificationsPage(){
  openPage("Notifications","YOUR UPDATES","A quiet little inbox for activity on your Buzzy account.",'<div class="page-empty"><span>♧</span><h2>You’re all caught up</h2><p>New likes, replies, and creator updates will show up here.</p><button class="primary-button" data-nav="messages">Go to messages</button></div>');
}
function renderProfileGrid(){
  const grid=document.querySelector("#profile-video-grid");if(!grid)return;
  const localPosts=posts.filter(post=>post.id.startsWith("local-"));
  const candidates=state.profileTab==="posts"?(localPosts.length?localPosts:posts.slice(0,6))
    :state.profileTab==="saved"?posts.filter(post=>post.saved)
    :state.profileTab==="likes"?posts.filter(post=>post.liked):[];
  if(candidates.length){
    const sampleNotice=state.profileTab==="posts"&&!localPosts.length?'<div class="profile-grid-note">Sample videos in this preview</div>':"";
    grid.innerHTML=sampleNotice+candidates.map((post,index)=>{const creator=creatorFor(post.creator);return `<button class="profile-video-tile" data-action="profile-post" data-post="${post.id}" aria-label="Open ${escapeHTML(post.title)}"><img src="${post.image||creator.avatar}" alt=""><span class="profile-video-overlay">${index<3&&state.profileTab==="posts"?'<b>Pinned</b>':""}<small>▶ ${formatCount(post.likes)}</small></span></button>`;}).join("");
  }else{
    const emptyMessages={private:"Your private videos will appear here.",reposts:"Videos you repost will show up here.",saved:"Save a loop to keep it close.",likes:"Your liked videos will appear here."};
    grid.innerHTML=`<div class="profile-grid-empty"><span>▧</span><p>${emptyMessages[state.profileTab]||"Your posts will appear here."}</p></div>`;
  }
}
function showProfilePage(){
  const name=state.currentUser?.name||"Jamie Parker",handle=state.currentUser?`@${state.currentUser.email.split("@")[0]}`:"@jamiecreates",avatar=state.currentUser?.avatar||document.querySelector(".profile-chip img").src;
  const following=state.followed.size,likes=posts.reduce((total,post)=>total+post.likes,0),tabItems=[["posts","▦"],["private","▣"],["reposts","⇄"],["saved","♧"],["likes","♡"]];
  const tabs=tabItems.map(([id,icon])=>`<button class="profile-tab ${state.profileTab===id?"is-active":""}" role="tab" aria-selected="${state.profileTab===id}" data-profile-tab="${id}" aria-label="${id}">${icon}</button>`).join("");
  openProfilePage(`<header class="profile-toolbar"><button class="profile-tool" data-nav="following" aria-label="Find friends"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20zM19 7v7m-3.5-3.5h7"/></svg></button><div class="profile-toolbar-actions"><button class="profile-notifications" data-nav="inbox" aria-label="Notifications"><img src="${escapeHTML(avatar)}" alt=""><b>99</b></button><button class="profile-tool" data-action="share-profile" aria-label="Share profile">➦</button><button class="profile-tool profile-menu" data-nav="hub" aria-label="More features">☰</button></div></header>
    <div class="profile-avatar-area"><button class="profile-avatar" data-action="add-story" aria-label="Add to your story"><img src="${escapeHTML(avatar)}" alt=""><span>＋</span></button><div class="profile-thought">What’s good?<i></i></div></div>
    <section class="profile-summary"><div class="profile-name-row"><h1>${escapeHTML(name.toUpperCase())}<button data-action="edit-profile" aria-label="Edit profile details">⌄</button></h1><button class="profile-edit" data-action="edit-profile">Edit</button></div><p class="profile-handle">${escapeHTML(handle)}</p>
      <div class="profile-stats"><button data-nav="following"><strong>${following}</strong><span>Following</span></button><div><strong>${CREATOR_METRICS.followers.toLocaleString()}</strong><span>Followers</span></div><div><strong>${formatCount(likes)}</strong><span>Likes</span></div></div>
      <p class="profile-bio">${escapeHTML(state.currentUser?.bio||"digital creator\nRoad to 10k Followers")}</p>
    </section>
    ${state.profileHighlightDismissed?"":'<button class="profile-highlight" data-action="highlight"><span>✧</span><strong>Create Story Highlights for your profile</strong><span>›</span><span data-action="dismiss-highlights" aria-label="Dismiss">×</span></button>'}
    <nav class="profile-tabs" role="tablist" aria-label="Profile video categories">${tabs}</nav>
    <div id="profile-video-grid" class="profile-video-grid"></div>
    <h2 class="page-section-heading">More from Buzzy</h2><nav class="profile-shortcuts" aria-label="More Buzzy pages"><button data-nav="saved">♧ Saved loops</button><button data-nav="studio">✳ Creator studio</button><button data-nav="communities">♧ Communities</button><button data-nav="bulletin">▤ Bulletin board</button><button data-nav="marketplace">◇ Marketplace</button><button data-nav="games">♜ Gaming zone</button><button data-nav="janet">✧ Janet AI</button><button data-nav="coins">◉ Coins & gifts</button></nav>`);
  renderProfileGrid();
}
function showEditProfile(){
  const name=state.currentUser?.name||"Jamie Parker",bio=state.currentUser?.bio||"digital creator\nRoad to 10k Followers";
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close profile editor">×</button><p class="studio-eyebrow">YOUR PROFILE</p><h2>Edit profile</h2><form id="profile-form"><label class="auth-field">Display name<input name="displayName" maxlength="40" value="${escapeHTML(name)}" required></label><label class="auth-field">Bio<textarea name="bio" maxlength="160" class="upload-caption">${escapeHTML(bio)}</textarea></label><button class="primary-button upload-submit" type="submit">Save changes</button></form><p class="demo-disclaimer">Profile edits are saved in this browser preview.</p>`);
}
function navigateFeaturePage(destination){
  const routes={
    studio:{title:"Creator studio",kicker:"YOUR CREATOR SPACE",description:"Track your growth and unlock creator tools.",render:showCreatorStudio},
    hub:{title:"Explore Buzzy",kicker:"YOUR BUZZ, YOUR WAY",description:"Find your community, create, shop, or play.",render:showHub},
    communities:{title:"Groups & communities",kicker:"FIND YOUR PEOPLE",description:"Join a community around what you love, or start a new one.",render:showCommunities},
    bulletin:{title:"Bulletin board",kicker:"CREATOR BULLETIN",description:"Announcements and updates for your community.",render:showBulletin},
    coins:{title:"Coins & live gifts",kicker:"SUPPORT YOUR FAVOURITE CREATORS",description:"Preview coin packs and gifts by country or region.",render:showCoins},
    marketplace:{title:"Creator marketplace",kicker:"MADE BY THE COMMUNITY",description:"Discover creator-made art, guides, and goods.",render:showMarketplace},
    games:{title:"Gaming zone",kicker:"PLAY TOGETHER",description:"Connect with friends and start a casual game.",render:showGames},
    janet:{title:"Janet AI",kicker:"YOUR CREATIVE SIDEKICK",description:"Turn an idea into an image prompt or video storyboard.",render:showJanet},
    messages:{title:"Private messages",kicker:"JUST BETWEEN YOU",description:"Chat and share in your browser preview.",render:showMessages}
  };
  const route=routes[destination];if(!route)return;
  state.pageTitle=route.title;state.pageKicker=route.kicker;state.pageDescription=route.description;state.pageMode=true;
  route.render();
}
async function shareProfile(){
  const name=state.currentUser?.name||"Jamie Parker",handle=state.currentUser?`@${state.currentUser.email.split("@")[0]}`:"@jamiecreates";
  const data={title:`${name} on Buzzy`,text:`Check out ${handle} on Buzzy.`};
  if(navigator.share){try{await navigator.share(data);}catch(error){if(error.name!=="AbortError")notify("Couldn’t share your profile. Try again.");}}
  else if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(`${data.title}\n${data.text}`);notify("Profile details copied to share.");}catch{notify("Sharing isn’t available in this browser.");}}
  else notify("Sharing isn’t available in this browser.");
}
function showComments(post){
  const comments=post.commentsList.map(comment=>{const creator=creatorFor(comment.creator)||creators[0];return `<div class="comment"><img src="${creator.avatar}" alt=""><div><strong>${escapeHTML(creator.name)} <small>· ${escapeHTML(comment.time)}</small></strong><p>${escapeHTML(comment.text)}</p></div></div>`;}).join("");
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close comments">×</button><h2>Good things being said</h2><p class="modal-intro">${formatCount(post.comments)} people joined the conversation</p><div class="comment-list">${comments||'<p class="modal-empty">Be the first to leave a little love.</p>'}</div><form class="comment-form" data-post="${post.id}"><input name="comment" maxlength="240" placeholder="Add something kind..." aria-label="Write a comment" required><button type="submit">Send</button></form>`);
}
function showCreatorStudio(){
  const liveEligible=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.liveFollowers;
  const callEligible=liveEligible;
  const monetizationEligible=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.monetizationFollowers&&CREATOR_METRICS.views>=CREATOR_THRESHOLDS.monetizationViews;
  const followerProgress=Math.min(100,Math.round(CREATOR_METRICS.followers/CREATOR_THRESHOLDS.monetizationFollowers*100));
  const viewProgress=Math.min(100,Math.round(CREATOR_METRICS.views/CREATOR_THRESHOLDS.monetizationViews*100));
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close creator studio">×</button>
    <p class="studio-eyebrow">YOUR CREATOR SPACE</p><h2>Creator studio</h2><p class="modal-intro">See what you’ve unlocked and what’s next. Sample creator stats for this prototype.</p>
    <div class="studio-stats"><div><strong>${CREATOR_METRICS.followers.toLocaleString()}</strong><span>followers</span></div><div><strong>${CREATOR_METRICS.views.toLocaleString()}</strong><span>video views</span></div></div>
    <div class="studio-section-title">CREATOR FEATURES</div>
    <div class="eligibility-row ${liveEligible?"is-unlocked":"is-locked"}"><span class="eligibility-icon">◉</span><div class="eligibility-copy"><strong>Livestreaming</strong><small>Unlock at 1,000 followers</small></div><span class="eligibility-status">${liveEligible?"UNLOCKED":"LOCKED"}</span><button class="studio-feature-button" data-action="feature-demo" data-feature="live" ${liveEligible?"":"disabled"}>${liveEligible?"Try live":"Keep growing"}</button></div>
    <div class="eligibility-row ${callEligible?"is-unlocked":"is-locked"}"><span class="eligibility-icon">▣</span><div class="eligibility-copy"><strong>Video calls</strong><small>Unlock at 1,000 followers</small></div><span class="eligibility-status">${callEligible?"UNLOCKED":"LOCKED"}</span><button class="studio-feature-button" data-action="feature-demo" data-feature="call" ${callEligible?"":"disabled"}>${callEligible?"Try a call":"Keep growing"}</button></div>
    <div class="eligibility-row ${monetizationEligible?"is-unlocked":"is-locked"}"><span class="eligibility-icon">$</span><div class="eligibility-copy"><strong>Creator monetization</strong><small>Requires 10,000 followers and 100,000 views</small></div><span class="eligibility-status">${monetizationEligible?"ELIGIBLE":"IN PROGRESS"}</span></div>
    <div class="progress-item"><div><span>Followers</span><span>${CREATOR_METRICS.followers.toLocaleString()} / ${CREATOR_THRESHOLDS.monetizationFollowers.toLocaleString()}</span></div><div class="progress-track"><span style="width:${followerProgress}%"></span></div></div>
    <div class="progress-item"><div><span>Video views</span><span>${CREATOR_METRICS.views.toLocaleString()} / ${CREATOR_THRESHOLDS.monetizationViews.toLocaleString()}</span></div><div class="progress-track"><span style="width:${viewProgress}%"></span></div></div>
    <div class="studio-subscription"><span class="subscription-icon">♡</span><div><strong>Fan subscriptions</strong><small>Offer exclusive perks for $2/month</small></div><span class="subscription-price">$2<span>/mo</span></span></div>
    <p class="demo-disclaimer">Demo only: live video, calls, billing, and payouts require a secure backend and are not connected.</p>
    <button class="studio-logout" data-action="logout">Log out of Buzzy</button>`);
}
function showSubscriptionOffer(creatorId){
  const creator=creatorFor(creatorId);if(!creator)return;
  const alreadySubscribed=state.subscribed.has(creator.id);
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close subscription offer">×</button><span class="subscription-modal-icon">♡</span>
    <p class="studio-eyebrow">SUPPORT A CREATOR</p><h2>${alreadySubscribed?"You’re subscribed!":`Join ${escapeHTML(creator.name)}’s community`}</h2>
    <p class="modal-intro">${alreadySubscribed?"You’re enjoying their exclusive subscriber updates.":`Get creator-only updates and support ${escapeHTML(creator.handle)}.`}</p>
    <div class="subscription-checkout"><div><strong>Monthly creator subscription</strong><small>Cancel any time</small></div><strong>$2.00<small> / month</small></strong></div>
    <p class="demo-disclaimer">Prototype preview only. No payment will be collected.</p>
    ${alreadySubscribed?'<button class="primary-button upload-submit" data-action="close-modal">Sounds good</button>':`<button class="primary-button upload-submit" data-action="confirm-subscription" data-creator="${creator.id}">Subscribe for $2/month</button>`}`);
}
function showFeatureDemo(feature){
  const isLive=feature==="live",title=isLive?"Go live on Buzzy":"Start a video call";
  const eligible=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.liveFollowers;
  if(!eligible){notify("Reach 1,000 followers to unlock this feature.");return;}
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close feature preview">×</button><span class="feature-preview-icon">${isLive?"◉":"▣"}</span><p class="studio-eyebrow">CREATOR FEATURE PREVIEW</p><h2>${title}</h2>
    <p class="modal-intro">${isLive?"Connect with your followers in real time. Your live room is ready to preview.":"Have a face-to-face video chat with your community."}</p>
    <div class="feature-preview-card"><strong>${isLive?"Your live room":"Video call"}</strong><span>@jamiecreates · ${CREATOR_METRICS.followers.toLocaleString()} followers</span><small>Unlocked at 1,000 followers ✓</small></div>
    <p class="demo-disclaimer">Preview only: connecting to a real stream or call requires a live-video service.</p>
    <button class="primary-button upload-submit" data-action="start-feature-demo" data-feature="${feature}">${isLive?"Start demo livestream":"Start demo call"}</button>
    ${isLive?'<button class="secondary-button upload-submit" data-action="open-gifts">🎁 Send a gift</button>':""}`);
}
function showHub(){
  const liveButton=CREATOR_METRICS.followers>=CREATOR_THRESHOLDS.liveFollowers
    ?'<button class="hub-live" data-action="feature-demo" data-feature="live">◉ &nbsp; Open livestream & gifts</button>':"";
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close features">×</button><p class="studio-eyebrow">YOUR BUZZ, YOUR WAY</p><h2>Explore Buzzy</h2><p class="modal-intro">Find your community, create with Janet, shop creator-made goods, or play together.</p><div class="hub-grid">
    <button data-nav="communities"><span>♧</span><strong>Groups & communities</strong><small>Join people who get your thing</small></button><button data-nav="bulletin"><span>▤</span><strong>Bulletin board</strong><small>Creator posts · 50K followers</small></button><button data-nav="marketplace"><span>◇</span><strong>Creator marketplace</strong><small>Shop and list your work</small></button><button data-nav="games"><span>♜</span><strong>Gaming zone</strong><small>Connect and play with friends</small></button><button data-nav="janet"><span>✧</span><strong>Janet AI studio</strong><small>Image ideas and video storyboards</small></button><button data-nav="messages"><span>✉</span><strong>Private messages</strong><small>Chat, share files, send voice notes</small></button><button data-nav="coins"><span>◉</span><strong>Coins & gifts</strong><small>Choose your country and currency</small></button></div>${liveButton}`);
}
function showCommunities(){
  try{const saved=JSON.parse(localStorage.getItem(COMMUNITY_KEY)||"[]");state.communities=Array.isArray(saved)?saved:[];}catch(error){notify(`Could not load communities: ${error.message}`);state.communities=[];}
  const examples=[{id:"c-slow",name:"Slow Living Club",description:"A soft place for slower days and small joys.",members:24800},{id:"c-makers",name:"The Makers' Table",description:"Share what you’re making and cheer each other on.",members:18300},{id:"c-outside",name:"Outside Together",description:"Little adventures, local trails, and fresh air.",members:32700},...state.communities];
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close communities">×</button><p class="studio-eyebrow">FIND YOUR PEOPLE</p><h2>Groups & communities</h2><p class="modal-intro">Join a community around what you love, or start a new one.</p><form class="inline-create-form" id="community-form"><input name="name" maxlength="48" placeholder="Name your new community" required aria-label="Community name"><button class="primary-button" type="submit">＋ Create</button></form><div class="community-list">${examples.map(group=>`<div class="community-card"><span class="community-art">${escapeHTML(group.name.slice(0,1).toUpperCase())}</span><div><strong>${escapeHTML(group.name)}</strong><small>${escapeHTML(group.description)}</small><small>${Number(group.members).toLocaleString()} members</small></div><button class="small-join ${state.joinedCommunities.has(group.id)?"is-joined":""}" data-action="join-community" data-id="${escapeHTML(group.id)}">${state.joinedCommunities.has(group.id)?"Joined":"Join"}</button></div>`).join("")}</div><p class="demo-disclaimer">Community memberships and new groups are saved only in this browser.</p>`);
}
function showBulletin(){
  const eligible=CREATOR_METRICS.followers>=50000,progress=Math.min(100,Math.round(CREATOR_METRICS.followers/50000*100));
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close bulletin board">×</button><p class="studio-eyebrow">CREATOR BULLETIN</p><h2>Bulletin board</h2>${eligible?'<p class="modal-intro">Post announcements and updates for your community.</p><form class="inline-create-form" id="bulletin-form"><input name="announcement" maxlength="220" placeholder="Share an announcement..." required aria-label="Announcement"><button class="primary-button" type="submit">Post</button></form><div id="board-posts"></div>':`<p class="modal-intro">Creator bulletin boards unlock at 50,000 followers.</p><div class="gate-progress"><div class="gate-lock">▤</div><strong>${CREATOR_METRICS.followers.toLocaleString()} / 50,000 followers</strong><div class="progress-track"><span style="width:${progress}%"></span></div><small>Keep sharing to unlock a dedicated place for creator announcements.</small></div>`}<p class="demo-disclaimer">Follower count is sample data. Real eligibility needs verified account metrics.</p>`);
}
const countryCurrencies=[
  {country:"United States",code:"US",currency:"USD",locale:"en-US",rate:1},{country:"Canada",code:"CA",currency:"CAD",locale:"en-CA",rate:1.37},{country:"United Kingdom",code:"GB",currency:"GBP",locale:"en-GB",rate:.79},{country:"Ireland",code:"IE",currency:"EUR",locale:"en-IE",rate:.92},{country:"Germany",code:"DE",currency:"EUR",locale:"de-DE",rate:.92},{country:"France",code:"FR",currency:"EUR",locale:"fr-FR",rate:.92},{country:"Spain",code:"ES",currency:"EUR",locale:"es-ES",rate:.92},{country:"Italy",code:"IT",currency:"EUR",locale:"it-IT",rate:.92},{country:"Australia",code:"AU",currency:"AUD",locale:"en-AU",rate:1.53},{country:"New Zealand",code:"NZ",currency:"NZD",locale:"en-NZ",rate:1.66},{country:"India",code:"IN",currency:"INR",locale:"en-IN",rate:84},{country:"Japan",code:"JP",currency:"JPY",locale:"ja-JP",rate:150},{country:"South Korea",code:"KR",currency:"KRW",locale:"ko-KR",rate:1380},{country:"Singapore",code:"SG",currency:"SGD",locale:"en-SG",rate:1.35},{country:"South Africa",code:"ZA",currency:"ZAR",locale:"en-ZA",rate:18},{country:"Nigeria",code:"NG",currency:"NGN",locale:"en-NG",rate:1600},{country:"Kenya",code:"KE",currency:"KES",locale:"en-KE",rate:130},{country:"Ghana",code:"GH",currency:"GHS",locale:"en-GH",rate:15},{country:"Egypt",code:"EG",currency:"EGP",locale:"ar-EG",rate:49},{country:"Brazil",code:"BR",currency:"BRL",locale:"pt-BR",rate:5.1},{country:"Mexico",code:"MX",currency:"MXN",locale:"es-MX",rate:17},{country:"Argentina",code:"AR",currency:"ARS",locale:"es-AR",rate:1000},{country:"Switzerland",code:"CH",currency:"CHF",locale:"de-CH",rate:.88},{country:"Norway",code:"NO",currency:"NOK",locale:"nb-NO",rate:10.5},{country:"Sweden",code:"SE",currency:"SEK",locale:"sv-SE",rate:10.6},{country:"Denmark",code:"DK",currency:"DKK",locale:"da-DK",rate:6.9},{country:"Turkey",code:"TR",currency:"TRY",locale:"tr-TR",rate:32},{country:"United Arab Emirates",code:"AE",currency:"AED",locale:"en-AE",rate:3.67},{country:"Saudi Arabia",code:"SA",currency:"SAR",locale:"ar-SA",rate:3.75},{country:"Philippines",code:"PH",currency:"PHP",locale:"en-PH",rate:57},{country:"Indonesia",code:"ID",currency:"IDR",locale:"id-ID",rate:16000},{country:"Thailand",code:"TH",currency:"THB",locale:"th-TH",rate:36},{country:"Poland",code:"PL",currency:"PLN",locale:"pl-PL",rate:4}
];
function selectedCountry(){const region=navigator.language?.split("-")[1]?.toUpperCase();return countryCurrencies.find(item=>item.code===region)||countryCurrencies[0];}
function showCoins(){
  const country=selectedCountry();
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close coins">×</button><p class="studio-eyebrow">SUPPORT YOUR FAVOURITE CREATORS</p><h2>Coins & live gifts</h2><p class="modal-intro">Choose a region to preview coin packs and send gifts during a live.</p><label class="auth-field">Country or region<select id="coin-country" class="dark-select">${countryCurrencies.map(item=>`<option value="${item.code}" ${item.code===country.code?"selected":""}>${item.country} · ${item.currency}</option>`).join("")}</select></label><div class="coin-balance"><span>◉</span> Demo balance <strong>${state.coins} coins</strong></div><div class="coin-packs" id="coin-packs"></div><p class="demo-disclaimer">Prices are illustrative local-currency estimates, not live exchange rates. Test purchases only; no payment is processed.</p>`);
  renderCoinPacks(country.code);
}
function renderCoinPacks(code){
  const country=countryCurrencies.find(item=>item.code===code)||countryCurrencies[0],root=document.querySelector("#coin-packs");if(!root)return;
  root.innerHTML=[{coins:100,usd:.99},{coins:550,usd:4.99},{coins:1200,usd:9.99}].map(pack=>`<button class="coin-pack" data-action="buy-coins" data-coins="${pack.coins}"><span>◉ ${pack.coins.toLocaleString()} coins</span><strong>${new Intl.NumberFormat(country.locale,{style:"currency",currency:country.currency}).format(pack.usd*country.rate)}</strong></button>`).join("");
}
function showGiftPicker(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close gifts">×</button><p class="studio-eyebrow">CHEER ON THE CREATOR</p><h2>Send a live gift 🎁</h2><p class="modal-intro">Pick a little surprise for the live room.</p><div class="gift-grid">${[{name:"Spark",emoji:"✨",coins:10},{name:"Heart",emoji:"💙",coins:25},{name:"Star",emoji:"⭐",coins:50},{name:"Party",emoji:"🎉",coins:100}].map(gift=>`<button class="gift-option" data-action="send-gift" data-cost="${gift.coins}" data-name="${gift.name}"><span>${gift.emoji}</span><strong>${gift.name}</strong><small>◉ ${gift.coins}</small></button>`).join("")}</div><div class="coin-balance"><span>◉</span> Your balance <strong>${state.coins} coins</strong><button class="subtle-link" data-action="open-coins">Get coins</button></div><p class="demo-disclaimer">Gifts use demo coins only and are not real purchases.</p>`);
}
function showMarketplace(){
  const listings=state.marketListings.length?state.marketListings:[{title:"Sunday Still Life · Print",seller:"Maya Chen",price:"$18.00",description:"A little piece of calm for your wall."},{title:"Trail Notes mini guide",seller:"Marco Rivera",price:"$6.00",description:"Five easy weekend walks to save for later."}];
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close marketplace">×</button><p class="studio-eyebrow">MADE BY THE COMMUNITY</p><h2>Creator marketplace</h2><p class="modal-intro">Discover creator-made art, guides, and goods, or list something of your own.</p><form class="market-form" id="listing-form"><input name="title" maxlength="60" placeholder="What are you selling?" required aria-label="Listing title"><input name="price" type="number" min=".01" step=".01" placeholder="Price (USD)" required aria-label="Price in US dollars"><input name="description" maxlength="120" placeholder="A short description" aria-label="Description"><button class="primary-button" type="submit">＋ Add listing</button></form><div class="market-listings">${listings.map((item,index)=>`<article class="market-item"><span class="market-art">✧</span><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.description)}</small><small>by ${escapeHTML(item.seller)}</small></div><div class="market-buy"><strong>${escapeHTML(item.price)}</strong><button data-action="buy-listing" data-index="${index}">Buy</button></div></article>`).join("")}</div><p class="demo-disclaimer">Listings and buy buttons are local previews. Payments, shipping, and seller payouts are not connected.</p>`);
}
function showGames(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close gaming zone">×</button><p class="studio-eyebrow">PLAY TOGETHER</p><h2>Gaming zone ♜</h2><p class="modal-intro">Invite a friend and start a casual game room.</p><div class="game-cards">${[{name:"Quick quiz",icon:"⚡",info:"5 rounds · just for fun"},{name:"Word dash",icon:"🔤",info:"Make words with friends"},{name:"Draw & guess",icon:"🎨",info:"Sketch it, then guess it"}].map(game=>`<button class="game-card" data-action="game" data-game="${game.name}"><span>${game.icon}</span><strong>${game.name}</strong><small>${game.info}</small></button>`).join("")}</div><div class="studio-section-title">FRIENDS</div><div class="friend-list">${creators.slice(0,3).map(friend=>`<div class="friend-row"><img src="${friend.avatar}" alt=""><strong>${escapeHTML(friend.name)}</strong><button class="small-join" data-action="invite-game" data-creator="${friend.id}">Invite</button></div>`).join("")}</div><p class="demo-disclaimer">Game rooms are previews; real-time multiplayer is not connected.</p>`);
}
function showJanet(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close Janet AI">×</button><p class="studio-eyebrow">YOUR CREATIVE SIDEKICK</p><h2>Janet AI ✧</h2><p class="modal-intro">Shape an image idea or turn a thought into a video storyboard.</p><div class="janet-mode" role="tablist"><button class="is-active" data-janet-mode="image">✦ Image idea</button><button data-janet-mode="video">▶ Video storyboard</button></div><label class="auth-field" for="janet-prompt">What are you imagining?<textarea id="janet-prompt" class="upload-caption janet-prompt" maxlength="400" placeholder="A cinematic night market in the rain, glowing lanterns, dreamy blue and violet..."></textarea></label><div class="janet-controls"><label>Style<select id="janet-style" class="dark-select"><option>Dreamy cinematic</option><option>Bright editorial</option><option>Soft film photo</option><option>Playful 3D</option><option>Hand-drawn illustration</option></select></label><label>Format<select id="janet-format" class="dark-select"><option>Portrait · 9:16</option><option>Square · 1:1</option><option>Landscape · 16:9</option></select></label></div><button class="primary-button upload-submit" data-action="janet-generate">Create with Janet ✨</button><div id="janet-result" class="janet-result">${state.janetResult?escapeHTML(state.janetResult):'<span class="janet-empty">Your creative brief will appear here.</span>'}</div><p class="demo-disclaimer">Prototype tool: Janet drafts prompts and storyboards; a connected media-generation provider is needed to render images or video.</p>`);
}
function createJanetBrief(){
  const prompt=document.querySelector("#janet-prompt")?.value.trim();if(!prompt){notify("Tell Janet what you want to make first.");return;}
  const mode=document.querySelector(".janet-mode .is-active")?.dataset.janetMode||"image",style=document.querySelector("#janet-style").value,format=document.querySelector("#janet-format").value;
  state.janetResult=mode==="image"?`IMAGE CREATION BRIEF\n${prompt}\n\nStyle: ${style}\nFrame: ${format}\n\nComposition: clear focal subject, intentional negative space, tactile detail, balanced highlights and shadows.\nPalette: build around the colours and mood in your description.\n\nReady-to-use creative brief — connect an image model to render it.`:`VIDEO STORYBOARD · 3 SHOTS\n\n01 · ESTABLISH — Set the scene for: ${prompt}. Slow camera move, ambient detail, ${style.toLowerCase()} mood.\n\n02 · DISCOVER — Move closer to the key subject. Add a natural action and a detail shot.\n\n03 · LAND — Finish on the most memorable visual; leave room for a title or sound cue.\n\nFrame: ${format}. Draft storyboard — connect a video model to render clips.`;
  const result=document.querySelector("#janet-result");if(result)result.textContent=state.janetResult;
}
function showStoriesUpload(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close story composer">×</button><p class="studio-eyebrow">HERE FOR 24 HOURS</p><h2>Add to your story</h2><p class="modal-intro">Share a photo or video. It automatically disappears after 24 hours.</p><form id="story-form"><label class="upload-drop" id="story-drop"><input type="file" id="story-file" accept="image/*,video/*" aria-label="Choose a story photo or video"><span class="upload-preview" id="story-preview"><span class="upload-symbol">＋</span><strong>Choose a photo or video</strong><span>Stories disappear after 24 hours</span></span></label><input class="story-caption-input" name="caption" maxlength="140" placeholder="Add a caption (optional)" aria-label="Story caption"><button class="primary-button upload-submit" id="story-submit" disabled>Share story</button></form>`);
  const input=document.querySelector("#story-file"),preview=document.querySelector("#story-preview"),submit=document.querySelector("#story-submit");
  input.addEventListener("change",()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")){notify("Choose a photo or video for your story.");return;}
    const url=URL.createObjectURL(file);state.storyObjectUrls.push(url);preview.innerHTML=`${file.type.startsWith("video/")?`<video src="${url}" muted playsinline></video>`:`<img src="${url}" alt="Story preview">`}<strong>${escapeHTML(file.name)}</strong><span>Expires 24 hours after posting</span>`;submit.disabled=false;});
  document.querySelector("#story-form").addEventListener("submit",event=>{event.preventDefault();const file=input.files?.[0];if(!file)return;const url=state.storyObjectUrls[state.storyObjectUrls.length-1],caption=new FormData(event.target).get("caption").toString().trim();state.stories.unshift({id:`story-${Date.now()}`,name:state.currentUser?.name||"You",avatar:creators[0].avatar,mediaUrl:url,mediaType:file.type,caption,createdAt:Date.now(),expiresAt:Date.now()+storyExpiry,owner:true});closeModal();renderStories();notify("Your story is up for 24 hours!");});
}
function viewStory(id){
  const story=state.stories.find(item=>item.id===id);if(!story)return;const hours=Math.max(1,Math.ceil((story.expiresAt-Date.now())/3600000));
  const media=story.mediaType.startsWith("video/")?`<video class="story-view-media" src="${story.mediaUrl}" controls autoplay playsinline></video>`:`<img class="story-view-media" src="${story.mediaUrl}" alt="${escapeHTML(story.caption||"Buzzy story")}">`;
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close story">×</button><div class="story-viewer"><div class="story-progress"><i></i></div><div class="story-view-head"><img src="${story.avatar}" alt=""><strong>${escapeHTML(story.name)}</strong><small>${hours}h left</small></div>${media}<p>${escapeHTML(story.caption||"A little moment from Buzzy.")}</p>${story.owner?`<button class="small-join" data-action="delete-story" data-story="${escapeHTML(story.id)}">Delete story</button>`:""}</div>`);
}
function renderMessage(message){
  const attachment=message.attachment?`<a class="chat-attachment" href="${message.attachment.url}" download="${escapeHTML(message.attachment.name)}">${message.attachment.type.startsWith("image/")?`<img src="${message.attachment.url}" alt="${escapeHTML(message.attachment.name)}">`:"📎"}<span>${escapeHTML(message.attachment.name)}</span></a>`:"";
  const content=message.voice?`<audio controls src="${message.url}"></audio>`:escapeHTML(message.text||"");
  return `<article class="chat-message ${message.from==="me"?"mine":""}"><div class="message-bubble" data-message-id="${escapeHTML(message.id)}">${message.editing?`<form class="edit-message-form" data-message="${escapeHTML(message.id)}"><input name="edited" maxlength="500" value="${escapeHTML(message.text)}" required><button>Save</button></form>`:`<p>${content}</p>${attachment}`}<small>${new Date(message.time).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}${message.from==="me"?" · You":""}</small>${message.from==="me"&&!message.voice?`<div class="message-controls"><button data-action="edit-message" data-message="${escapeHTML(message.id)}">Edit</button><button data-action="delete-message" data-message="${escapeHTML(message.id)}">Delete for all</button></div>`:""}</div></article>`;
}
function showMessages(){
  const chats=creators.filter(creator=>state.chats[creator.id]).map(creator=>{const last=state.chats[creator.id].slice(-1)[0];return `<button class="chat-contact ${state.activeChat===creator.id?"is-active":""}" data-action="select-chat" data-creator="${creator.id}"><img src="${creator.avatar}" alt=""><span><strong>${escapeHTML(creator.name)} ${verifiedBadge(creator)}</strong><small>${escapeHTML(last?.text||"Shared a file")}</small></span></button>`;}).join("");
  const creator=creatorFor(state.activeChat)||creators[0],messages=state.chats[creator.id]||[];
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close messages">×</button><p class="studio-eyebrow">JUST BETWEEN YOU</p><h2>Private messages</h2><p class="modal-intro">Your conversations stay in this browser preview.</p><div class="messenger"><aside class="chat-contacts">${chats}<button class="chat-contact" data-action="select-chat" data-creator="lena"><img src="${creators[2].avatar}" alt=""><span><strong>Message Lena</strong><small>Start a new chat</small></span></button></aside><section class="chat-window"><header><img src="${creator.avatar}" alt=""><strong>${escapeHTML(creator.name)} ${verifiedBadge(creator)}</strong></header><div class="chat-messages" id="chat-messages">${messages.map(renderMessage).join("")||'<p class="modal-empty">Say hello to start chatting.</p>'}</div><form class="message-form" id="message-form" data-creator="${creator.id}"><div class="message-tools"><label class="attachment-button" title="Attach photo, video, audio, or document">＋<input type="file" id="message-file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" aria-label="Attach a file"></label><button type="button" class="attachment-button" data-action="voice-note">🎙</button></div><input name="message" maxlength="500" placeholder="Write a message..." aria-label="Write a private message"><button type="submit" class="send-message">Send</button></form><div id="attachment-preview" class="attachment-preview"></div></section></div><p class="demo-disclaimer">Messages, edits, deletes, recordings, and files stay in memory during this visit. Secure delivery needs a backend.</p>`);
  const fileInput=document.querySelector("#message-file");
  fileInput?.addEventListener("change",()=>{const file=fileInput.files?.[0];if(!file)return;const url=URL.createObjectURL(file);state.messageMediaUrls.push(url);(state.chats[creator.id]||(state.chats[creator.id]=[])).push({id:`msg-${Date.now()}`,from:"me",text:`Shared ${file.name}`,attachment:{name:file.name,type:file.type,url},time:Date.now()});navigateFeaturePage("messages");});
  document.querySelector("#chat-messages")?.scrollTo(0,999999);
}
function startVoiceNote(button){
  if(state.voiceRecorder){state.voiceRecorder.stop();state.voiceRecorder=null;button.textContent="🎙";return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){notify("Voice recording isn’t supported in this browser.");return;}
  button.textContent="■";
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{const recorder=new MediaRecorder(stream),chunks=[],creator=creatorFor(state.activeChat)||creators[0],started=Date.now();state.voiceRecorder=recorder;recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());const url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||"audio/webm"}));state.messageMediaUrls.push(url);(state.chats[creator.id]||(state.chats[creator.id]=[])).push({id:`voice-${Date.now()}`,from:"me",voice:true,url,duration:(Date.now()-started)/1000,time:Date.now()});state.voiceRecorder=null;navigateFeaturePage("messages");};recorder.start();notify("Recording voice note — tap the microphone again to finish.");}).catch(error=>{state.voiceRecorder=null;button.textContent="🎙";notify(error.name==="NotAllowedError"?"Microphone permission was denied.":`Couldn’t start recording: ${error.message}`);});
}
function showUpload(){
  openModal(`<button class="modal-close" data-action="close-modal" aria-label="Close upload">×</button><h2>Share a little moment</h2><p class="modal-intro">A tiny glimpse of your world might make someone’s day.</p><form id="upload-form"><label class="upload-drop" id="upload-drop"><input id="upload-file" type="file" accept="video/*,image/*" aria-label="Choose a photo or video"><span class="upload-preview" id="upload-preview"><span class="upload-symbol">↑</span><strong>Choose a photo or video</strong><span>Drop it here, or tap to browse</span></span></label><textarea class="upload-caption" name="caption" maxlength="220" placeholder="What’s the little story behind it?" aria-label="Add a caption"></textarea><button class="primary-button upload-submit" id="upload-submit" type="submit" disabled>Share your loop</button></form>`);
  const input=document.querySelector("#upload-file"),preview=document.querySelector("#upload-preview"),drop=document.querySelector("#upload-drop"),submit=document.querySelector("#upload-submit");
  let previewUrl="";
  input.addEventListener("change",()=>{
    const file=input.files?.[0];if(!file)return;
    if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")){notify("Choose an image or video file.");input.value="";return;}
    if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);
    const media=file.type.startsWith("video/")?`<video src="${previewUrl}" muted playsinline></video>`:`<img src="${previewUrl}" alt="Selected image preview">`;
    preview.innerHTML=`${media}<strong>${escapeHTML(file.name)}</strong><span>Ready to share</span>`;drop.classList.add("has-file");submit.disabled=false;
  });
  document.querySelector("#upload-form").addEventListener("submit",event=>{
    event.preventDefault();const file=input.files?.[0];if(!file)return;
    const caption=new FormData(event.currentTarget).get("caption").toString().trim();
    posts.unshift({id:`local-${Date.now()}`,creator:"maya",time:"Just now",title:file.name.replace(/\.[^.]+$/,"").slice(0,42)||"A little moment",kicker:"FRESH FROM YOU",overlay:caption||"a little moment worth keeping",caption:caption||"A little moment worth sharing.",hashtags:"#yourbuzz #littlemoments",image:file.type.startsWith("image/")?previewUrl:"",videoUrl:file.type.startsWith("video/")?previewUrl:"",likes:0,comments:0,views:"0",sound:"original audio",liked:false,saved:false,commentsList:[]});
    state.followed.add("maya");state.feed="foryou";state.search="";state.activeTopic="";document.querySelector("#search-input").value="";
    document.querySelectorAll(".feed-tab").forEach(tab=>{const active=tab.dataset.feed==="foryou";tab.classList.toggle("is-active",active);tab.setAttribute("aria-selected",String(active));});
    document.querySelector(".feed-tabs").classList.remove("following-active");closeModal();if(state.currentPage==="camera")showHomePage();else render();window.scrollTo({top:0,behavior:"smooth"});notify("Your buzz is live — thanks for sharing a little moment!");
  });
}
function toggleFollow(id){const creator=creatorFor(id);if(!creator)return;if(state.followed.has(id)){state.followed.delete(id);notify(`You unfollowed ${creator.name}.`);}else{state.followed.add(id);notify(`You’re now following ${creator.name}!`);}if(state.currentPage==="Explore")showExplorePage();else if(state.currentPage==="following")showFollowingPage();else if(state.currentPage==="Your profile")showProfilePage();else render();}
async function sharePost(post){
  const creator=creatorFor(post.creator),data={title:`${post.title} on Buzzy`,text:`${post.caption} — ${creator.handle}`};
  if(navigator.share){try{await navigator.share(data);}catch(error){if(error.name!=="AbortError")notify("Couldn’t open the share sheet. Try again.");}}
  else if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(`${data.title}\n${data.text}`);notify("Buzzy details copied — share the good stuff!");}catch{notify("Sharing isn’t available in this browser.");}}
  else notify("Sharing isn’t available in this browser.");
}

document.addEventListener("click",event=>{
  const authModeButton=event.target.closest("[data-auth-mode]");
  if(authModeButton){state.authMode=authModeButton.dataset.authMode;renderAuth();return;}
  const authMethodButton=event.target.closest("[data-auth-method]");
  if(authMethodButton){state.authMethod=authMethodButton.dataset.authMethod;renderAuth();return;}
  if(event.target.closest("[data-action='google-auth']")){setAuthError("Google sign-in is unavailable until an OAuth provider and secure server are configured.");return;}
  if(event.target.closest("[data-action='request-otp']")){requestPhoneOtp();return;}
  if(event.target.closest("[data-action='verify-otp']")){setPhoneAuthError("OTP verification is not connected. No code has been sent or can be verified in this prototype.");return;}
  if(event.target.closest("[data-action='passkey-login']")){handlePasskeyLogin();return;}
  const cameraMode=event.target.closest("[data-camera-mode]");
  if(cameraMode){
    const mode=cameraMode.dataset.cameraMode;
    if(mode==="live"){showFeatureDemo("live");return;}
    state.cameraMode=mode;
    document.querySelectorAll("[data-camera-mode]").forEach(button=>{const active=button.dataset.cameraMode===mode;button.classList.toggle("is-active",active);button.setAttribute("aria-selected",String(active));});
    const status=document.querySelector("[data-camera-status]");
    if(status){
      if(mode==="text"){status.textContent="Text mode · tap the shutter to write a post.";status.hidden=false;}
      else if(mode!=="photo"){status.textContent="Video recording is not available in this preview. Choose a clip from Gallery.";status.hidden=false;}
      else if(state.cameraStream)status.hidden=true;
    }
    const captureButton=document.querySelector(".camera-capture");
    if(captureButton)captureButton.setAttribute("aria-label",mode==="text"?"Create text post":mode==="photo"?"Take photo":"Upload a video");
    return;
  }
  const profileTab=event.target.closest("[data-profile-tab]");
  if(profileTab){state.profileTab=profileTab.dataset.profileTab;renderProfileGrid();document.querySelectorAll("[data-profile-tab]").forEach(tab=>{const selected=tab===profileTab;tab.classList.toggle("is-active",selected);tab.setAttribute("aria-selected",String(selected));});return;}
  const topic=event.target.closest("[data-topic]");
  if(topic){state.activeTopic=state.activeTopic===topic.dataset.topic?"":topic.dataset.topic;if(state.currentPage==="Explore"&&state.activeTopic){document.querySelectorAll(".nav-link,.mobile-nav button").forEach(item=>item.classList.toggle("is-active",item.dataset.nav==="home"));showHomePage();state.activeTopic=topic.dataset.topic;document.querySelectorAll(".topic-pills button").forEach(button=>button.classList.toggle("is-selected",button.dataset.topic===state.activeTopic));renderFeed();notify(`Finding ${state.activeTopic} loops…`);return;}document.querySelectorAll(".topic-pills button").forEach(button=>button.classList.toggle("is-selected",button.dataset.topic===state.activeTopic));if(state.activeTopic){state.feed="foryou";document.querySelectorAll(".feed-tab").forEach(tab=>{const active=tab.dataset.feed==="foryou";tab.classList.toggle("is-active",active);tab.setAttribute("aria-selected",String(active));});document.querySelector(".feed-tabs").classList.remove("following-active");}renderFeed();if(state.activeTopic)notify(`Finding ${state.activeTopic} loops…`);return;}
  const feedButton=event.target.closest("[data-feed]");
  if(feedButton){setFeed(feedButton.dataset.feed);return;}
  const nav=event.target.closest("[data-nav]");
  if(nav){
    if(nav.tagName==="A")event.preventDefault();
    const destination=nav.dataset.nav;document.querySelectorAll(".nav-link,.mobile-nav button").forEach(button=>button.classList.toggle("is-active",button.dataset.nav===destination));
    document.querySelectorAll(".short-tab").forEach(button=>button.classList.toggle("is-active",button.dataset.nav===destination));
    if(modalRoot.firstElementChild)closeModal();
    if(destination==="home")showHomePage();
    else if(destination==="following")showFollowingPage();
    else if(destination==="explore")showExplorePage();
    else if(destination==="saved"){state.search="";document.querySelector("#search-input").value="";renderSavedPage();}
    else if(destination==="profile")showProfilePage();
    else if(destination==="inbox")showNotificationsPage();
    else navigateFeaturePage(destination);
    return;
  }
  const button=event.target.closest("[data-action]");if(!button)return;
  const action=button.dataset.action,post=findPost(button.dataset.post);
  if(action==="open-camera")showCreateCamera();
  else if(action==="close-camera")showHomePage();
  else if(action==="flip-camera"){
    state.cameraFacing=state.cameraFacing==="user"?"environment":"user";stopCameraPreview();requestCameraAccess();
  }
  else if(action==="camera-capture")captureCameraPhoto();
  else if(action==="camera-setting"){button.classList.toggle("is-active");notify(`${button.dataset.setting} setting toggled.`);}
  else if(action==="upload")showUpload();
  else if(action==="edit-profile")showEditProfile();
  else if(action==="share-profile")shareProfile();
  else if(action==="profile-post"){state.search="";document.querySelector("#search-input").value="";showHomePage();feedElement.querySelector(`.short-post[data-post-id="${button.dataset.post}"]`)?.scrollIntoView({behavior:"smooth",block:"start"});}
  else if(action==="highlight")notify("Share a story and add it to your profile highlights.");
  else if(action==="dismiss-highlights"){state.profileHighlightDismissed=true;showProfilePage();}
  else if(action==="add-story")showStoriesUpload();
  else if(action==="view-story")viewStory(button.dataset.story);
  else if(action==="delete-story"){state.stories=state.stories.filter(story=>story.id!==button.dataset.story);closeModal();renderStories();notify("Story deleted.");}
  else if(action==="open-gifts")showGiftPicker();
  else if(action==="open-coins"){closeModal();navigateFeaturePage("coins");}
  else if(action==="buy-coins"){state.coins+=Number(button.dataset.coins)||0;navigateFeaturePage("coins");notify("Demo coins added. No payment taken.");}
  else if(action==="send-gift"){
    const cost=Number(button.dataset.cost)||0;
    if(state.coins<cost){notify("Not enough demo coins. Choose a coin pack to top up.");return;}
    state.coins-=cost;closeModal();notify(`${button.dataset.name} gift sent in the demo live room!`);
  }
  else if(action==="buy-listing")notify("Checkout is a preview only — no payment was taken.");
  else if(action==="join-community"){
    const id=button.dataset.id;state.joinedCommunities.has(id)?state.joinedCommunities.delete(id):state.joinedCommunities.add(id);navigateFeaturePage("communities");
  }
  else if(action==="game"){state.gamesJoined.add(button.dataset.game);notify(`You joined the ${button.dataset.game} demo room!`);}
  else if(action==="invite-game"){const creator=creatorFor(button.dataset.creator);if(creator)notify(`Game invite sent to ${creator.name} (demo).`);}
  else if(action==="janet-generate")createJanetBrief();
  else if(action==="voice-note")startVoiceNote(button);
  else if(action==="select-chat"){state.activeChat=button.dataset.creator;state.chats[state.activeChat]||(state.chats[state.activeChat]=[]);navigateFeaturePage("messages");}
  else if(action==="edit-message"){
    const creator=creatorFor(state.activeChat),message=state.chats[creator.id]?.find(item=>item.id===button.dataset.message);
    if(message){message.editing=true;navigateFeaturePage("messages");}
  }
  else if(action==="delete-message"){
    const creator=creatorFor(state.activeChat);if(creator){state.chats[creator.id]=state.chats[creator.id].filter(item=>item.id!==button.dataset.message);navigateFeaturePage("messages");notify("Message deleted for everyone in this demo chat.");}
  }
  else if(action==="logout"){
    try{sessionStorage.removeItem(AUTH_SESSION_KEY);closeModal();showHomePage();showAuth();state.authMode="login";renderAuth();notify("You’re logged out.");}
    catch(error){notify(`Could not log out: ${error.message}`);}
  }
  else if(action==="close-modal")closeModal();
  else if(action==="backdrop"&&event.target===button)closeModal();
  else if(action==="follow")toggleFollow(button.dataset.creator);
  else if(action==="like"&&post){post.liked=!post.liked;post.likes=Math.max(0,post.likes+(post.liked?1:-1));if(state.currentPage==="Saved loops")renderSavedPage();else if(state.currentPage==="following")showFollowingPage();else if(state.currentPage==="Your profile")showProfilePage();else renderFeed();}
  else if(action==="save"&&post){post.saved=!post.saved;if(state.currentPage==="Saved loops")renderSavedPage();else if(state.currentPage==="following")showFollowingPage();else if(state.currentPage==="Your profile")showProfilePage();else renderFeed();notify(post.saved?"Saved for a little later.":"Removed from your saved loops.");}
  else if(action==="comments"&&post)showComments(post);
  else if(action==="share"&&post)sharePost(post);
  else if(action==="subscribe")showSubscriptionOffer(button.dataset.creator);
  else if(action==="confirm-subscription"){
    const creator=creatorFor(button.dataset.creator);
    if(creator){state.subscribed.add(creator.id);closeModal();renderFeed();notify(`You’re subscribed to ${creator.name} for $2/month. Demo only — no payment taken.`);}
  }
  else if(action==="feature-demo")showFeatureDemo(button.dataset.feature);
  else if(action==="start-feature-demo"){
    const isLive=button.dataset.feature==="live",active=button.dataset.active==="true";
    button.dataset.active=String(!active);
    button.textContent=active?(isLive?"Start demo livestream":"Start demo call"):(isLive?"End demo livestream":"End demo call");
    notify(active?"Demo session ended.":isLive?"Demo livestream started — only visible in this preview.":"Demo video call started — only visible in this preview.");
  }
  else if(action==="play"&&post){const visual=button.closest(".post-visual"),video=visual.querySelector("video");if(video){if(video.paused){video.play().catch(()=>notify("This video couldn’t be played."));}else video.pause();}visual.classList.toggle("is-playing");button.textContent=visual.classList.contains("is-playing")?"Ⅱ":"▶";notify(visual.classList.contains("is-playing")?`Now looping: ${post.title}`:"Loop paused.");}
  else if(action==="mute"&&post){state.soundEnabled=!state.soundEnabled;button.textContent=state.soundEnabled?"♫":"♩";button.setAttribute("aria-label",state.soundEnabled?"Mute sound":"Unmute sound");const video=button.closest(".post-visual").querySelector("video");if(video)video.muted=!state.soundEnabled;notify(state.soundEnabled?`Sound on · ${post.sound}`:"Sound off");}
  else if(action==="sound")notify("Sound added to your next loop.");
  else if(action==="more")notify("More options are coming soon.");
  else if(action==="refresh"){button.classList.remove("is-spinning");void button.offsetWidth;button.classList.add("is-spinning");notify("Your creator suggestions are up to date.");}
});
document.addEventListener("submit",event=>{
  if(event.target.matches("#auth-form")){handleAuthSubmit(event);return;}
  if(event.target.matches("#phone-auth-form")){event.preventDefault();requestPhoneOtp();return;}
  if(event.target.matches("#camera-share-form")){
    event.preventDefault();const caption=new FormData(event.target).get("caption").toString();publishCameraPost(state.cameraObjectUrls[state.cameraObjectUrls.length-1]||"",caption);return;
  }
  if(event.target.matches("#camera-text-form")){
    event.preventDefault();const caption=new FormData(event.target).get("caption").toString().trim();if(caption)publishCameraPost("",caption);return;
  }
  if(event.target.matches("#profile-form")){
    event.preventDefault();
    const form=new FormData(event.target),name=form.get("displayName").toString().trim(),bio=form.get("bio").toString().trim();
    if(!name){notify("Enter a display name for your profile.");return;}
    try{
      const accounts=readAccounts(),account=accounts.find(saved=>saved.id===state.currentUser?.id);
      if(!account)throw new Error("Could not find the signed-in account.");
      account.name=name;account.bio=bio;saveAccounts(accounts);state.currentUser=account;
      const chip=document.querySelector(".profile-chip");if(chip){chip.querySelector("strong").textContent=account.name;chip.querySelector("small").textContent=`@${account.email.split("@")[0]}`;}
      closeModal();showProfilePage();notify("Profile updated.");
    }catch(error){notify(`Could not save your profile: ${error.message}`);}
    return;
  }
  if(event.target.matches("#community-form")){
    event.preventDefault();const name=new FormData(event.target).get("name").toString().trim();if(!name)return;
    const group={id:`c-${Date.now()}`,name,description:"A new community on Buzzy.",members:1};
    try{state.communities.push(group);localStorage.setItem(COMMUNITY_KEY,JSON.stringify(state.communities));navigateFeaturePage("communities");notify(`${name} community created!`);}catch(error){notify(`Could not save your community: ${error.message}`);}return;
  }
  if(event.target.matches("#bulletin-form")){event.preventDefault();const text=new FormData(event.target).get("announcement").toString().trim();if(text){event.target.insertAdjacentHTML("afterend",`<div class="board-post"><strong>${escapeHTML(state.currentUser?.name||"You")}</strong><p>${escapeHTML(text)}</p><small>Just now</small></div>`);event.target.reset();notify("Announcement posted to your demo board.");}return;}
  if(event.target.matches("#listing-form")){
    event.preventDefault();const form=new FormData(event.target),title=form.get("title").toString().trim(),price=Number(form.get("price")),description=form.get("description").toString().trim();
    if(!title||!Number.isFinite(price)||price<=0){notify("Enter a listing name and a valid price.");return;}
    state.marketListings.unshift({title,seller:state.currentUser?.name||"You",price:new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(price),description:description||"Creator-made and ready to discover."});navigateFeaturePage("marketplace");notify("Your demo listing is live.");return;
  }
  if(event.target.matches("#message-form")){
    event.preventDefault();const creator=creatorFor(event.target.dataset.creator),text=new FormData(event.target).get("message").toString().trim();if(!creator||!text)return;
    (state.chats[creator.id]||(state.chats[creator.id]=[])).push({id:`msg-${Date.now()}`,from:"me",text,time:Date.now()});navigateFeaturePage("messages");return;
  }
  if(event.target.matches(".edit-message-form")){
    event.preventDefault();const creator=creatorFor(state.activeChat),message=state.chats[creator.id]?.find(item=>item.id===event.target.dataset.message),text=new FormData(event.target).get("edited").toString().trim();
    if(message&&text){message.text=text;message.editing=false;navigateFeaturePage("messages");notify("Message updated.");}return;
  }
  if(event.target.matches(".comment-form")){
    event.preventDefault();const post=findPost(event.target.dataset.post),text=new FormData(event.target).get("comment").toString().trim();if(!post||!text)return;
    post.commentsList.push({creator:"maya",text,time:"Just now"});post.comments++;showComments(post);notify("Your kind words are on their way.");return;
  }
});
document.addEventListener("change",event=>{
  if(event.target.matches("#coin-country"))renderCoinPacks(event.target.value);
  if(event.target.matches("#message-file")&&event.target.files?.[0])notify(`Attached ${event.target.files[0].name}`);
});
document.addEventListener("click",event=>{
  const mode=event.target.closest("[data-janet-mode]");
  if(mode){document.querySelectorAll("[data-janet-mode]").forEach(tab=>tab.classList.toggle("is-active",tab===mode));}
});
document.querySelector("#search-input").addEventListener("input",event=>{state.search=event.target.value;if(state.currentPage==="following")showFollowingPage();else if(state.currentPage==="home")renderFeed();else showHomePage();});
document.querySelectorAll("[data-footer]").forEach(link=>link.addEventListener("click",event=>{event.preventDefault();notify(`${link.dataset.footer} information will be here soon.`);}));
document.addEventListener("keydown",event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();document.querySelector("#search-input").focus();}if(event.key==="Escape"&&modalRoot.firstElementChild)closeModal();});
initializeStories();
window.setTimeout(()=>{document.querySelector("#splash-screen").hidden=true;initializeAuth();},900);
