const TIME_PER_QUESTION = 45;

let QUESTIONS = [];
let index = 0;
let answers = [];
let remaining = TIME_PER_QUESTION;
let timer;

const params = new URLSearchParams(location.search);
const test = params.get("test");

const card = document.getElementById("quizCard");

async function loadQuestions() {
  try {
    const res = await fetch(`data/${test}.json`);
    QUESTIONS = await res.json();
    answers = new Array(QUESTIONS.length).fill(null);
    renderQuestion();
  } catch {
    card.innerHTML = "فشل تحميل الأسئلة";
  }
}

function renderQuestion() {
  if (index >= QUESTIONS.length) return finish();

  const q = QUESTIONS[index];

  card.innerHTML = `
  <div class="card-inner">
    <div class="card-header">
      <div>⏳ <span id="timer">${remaining}</span></div>
      <div>${index + 1} / ${QUESTIONS.length}</div>
    </div>

    <div class="q-text">${q.question}</div>

    <div class="answers">
      ${q.options.map((o,i)=>`
        <div class="answer" onclick="selectAnswer(${i})">${o}</div>
      `).join("")}
    </div>

    <button id="nextBtn" class="btn primary" disabled>التالي</button>
  </div>
  `;

  document.getElementById("nextBtn").onclick = next;
  startTimer();
}

function selectAnswer(i){
  answers[index]=i;
  document.getElementById("nextBtn").disabled=false;
}

function next(){
  clearInterval(timer);
  remaining = TIME_PER_QUESTION;
  index++;
  renderQuestion();
}

function startTimer(){
  timer = setInterval(()=>{
    remaining--;
    document.getElementById("timer").textContent=remaining;
    if(remaining<=0){
      clearInterval(timer);
      index++;
      remaining = TIME_PER_QUESTION;
      renderQuestion();
    }
  },1000);
}

function finish(){
  let score=0;
  QUESTIONS.forEach((q,i)=>{
    if(answers[i]===q.answer) score++;
  });

  localStorage.setItem(`result_${test}`,JSON.stringify({
    score,
    total: QUESTIONS.length,
    percent: Math.round(score/QUESTIONS.length*100)
  }));

  location.href=`result.html?test=${test}`;
}

loadQuestions();
