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
  if (index >= QUESTIONS.length) {
    finish();
    return;
  }

  const q = QUESTIONS[index];

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-header">
        <div>⏳ <span id="timer">${remaining}</span></div>
        <div>${index + 1} / ${QUESTIONS.length}</div>
      </div>

      <div class="q-text">${q.question}</div>

      <div class="answers">
        ${q.options.map((o, i) => `
          <div class="answer ${answers[index] === i ? 'selected' : ''}"
               onclick="selectAnswer(${i})">
            ${o}
          </div>
        `).join("")}
      </div>

      <button class="btn primary" onclick="next()">التالي</button>
    </div>
  `;

  startTimer();
}

function selectAnswer(i) {
  answers[index] = i;

  // تمييز الإجابة المختارة
  document.querySelectorAll('.answer').forEach(a =>
    a.classList.remove('selected')
  );
  document.querySelectorAll('.answer')[i].classList.add('selected');
}

function next() {
  // ❌ منع الانتقال بدون إجابة
  if (answers[index] === null) {
    alert("من فضلك اختر إجابة قبل الانتقال للسؤال التالي");
    return;
  }

  clearInterval(timer);
  remaining = TIME_PER_QUESTION;
  index++;
  renderQuestion();
}

function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    remaining--;
    document.getElementById("timer").textContent = remaining;

    // ⛔ الوقت انتهى ولا توجد إجابة → لا ينتقل
    if (remaining <= 0) {
      clearInterval(timer);
      alert("انتهى الوقت! اختر إجابة للمتابعة");
      remaining = 0;
    }
  }, 1000);
}

function finish() {
  let score = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  localStorage.setItem(`result_${test}`, JSON.stringify({
    score,
    total: QUESTIONS.length
  }));

  location.href = `result.html?test=${test}`;
}

loadQuestions();
