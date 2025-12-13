const TIME = 45;
let QUESTIONS = [];
let index = 0;
let answers = [];
let timer;
let remaining = TIME;

const test = new URLSearchParams(location.search).get("test");
const card = document.getElementById("quizCard");

fetch(`data/${test}.json`)
  .then(res => res.json())
  .then(data => {
    QUESTIONS = data;
    answers = Array(QUESTIONS.length).fill(null);
    render();
  });

function render() {
  if (index >= QUESTIONS.length) return finish();

  const q = QUESTIONS[index];
  card.innerHTML = `
    <div class="q-header">
      ⏱️ <span id="timer">${remaining}</span> | سؤال ${index + 1}/${QUESTIONS.length}
    </div>
    <div class="q-text">${q.question}</div>
    <div class="answers">
      ${q.options.map((o, i) => `
        <div class="answer" onclick="select(${i})">${o}</div>
      `).join("")}
    </div>
    <button class="btn primary" onclick="next()">التالي</button>
  `;
  startTimer();
}

function select(i) {
  answers[index] = i;
}

function next() {
  clearInterval(timer);
  remaining = TIME;
  index++;
  render();
}

function startTimer() {
  timer = setInterval(() => {
    remaining--;
    document.getElementById("timer").textContent = remaining;
    if (remaining === 0) next();
  }, 1000);
}

function finish() {
  let score = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  localStorage.setItem(`quiz_${test}_latest`, JSON.stringify({
    score,
    total: QUESTIONS.length,
    percent: Math.round(score / QUESTIONS.length * 100)
  }));

  location.href = `result.html?test=${test}`;
}
