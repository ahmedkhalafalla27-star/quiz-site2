// quiz.js
const TIME_PER_QUESTION = 45;
const AD_INDICES = [9,19,29];

let QUESTIONS = [];
let testName = new URL(location.href).searchParams.get('test') || 'iq';
let allowStart = new URL(location.href).searchParams.get('start') === 'true';
let index = Number(localStorage.getItem(`quiz_${testName}_index`) || 0);
let answers = JSON.parse(localStorage.getItem(`quiz_${testName}_answers`) || '[]');
let remaining = Number(localStorage.getItem(`quiz_${testName}_remaining`) || TIME_PER_QUESTION);
let timerInterval = null;

// منع الدخول المباشر بدون start=true
if(!allowStart){
  location.href = "index.html";
}

// ضمان طول المصفوفة
function ensureAnswers(len){
  if(!Array.isArray(answers)) answers = [];
  while(answers.length < len) answers.push(null);
}

const card = document.getElementById('quizCard');

async function loadQuestions(){
  try{
    const res = await fetch(`data/${testName}.json?v=${Date.now()}`);
    if(!res.ok) throw new Error('فشل تحميل الأسئلة');
    QUESTIONS = await res.json();
    ensureAnswers(QUESTIONS.length);
    renderQuestion();
  }catch(e){
    card.innerHTML = `<div class="card"><p>خطأ في تحميل الأسئلة: ${e.message}</p></div>`;
    console.error(e);
  }
}

function renderQuestion(){
  if(index >= QUESTIONS.length){
    finishTest(); return;
  }
  const q = QUESTIONS[index];

  const opts = q.options.map((o,i)=>`
    <div class="answer ${answers[index]===i ? 'selected':''}" data-i="${i}">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <div class="opt-text">${o}</div>
    </div>
  `).join('');

  const showMidAd = AD_INDICES.includes(index);

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-header">
        <div class="timer-box">⏳ <span id="timer">${remaining}</span> ثانية</div>
        <div class="progress-box">السؤال <span id="current">${index+1}</span> / <span id="total">${QUESTIONS.length}</span></div>
        <div class="action-box">
          <button class="save-btn" id="saveBtn">💾 حفظ</button>
          <button class="exit-btn" id="exitBtn">🚪 خروج</button>
        </div>
      </div>

      <div class="ad-slot small-ad">إعلان داخل الكارت</div>

      <div class="q-text">${q.question}</div>

      <div class="answers">${opts}</div>

      <div class="controls">
        <button class="btn secondary" id="prevBtn" ${index===0? 'disabled':''}>السابق</button>
        <button class="btn primary" id="nextBtn">${index === QUESTIONS.length-1 ? 'إنهاء' : 'التالي'}</button>
      </div>
    </div>

    ${ showMidAd ? `<div class="ad-slot mid-ad">إعلان بين الأسئلة</div>` : '' }
  `;

  document.querySelectorAll('.answer').forEach(el=>{
    el.addEventListener('click', ()=>{
      const i = Number(el.dataset.i);
      answers[index]=i; saveProgress();
      document.querySelectorAll('.answer').forEach(a=>a.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  document.getElementById('saveBtn').addEventListener('click', ()=>{ saveProgress(); alert('تم حفظ التقدم.'); });
  document.getElementById('exitBtn').addEventListener('click', ()=>{ if(confirm('هل تريد الخروج؟')) location.href='index.html'; });

  document.getElementById('prevBtn').addEventListener('click', ()=>{ if(index>0){ index--; remaining=TIME_PER_QUESTION; saveProgress(); renderQuestion(); }});
  document.getElementById('nextBtn').addEventListener('click', ()=>{ if(answers[index]===null){ if(!confirm('لم تختَر إجابة. هل تريد المتابعة؟')) return;} index++; remaining=TIME_PER_QUESTION; saveProgress(); renderQuestion(); });

  startTimer();
}

function startTimer(){
  clearTimer();
  document.getElementById('timer').textContent = remaining;
  timerInterval = setInterval(()=>{
    remaining--;
    document.getElementById('timer').textContent = remaining;
    if(remaining <= 0){ clearTimer(); index++; remaining=TIME_PER_QUESTION; saveProgress(); renderQuestion(); }
    else localStorage.setItem(`quiz_${testName}_remaining`, String(remaining));
  },1000);
}

function clearTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

function saveProgress(){
  localStorage.setItem(`quiz_${testName}_index`, String(index));
  localStorage.setItem(`quiz_${testName}_answers`, JSON.stringify(answers));
  localStorage.setItem(`quiz_${testName}_remaining`, String(remaining));
}

function finishTest(){
  clearTimer();
  let correctCount=0;
  for(let i=0;i<QUESTIONS.length;i++){
    if(answers[i]!==null && answers[i]===QUESTIONS[i].answer) correctCount++;
  }
  const result = { score: correctCount, total: QUESTIONS.length, percent: Math.round((correctCount/QUESTIONS.length)*100), timestamp: Date.now() };
  localStorage.setItem(`quiz_${testName}_latest`, JSON.stringify(result));
  localStorage.removeItem(`quiz_${testName}_index`);
  localStorage.removeItem(`quiz_${testName}_remaining`);
  localStorage.removeItem(`quiz_${testName}_answers`);
  location.href = `result.html?test=${encodeURIComponent(testName)}`;
}

loadQuestions();
