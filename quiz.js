// quiz.js
const TIME_PER_QUESTION = 45;
const AD_INDICES = [9,19,29];

let QUESTIONS=[];
let testName=new URL(location.href).searchParams.get('test')||'iq';
let index=Number(localStorage.getItem(`quiz_${testName}_index`)||0);
let answers=JSON.parse(localStorage.getItem(`quiz_${testName}_answers`)||'[]');
let remaining=Number(localStorage.getItem(`quiz_${testName}_remaining`)||TIME_PER_QUESTION);
let timerInterval=null;

function ensureAnswers(len){
  if(!Array.isArray(answers)) answers=[];
  while(answers.length<len) answers.push(null);
}

const card=document.getElementById('quizCard');

async function loadQuestions(){
  try{
    const res=await fetch(`data/${testName}.json?v=${Date.now()}`);
    if(!res.ok) throw new Error("فشل تحميل الأسئلة");
    QUESTIONS=await res.json();
    ensureAnswers(QUESTIONS.length);
    renderQuestion();
  }catch(e){
    card.innerHTML=`<div class="card"><p>خطأ: ${e.message}</p></div>`;
  }
}

function renderQuestion(){
  if(index>=QUESTIONS.length){ finishTest(); return; }

  const q=QUESTIONS[index];
  const opts=q.options.map((o,i)=>`
    <div class="answer ${answers[index]===i?'selected':''}" data-i="${i}">
      <span class="opt-letter">${String.fromCharCode(65+i)}</span>
      <div class="opt-text">${o}</div>
    </div>
  `).join("");

  const showMidAd = AD_INDICES.includes(index);

  card.innerHTML=`
    <div class="card-inner">
      <div class="card-header">
        <div class="timer-box">⏳ <span id="timer">${remaining}</span> ثانية</div>
        <div class="progress-box">السؤال ${index+1} / ${QUESTIONS.length}</div>
        <div class="action-box">
          <button class="save-btn" id="saveBtn">💾 حفظ</button>
          <button class="exit-btn" id="exitBtn">🚪 خروج</button>
        </div>
      </div>

      <div class="ad-slot small-ad">إعلان داخل الكارت</div>

      <div class="q-text">${q.question}</div>
      <div class="answers">${opts}</div>

      <div class="controls">
        <button class="btn secondary" id="prevBtn" ${index===0?'disabled':''}>السابق</button>
        <button class="btn primary" id="nextBtn">${index===QUESTIONS.length-1?'إنهاء':'التالي'}</button>
      </div>
    </div>
    ${ showMidAd ? `<div class="ad-slot mid-ad">إعلان</div>` : '' }
  `;

  document.querySelectorAll(".answer").forEach(el=>{
    el.onclick=()=>{
      answers[index]=Number(el.dataset.i);
      saveProgress();
      document.querySelectorAll(".answer").forEach(a=>a.classList.remove("selected"));
      el.classList.add("selected");
    };
  });

  document.getElementById("prevBtn").onclick=()=>{
    if(index>0){
      index--; remaining=TIME_PER_QUESTION; saveProgress(); renderQuestion();
    }
  };

  document.getElementById("nextBtn").onclick=()=>{
    index++; remaining=TIME_PER_QUESTION; saveProgress(); renderQuestion();
  };

  document.getElementById("saveBtn").onclick=()=>alert("تم الحفظ");
  document.getElementById("exitBtn").onclick=()=>location.href="index.html";

  startTimer();
}

function startTimer(){
  clearTimer();
  timerInterval=setInterval(()=>{
    remaining--;
    document.getElementById('timer').textContent=remaining;

    if(remaining<=0){
      clearTimer();
      index++;
      remaining=TIME_PER_QUESTION;
      saveProgress();
      renderQuestion();
    }else{
      localStorage.setItem(`quiz_${testName}_remaining`,remaining);
    }
  },1000);
}

function clearTimer(){ if(timerInterval) clearInterval(timerInterval); }

function saveProgress(){
  localStorage.setItem(`quiz_${testName}_index`,index);
  localStorage.setItem(`quiz_${testName}_answers`,JSON.stringify(answers));
  localStorage.setItem(`quiz_${testName}_remaining`,remaining);
}

function finishTest(){
  clearTimer();
  let correct=0;
  for(let i=0;i<QUESTIONS.length;i++){
    if(answers[i]===QUESTIONS[i].answer) correct++;
  }
  const result={
    score:correct,
    total:QUESTIONS.length,
    percent:Math.round(correct/QUESTIONS.length*100)
  };
  localStorage.setItem(`quiz_${testName}_latest`,JSON.stringify(result));
  location.href=`result.html?test=${testName}`;
}

loadQuestions();
