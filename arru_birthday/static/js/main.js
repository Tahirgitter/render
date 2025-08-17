// Client-side story engine
const SCENES = JSON.parse(document.getElementById('scenes-data').textContent);
const stateKey = 'arru_state_v1';

let state = localStorage.getItem(stateKey) ? JSON.parse(localStorage.getItem(stateKey)) : {chapter:0, love:0, unlocked: []};

function saveState(){
    localStorage.setItem(stateKey, JSON.stringify(state));
    // also push to server session
    fetch('/api/state', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(state)})
        .catch(e=>console.log('save error', e));
}

function render(){
    const scene = SCENES[state.chapter];
    document.getElementById('chapter-title').textContent = scene ? scene.title : "The Finale";
    document.getElementById('story-text').innerHTML = scene ? scene.text : "You've reached the end. Open the treasure to see all photos.";
    const choicesEl = document.getElementById('choices');
    choicesEl.innerHTML = '';
    if(scene){
        // create two simple choices that advance
        const c1 = document.createElement('button');
        c1.className = 'choice';
        c1.textContent = 'Take a breath and hold her hand';
        c1.onclick = () => makeChoice(1);
        const c2 = document.createElement('button');
        c2.className = 'choice';
        c2.textContent = 'Whisper something silly to make her laugh';
        c2.onclick = () => makeChoice(2);
        choicesEl.appendChild(c1);
        choicesEl.appendChild(c2);
        // show photo if unlocked
        const photoCard = document.getElementById('photo-card');
        if(state.unlocked.includes(scene.id)){
            photoCard.innerHTML = `<img src="/static/images/${scene.photo}" alt="memory">`;
        } else {
            photoCard.innerHTML = `<div style="padding:18px; color: #c9d3e6">A memory waits here — unlock it with a loving choice.</div>`;
        }
    } else {
        // finale
        choicesEl.innerHTML = `<div style="display:flex; gap:8px;"><button class="btn" onclick="location.href='/treasure'">Open the Treasure</button><button class="btn ghost" onclick="resetProgress()">Reset & Replay</button></div>`;
        document.getElementById('photo-card').innerHTML = `<div style="padding:18px; color:#c9d3e6">Final surprise awaits in the treasure chest.</div>`;
    }
    // update meter
    const meter = document.querySelector('.meter > span');
    meter.style.width = Math.min(100, state.love) + '%';
}

function makeChoice(kind){
    // simple deterministic effects: kind 1 gives slightly more love
    const gain = kind===1 ? 12 : 8;
    state.love = Math.min(100, state.love + gain);
    // unlock current photo
    const scene = SCENES[state.chapter];
    if(scene && !state.unlocked.includes(scene.id)){
        state.unlocked.push(scene.id);
    }
    state.chapter = Math.min(SCENES.length, state.chapter + 1);
    saveState();
    render();
    // small celebration when unlocking
    spawnBalloons(6);
}

function spawnBalloons(n=6){
    const wrap = document.getElementById('balloons');
    for(let i=0;i<n;i++){
        const b = document.createElement('div');
        b.style.position='fixed';
        b.style.left = (10 + Math.random()*80)+'%';
        b.style.bottom = '-120px';
        b.style.width = '28px';
        b.style.height = '36px';
        b.style.borderRadius = '50%';
        b.style.background = i%2 ? 'linear-gradient(#ffd166,#ff7aa3)' : 'linear-gradient(#a78bfa,#ff8fb6)';
        b.style.opacity = '0.95';
        b.style.transition = 'transform 4200ms linear, opacity 4200ms';
        document.body.appendChild(b);
        requestAnimationFrame(()=>{ b.style.transform = `translateY(-120vh) rotate(${Math.random()*720}deg)`; b.style.opacity='0'; });
        setTimeout(()=>b.remove(), 4300);
    }
}

function resetProgress(){
    if(confirm('Reset progress and replay?')){
        state = {chapter:0, love:0, unlocked: []};
        saveState();
        render();
    }
}

// init
document.addEventListener('DOMContentLoaded', ()=>{ 
    // push load to server
    fetch('/api/state').then(r=>r.json()).then(srv=>{
        // merge server state if exists
        if(srv && srv.chapter !== undefined){
            // prefer local progress if it's further
            const local = JSON.parse(localStorage.getItem(stateKey) || '{}');
            if(local && local.chapter > (srv.chapter||0)) {
                // keep local
            } else {
                state = srv;
                localStorage.setItem(stateKey, JSON.stringify(state));
            }
        }
        render();
    }).catch(e=>{ render(); });
});
