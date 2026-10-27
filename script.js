const GAME_DEFINITIONS = [
  { id: 'counting', label: 'Đếm số' },
  { id: 'clock', label: 'Đồng hồ' },
  { id: 'position', label: 'Vị trí' },
  { id: 'missing', label: 'Thiếu số' },
  { id: 'listen', label: 'Nghe số' },
  { id: 'quantity', label: 'Số lượng' }
];

const state = {
  currentGame: 'counting',
  mode: 'easy',
  score: 0,
  problem: null,
  hasAnswered: false
};

const rangeForMode = {
  easy: { min: 0, max: 10 },
  hard: { min: 10, max: 20 }
};

const icons = ['🍎', '🍉', '🍋', '🍓', '🍇', '🍒', '🍊', '🍏', '🥕', '🌼', '🐝', '🐶', '🐱', '🐰', '🦊', '🐸', '🍀', '🌞', '⚽', '🎈', '🧁', '🍪'];

const speechSupported = 'speechSynthesis' in window;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function rangeForCurrentMode() {
  return rangeForMode[state.mode];
}

function speak(text) {
  if (!speechSupported) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'vi-VN';
  utter.rate = 0.96;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function updateScore() {
  const scoreValue = document.getElementById('scoreValue');
  scoreValue.textContent = state.score;
}

function renderGameNav() {
  const nav = document.getElementById('gameNav');
  nav.innerHTML = GAME_DEFINITIONS.map(
    (game) => `
      <button type="button" data-game="${game.id}" class="${state.currentGame === game.id ? 'active' : ''}">
        ${game.label}
      </button>
    `
  ).join('');

  nav.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentGame = button.dataset.game;
      state.hasAnswered = false;
      state.problem = null;
      render();
    });
  });
}

function renderDifficultyButtons() {
  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      state.problem = null;
      state.hasAnswered = false;
      render();
    });
  });
}

function getGameTitle() {
  const map = {
    counting: 'Đếm đồ vật và phép toán',
    clock: 'Đồng hồ và thời gian',
    position: 'Vị trí, trên dưới và trái phải',
    missing: 'Số còn thiếu',
    listen: 'Nghe và chọn số',
    quantity: 'Chọn đúng số lượng'
  };
  return map[state.currentGame] || 'Trò chơi';
}

function addResultBanner(message, isSuccess) {
  const existing = document.querySelector('.result-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = `result-banner ${isSuccess ? 'success' : 'error'}`;
  banner.textContent = message;
  document.getElementById('gameContent').appendChild(banner);
}

function awardPoints(amount) {
  state.score += amount;
  updateScore();
}

function generateCountProblem() {
  const { min, max } = rangeForCurrentMode();
  const kindRoll = Math.random();
  const object = icons[randomInt(0, icons.length - 1)];

  if (kindRoll < 0.38) {
    const count = randomInt(min, max);
    const choices = shuffle([
      count,
      count + (count < max ? 1 : -1),
      Math.max(min, count - 2),
      Math.min(max, count + 2)
    ]).filter((value, idx, array) => array.indexOf(value) === idx);

    return {
      type: 'count',
      question: 'Có bao nhiêu đồ vật?',
      prompt: `Có bao nhiêu ${object} đây?`,
      count,
      objects: Array.from({ length: count }, (_, index) => ({ icon: object, key: `${object}-${index}` })),
      choices: shuffle(choices).map((value) => ({ value, label: String(value) }))
    };
  }

  if (kindRoll < 0.7) {
    const a = randomInt(min, Math.min(max, 9));
    const b = randomInt(0, Math.max(0, max - a));
    const total = a + b;
    return {
      type: 'sum',
      question: 'Tính tổng số lượng',
      prompt: `${a} + ${b} = ?`,
      answer: total,
      choices: shuffle([total, Math.max(min, total - 2), total + 2, Math.max(min, total - 1)]).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4)
    };
  }

  const left = randomInt(min, max);
  const right = randomInt(min, max);
  const bigger = left > right ? 'trái' : 'phải';
  const answer = left === right ? 'bằng nhau' : bigger;

  return {
    type: 'compare',
    question: 'Nhóm nào có nhiều hơn?',
    prompt: 'Nhóm nào có nhiều hơn?',
    leftCount: left,
    rightCount: right,
    answer,
    choices: shuffle([
      { value: 'trái', label: 'Nhóm trái' },
      { value: 'phải', label: 'Nhóm phải' },
      { value: 'bằng nhau', label: 'Bằng nhau' }
    ])
  };
}

function renderCountingGame() {
  if (!state.problem || state.problem.type === undefined) {
    state.problem = generateCountProblem();
  }

  const problem = state.problem;
  let html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">${problem.prompt}</p>
        <span class="badge">${state.mode === 'easy' ? 'Mức dễ 0–10' : 'Mức nâng cao 10–20'}</span>
      </div>
  `;

  if (problem.type === 'count') {
    html += `
      <div class="object-row">
        ${problem.objects.map((item) => `<div class="object-item">${item.icon}</div>`).join('')}
      </div>
      <div class="option-grid" style="margin-top: 20px;">
        ${problem.choices.map((choice) => `
          <button type="button" class="answer-btn" data-answer="${choice.value}" data-correct="${choice.value === problem.count}">
            ${choice.label}
          </button>
        `).join('')}
      </div>
    `;
  } else if (problem.type === 'sum') {
    html += `
      <div class="narration-box">
        <div class="mini-icon">🧮</div>
        <div class="big-number">${problem.prompt}</div>
      </div>
      <div class="option-grid" style="margin-top: 20px;">
        ${problem.choices.map((value) => `
          <button type="button" class="answer-btn" data-answer="${value}" data-correct="${value === problem.answer}">
            ${value}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    html += `
      <div class="object-row" style="margin: 20px 0;">
        <div class="object-item small">${icons[0]}</div>
        <div class="object-item small">${icons[1]}</div>
        <div class="object-item small">${icons[2]}</div>
      </div>
      <div class="object-row" style="margin-bottom: 16px;">
        <div class="object-item small">${'🍏'.repeat(3).split('').join('')}</div>
      </div>
      <div class="group-choice">
        ${problem.leftCount} trái &nbsp; • &nbsp; ${problem.rightCount} phải
      </div>
      <div class="option-grid" style="margin-top: 20px;">
        ${problem.choices.map((choice) => `
          <button type="button" class="answer-btn" data-answer="${choice.value}" data-correct="${choice.value === problem.answer}">
            ${choice.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  html += `</div>`;
  document.getElementById('gameContent').innerHTML = html;

  const answerButtons = document.querySelectorAll('.answer-btn');
  answerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.answer;
      const isCorrect = button.dataset.correct === 'true';
      handleAnswer(isCorrect, selected, problem);
    });
  });
}

function generateClockProblem() {
  const { min, max } = rangeForCurrentMode();
  const hour = randomInt(min, Math.min(23, max + 3));
  const minute = [0, 15, 30, 45][randomInt(0, 3)];
  const display = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const answer = display;
  const wrongs = [
    `${String((hour + 1) % 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    `${String((hour + 2) % 12).padStart(2, '0')}:${String((minute + 15) % 60).padStart(2, '0')}`,
    `${String((hour + 3) % 12).padStart(2, '0')}:${String((minute + 30) % 60).padStart(2, '0')}`
  ];

  return {
    hour,
    minute,
    answer,
    options: shuffle([answer, ...wrongs]).slice(0, 4)
  };
}

function renderClockGame() {
  if (!state.problem || !state.problem.answer) {
    state.problem = generateClockProblem();
  }

  const problem = state.problem;
  const hourAngle = (problem.hour % 12) * 30 + (problem.minute / 60) * 30;
  const minuteAngle = problem.minute * 6;

  const tickMarks = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * 360 - 90;
    return `<span class="tick" style="transform: rotate(${angle}deg);"></span>`;
  }).join('');

  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">Đồng hồ hiện đang chỉ mấy giờ?</p>
        <span class="badge">${state.mode === 'easy' ? 'Mức dễ 0–10' : 'Mức nâng cao 10–20'}</span>
      </div>
      <div class="clock-wrap">
        <div class="clock-face">
          ${tickMarks}
          <div class="hand hour" style="transform: rotate(${hourAngle}deg);"></div>
          <div class="hand minute" style="transform: rotate(${minuteAngle}deg);"></div>
          <div class="center"></div>
        </div>
        <div class="clock-digital">${String(problem.hour).padStart(2, '0')}:${String(problem.minute).padStart(2, '0')}</div>
      </div>
      <div class="clock-choice-grid">
        ${problem.options.map((option) => `
          <button type="button" class="answer-btn" data-answer="${option}" data-correct="${option === problem.answer}">
            ${option}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.answer;
      const isCorrect = button.dataset.correct === 'true';
      handleAnswer(isCorrect, selected, problem);
    });
  });
}

function generatePositionProblem() {
  const relations = ['trên', 'dưới', 'trong', 'ngoài', 'trái', 'phải', 'trước', 'sau'];
  const relation = relations[randomInt(0, relations.length - 1)];
  const items = ['🐱', '🐰', '🦊', '🐼', '🐶'];
  const item = items[randomInt(0, items.length - 1)];
  return {
    item,
    relation,
    prompt: `Kéo ${item} vào vị trí ${relation}`,
    correctAnswer: relation
  };
}

function renderPositionGame() {
  if (!state.problem || !state.problem.correctAnswer) {
    state.problem = generatePositionProblem();
  }

  const problem = state.problem;
  const targetSlots = [
    { key: 'trên', label: 'Trên' },
    { key: 'dưới', label: 'Dưới' },
    { key: 'trong', label: 'Trong' },
    { key: 'ngoài', label: 'Ngoài' },
    { key: 'trái', label: 'Trái' },
    { key: 'phải', label: 'Phải' },
    { key: 'trước', label: 'Trước' },
    { key: 'sau', label: 'Sau' }
  ];

  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">${problem.prompt}</p>
        <span class="badge">Kéo và thả</span>
      </div>

      <div class="position-board">
        <div class="drag-item" draggable="true" data-item="${problem.item}">${problem.item}</div>
      </div>

      <div class="position-scene">
        ${targetSlots.map((slot) => `
          <div class="position-slot" data-slot="${slot.key}" data-label="${slot.label}" aria-label="${slot.label}"></div>
        `).join('')}
      </div>

      <div class="target-list" style="margin-top: 20px;">
        ${targetSlots.map((slot) => `
          <button type="button" class="target-slot" data-target="${slot.key}">${slot.label}</button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;

  const dragItem = document.querySelector('.drag-item');
  const targetButtons = document.querySelectorAll('.target-slot');

  dragItem.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', problem.item);
  });

  targetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isCorrect = button.dataset.target === problem.correctAnswer;
      handleAnswer(isCorrect, button.dataset.target, problem);
    });
  });

  document.querySelectorAll('.position-slot').forEach((slot) => {
    slot.addEventListener('dragover', (event) => event.preventDefault());
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const dropped = slot.dataset.slot;
      const isCorrect = dropped === problem.correctAnswer;
      handleAnswer(isCorrect, dropped, problem);
    });
  });
}

function generateMissingProblem() {
  const { min, max } = rangeForCurrentMode();
  const start = randomInt(min, max - 2);
  const missingPosition = randomInt(0, 2);
  const numbers = [start, start + 1, start + 2, start + 3];
  const missingValue = numbers[missingPosition];
  numbers[missingPosition] = null;

  return {
    sequence: numbers,
    missingValue,
    prompt: `Số còn thiếu: ${numbers.map((value) => value === null ? '—' : value).join(', ')}`,
    options: shuffle([missingValue, missingValue + 1, Math.max(min, missingValue - 1), Math.min(max, missingValue + 2)]).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4)
  };
}

function renderMissingGame() {
  if (!state.problem || !state.problem.missingValue) {
    state.problem = generateMissingProblem();
  }

  const problem = state.problem;
  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">Điền số còn thiếu</p>
        <span class="badge">${state.mode === 'easy' ? 'Mức dễ 0–10' : 'Mức nâng cao 10–20'}</span>
      </div>

      <div class="sequence-row">
        ${problem.sequence.map((value) => `
          <div class="sequence-item ${value === null ? 'empty' : ''}">${value === null ? '—' : value}</div>
        `).join('')}
      </div>

      <div class="option-grid" style="margin-top: 18px;">
        ${problem.options.map((option) => `
          <button type="button" class="answer-btn" data-answer="${option}" data-correct="${option === problem.missingValue}">
            ${option}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = Number(button.dataset.answer);
      const isCorrect = Number(button.dataset.correct) === true || Number(button.dataset.answer) === problem.missingValue;
      handleAnswer(isCorrect, selected, problem);
    });
  });
}

function generateListenProblem() {
  const { min, max } = rangeForCurrentMode();
  const number = randomInt(min, max);
  return {
    number,
    prompt: `Số ${number}`,
    options: shuffle([number, Math.max(min, number - 2), Math.min(max, number + 2), Math.max(min, number - 1)]).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4)
  };
}

function renderListenGame() {
  if (!state.problem || !state.problem.number) {
    state.problem = generateListenProblem();
  }

  const problem = state.problem;
  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">Nghe tiếng và chọn số đúng</p>
        <span class="badge">Nghe đọc</span>
      </div>

      <div class="narration-box">
        <button type="button" class="mini-icon" id="playVoiceBtn" aria-label="Nghe số">🔊</button>
        <div class="big-number">?</div>
      </div>

      <div class="option-grid" style="margin-top: 18px;">
        ${problem.options.map((option) => `
          <button type="button" class="answer-btn" data-answer="${option}" data-correct="${option === problem.number}">
            ${option}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;
  document.getElementById('playVoiceBtn').addEventListener('click', () => speak(`Số ${problem.number}`));

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = Number(button.dataset.answer);
      const isCorrect = Number(button.dataset.answer) === problem.number;
      handleAnswer(isCorrect, selected, problem);
    });
  });
}

function generateQuantityProblem() {
  const { min, max } = rangeForCurrentMode();
  const number = randomInt(min, max);
  const object = icons[randomInt(0, icons.length - 1)];
  const optionValues = shuffle([
    number,
    Math.max(min, number - 2),
    Math.min(max, number + 2),
    Math.max(min, number - 1)
  ]).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4);

  return {
    number,
    object,
    prompt: `Hãy chọn số lượng ${object} đúng bằng ${number}`,
    options: optionValues
  };
}

function renderQuantityGame() {
  if (!state.problem || !state.problem.number) {
    state.problem = generateQuantityProblem();
  }

  const problem = state.problem;
  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">${problem.prompt}</p>
        <span class="badge">Đếm đúng</span>
      </div>

      <div class="narration-box">
        <div class="big-number">${problem.number}</div>
      </div>

      <div class="object-row" style="margin-bottom: 18px;">
        ${Array.from({ length: problem.number }, (_, index) => `<div class="object-item small">${problem.object}</div>`).join('')}
      </div>

      <div class="option-grid">
        ${problem.options.map((option) => `
          <button type="button" class="answer-btn" data-answer="${option}" data-correct="${option === problem.number}">
            ${option}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = Number(button.dataset.answer);
      const isCorrect = Number(button.dataset.answer) === problem.number;
      handleAnswer(isCorrect, selected, problem);
    });
  });
}

function handleAnswer(isCorrect, selected, problem) {
  if (state.hasAnswered) return;
  state.hasAnswered = true;

  const buttons = document.querySelectorAll('.answer-btn, .target-slot');
  buttons.forEach((button) => {
    const isButtonCorrect = button.dataset.correct === 'true';
    if (isButtonCorrect) {
      button.classList.add('correct');
    }
    if (button.dataset.answer === String(selected) && !isCorrect) {
      button.classList.add('wrong');
    }
  });

  if (isCorrect) {
    awardPoints(10);
    addResultBanner('Tuyệt vời! Đáp án đúng! 👏', true);
    speak('Đúng rồi! Chúc mừng bạn!');
  } else {
    addResultBanner(`Chưa đúng rồi. Đáp án là ${getCorrectAnswerText(problem)}. Cố gắng lần sau nhé! 🌟`, false);
    speak(`Rất tiếc. Đáp án đúng là ${getCorrectAnswerText(problem)}.`);
  }

  const replayButton = document.createElement('button');
  replayButton.type = 'button';
  replayButton.className = 'action-btn';
  replayButton.textContent = 'Chơi lại';
  replayButton.style.marginTop = '16px';
  replayButton.addEventListener('click', () => {
    state.problem = null;
    state.hasAnswered = false;
    render();
  });
  document.getElementById('gameContent').appendChild(replayButton);
}

function getCorrectAnswerText(problem) {
  if (state.currentGame === 'counting') {
    return problem.count ?? problem.answer ?? problem.missingValue ?? '';
  }
  if (state.currentGame === 'clock') {
    return problem.answer;
  }
  if (state.currentGame === 'position') {
    return problem.correctAnswer;
  }
  if (state.currentGame === 'missing') {
    return problem.missingValue;
  }
  if (state.currentGame === 'listen') {
    return problem.number;
  }
  if (state.currentGame === 'quantity') {
    return problem.number;
  }
  return 'đáp án đúng';
}

function renderGameContent() {
  const gameMap = {
    counting: renderCountingGame,
    clock: renderClockGame,
    position: renderPositionGame,
    missing: renderMissingGame,
    listen: renderListenGame,
    quantity: renderQuantityGame
  };

  document.getElementById('gameTitle').textContent = getGameTitle();
  const renderer = gameMap[state.currentGame];
  if (renderer) {
    renderer();
  }
}

function render() {
  renderGameNav();
  renderDifficultyButtons();
  renderGameContent();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('voiceBtn').addEventListener('click', () => {
    const guidance = {
      counting: 'Bây giờ chúng ta cùng đếm số và làm phép tính. Hãy chọn đáp án đúng nhé.',
      clock: 'Em hãy nhìn đồng hồ và chọn giờ đúng.',
      position: 'Kéo con vật vào đúng vị trí: trên, dưới, trái, phải, trước hoặc sau.',
      missing: 'Hãy tìm số còn thiếu trong dãy số.',
      listen: 'Nghe và chọn số đúng.',
      quantity: 'Hãy chọn đúng số lượng đồ vật tương ứng.'
    };
    speak(guidance[state.currentGame] || 'Chúng ta cùng học toán nhé!');
  });
});
