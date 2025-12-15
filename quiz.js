// quiz.js — نسخة نهائية مستقرة

const TIME_PER_QUESTION = 45;

let QUESTIONS = [];
let index = 0;
let answers = [];
let remaining = TIME_PER_QUESTION;
let timer = null;

const params = new URLSearchParams(location.search);
const test = params.get("test") || "iq";

const card = document.getElementById("quizCard");

// تحميل الأسئلة
async function loadQuestions() {
  try {
    const res = await fetch(`data/${test}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("فشل تحميل الأسئلة");
    QUESTIONS = await res.json();

    // استرجاع التقدم إن وجد
    const savedIndex = localStorage.getItem(`quiz_${test}_index`);
    const savedAnswers = localStorage.getItem(`quiz_${test}_answers`);

    index = savedIndex ? Number(savedIndex) : 0;
    answers = savedAnswers
      ? JSON.parse(savedAnswers)
      : new Array(QUESTIONS.length).fill(null);

    renderQuestion();
  } catch (e) {
    card.innerHTML = "❌ فشل تحميل الأسئلة";
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
        <div>⏳ <span id="timer">${remaining}</span> ثانية</div>
        <div>${index + 1} / ${QUESTIONS.length}</div>
      </div>

      <div class="q-text">${q.question}</div>

      <div class="answers">
        ${q.options
          .map(
            (o, i) => `
          <div class="answer ${
            answers[index] === i ? "selected" : ""
          }" onclick="selectAnswer(${i})">
            ${typeof o === "string" ? o : o.text}
          </div>
        `
          )
          .join("")}
      </div>

      <button class="btn primary" onclick="nextQuestion()">التالي</button>
    </div>
  `;

  startTimer();
}

// اختيار إجابة
function selectAnswer(i) {
  answers[index] = i;

  // تحديث الواجهة
  document.querySelectorAll(".answer").forEach((el) =>
    el.classList.remove("selected")
  );
  document.querySelectorAll(".answer")[i].classList.add("selected");

  saveProgress();
}

// الانتقال للسؤال التالي
function nextQuestion() {
  if (answers[index] === null) {
    alert("⚠️ لازم تختار إجابة قبل المتابعة");
    return;
  }

  clearInterval(timer);
  remaining = TIME_PER_QUESTION;
  index++;
  saveProgress();
  renderQuestion();
}

// المؤقت
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    remaining--;
    document.getElementById("timer").textContent = remaining;

    if (remaining <= 0) {
      clearInterval(timer);
      remaining = TIME_PER_QUESTION;
      index++;
      saveProgress();
      renderQuestion();
    }
  }, 1000);
}

// حفظ التقدم
function saveProgress() {
  localStorage.setItem(`quiz_${test}_index`, index);
  localStorage.setItem(`quiz_${test}_answers`, JSON.stringify(answers));
}

// إنهاء الاختبار
function finish() {
  clearInterval(timer);

  let score = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  localStorage.setItem(
    `quiz_${test}_latest`,
    JSON.stringify({
      score,
      total: QUESTIONS.length,
      percent: Math.round((score / QUESTIONS.length) * 100),
    })
  );

  localStorage.removeItem(`quiz_${test}_index`);
  localStorage.removeItem(`quiz_${test}_answers`);

  location.href = `result.html?test=${test}`;
}

// تشغيل
loadQuestions();
