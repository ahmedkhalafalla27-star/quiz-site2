const TIME_PER_QUESTION = 45;

let QUESTIONS = [];
let index = 0;
let answers = [];
let remaining = TIME_PER_QUESTION;
let timer;

const params = new URLSearchParams(location.search);
const test = params.get("test");

const card = document.getElementById("quizCard");

// 🔹 تحميل التقدم إن وُجد
index = Number(localStorage.getItem(`quiz_${test}_index`) || 0);
answers = JSON.parse(localStorage.getItem(`quiz_${test}_answers`) || "[]");
remaining = Number(localStorage.getItem(`quiz_${test}_remaining`) || TIME_PER_QUESTION);

async function loadQuestions() {
  try {
    const res = await fetch(`data/${test}.json`);
    QUESTIONS = await res.json();

    // تأكيد طول الإجابات
    while (answers.length < QUESTIONS.length) {
      answers.push(null);
    }

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
  saveProgress();

  document.querySelectorAll('.answer').forEach(a =>
    a.classList.remove('selected')
  );
  document.querySelectorAll('.answer')[i].classList.add('selected');
}

function next() {
  // ❌ لو لسه في وقت ومافيش إجابة → امنع
  if (remaining > 0 && answers[index] === null) {
    alert("يجب اختيار إجابة قبل الانتقال للسؤال التالي");
    return;
  }

  moveToNextQuestion();
}

function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    remaining--;
    document.getElementById("timer").textContent = remaining;
    saveProgress();

    // ⏰ الوقت انتهى → انتقل تلقائيًا (وتتحسب خطأ)
    if (remaining <= 0) {
      clearInterval(timer);
      answers[index] = null; // إجابة خطأ
      moveToNextQuestion();
    }
  }, 1000);
}

function moveToNextQuestion() {
  clearInterval(timer);
  index++;
  remaining = TIME_PER_QUESTION;
  saveProgress();
  renderQuestion();
}

function saveProgress() {
  localStorage.setItem(`quiz_${test}_index`, index);
  localStorage.setItem(`quiz_${test}_answers`, JSON.stringify(answers));
  localStorage.setItem(`quiz_${test}_remaining`, remaining);
}

function finish() {
  clearInterval(timer);

  let score = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  localStorage.setItem(`result_${test}`, JSON.stringify({
    score,
    total: QUESTIONS.length
  }));

  // تنظيف التقدم
  localStorage.removeItem(`quiz_${test}_index`);
  localStorage.removeItem(`quiz_${test}_answers`);
  localStorage.removeItem(`quiz_${test}_remaining`);

  location.href = `result.html?test=${test}`;
}

loadQuestions();
