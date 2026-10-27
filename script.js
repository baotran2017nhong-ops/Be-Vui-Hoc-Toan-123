const GAME_DEFINITIONS = [
  { id: 'counting', label: 'Đếm số' },
  { id: 'clock', label: 'Xem giờ' },
  { id: 'position', label: 'Kéo thả' },
  { id: 'missing', label: 'Thiếu số' },
  { id: 'listen', label: 'Đọc số' },
  { id: 'quantity', label: 'Số lượng' }
];

const state = {
  currentGame: 'counting',
  mode: 'easy',
  score: 0,
  problem: null,
  hasAnswered: false,
  soundEnabled: true
};

const rangeForMode = {
  easy: { min: 0, max: 10 },
  hard: { min: 10, max: 20 }
};

const icons = ['🍎', '🍉', '🍋', '🍓', '🍇', '🍒', '🍊', '🍏', '🥕', '🌼', '🐝', '🐶', '🐱', '🐰', '🦊', '🐸', '🍀', '🌞', '⚽', '🎈', '🧁', '🍪'];
const positionSlots = [
  { key: 'trên', label: 'Trên' },
  { key: 'dưới', label: 'Dưới' },
  { key: 'trong', label: 'Trong' },
  { key: 'ngoài', label: 'Ngoài' },
  { key: 'trái', label: 'Trái' },
  { key: 'phải', label: 'Phải' },
  { key: 'trước', label: 'Trước' },
  { key: 'sau', label: 'Sau' }
];

const numberWords = {
  0: 'không',
  1: 'một',
  2: 'hai',
  3: 'ba',
  4: 'bốn',
  5: 'năm',
  6: 'sáu',
  7: 'bảy',
  8: 'tám',
  9: 'chín',
  10: 'mười',
  11: 'mười một',
  12: 'mười hai',
  13: 'mười ba',
  14: 'mười bốn',
  15: 'mười năm',
  16: 'mười sáu',
  17: 'mười bảy',
  18: 'mười tám',
  19: 'mười chín',
  20: 'hai mươi'
};


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

function updateScore() {
  const scoreValue = document.getElementById('scoreValue');
  if (scoreValue) scoreValue.textContent = state.score;
}


// Âm thanh hiệu ứng ngắn tạo ngay trên trình duyệt; không đọc lời hướng dẫn.
let audioContext = null;

function playTone(frequency, duration, type = 'sine', volume = 0.045, delay = 0) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  } catch (error) {
    // Nếu thiết bị không hỗ trợ âm thanh, trò chơi vẫn hoạt động bình thường.
  }
}

function playTapSound() {
  playTone(720, 0.07, 'sine', 0.025);
}

function playPopSound() {
  playTone(560, 0.08, 'triangle', 0.045);
  playTone(920, 0.12, 'sine', 0.035, 0.045);
}

function playCorrectSound() {
  playTone(660, 0.13, 'sine', 0.055);
  playTone(880, 0.16, 'sine', 0.055, 0.12);
  playTone(1100, 0.20, 'sine', 0.05, 0.24);
}

function playWrongSound() {
  playTone(240, 0.18, 'triangle', 0.045);
  playTone(185, 0.22, 'triangle', 0.035, 0.13);
}

function renderGameNav() {
  const nav = document.getElementById('gameNav');
  if (!nav) return;

  nav.innerHTML = GAME_DEFINITIONS.map(
    (game) => `
      <button type="button" data-game="${game.id}" class="${state.currentGame === game.id ? 'active' : ''}">
        ${game.label}
      </button>
    `
  ).join('');

  nav.querySelectorAll('button').forEach((button) => {
    button.onclick = () => {
      state.currentGame = button.dataset.game;
      state.hasAnswered = false;
      state.problem = null;
      render();
    };
  });
}

function renderDifficultyButtons() {
  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
    button.onclick = () => {
      state.mode = button.dataset.mode;
      state.problem = null;
      state.hasAnswered = false;
      render();
    };
  });
}

function getGameTitle() {
  const map = {
    counting: 'Đếm đồ vật và phép toán',
    clock: 'Xem giờ',
    position: 'Kéo thả vị trí',
    missing: 'Số còn thiếu',
    listen: 'Đọc số',
    quantity: 'Số lượng'
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

function reRenderCurrentGame() {
  state.problem = null;
  state.hasAnswered = false;
  render();
}

function generateCountProblem() {
  const { min, max } = rangeForCurrentMode();
  const kindRoll = Math.random();
  const object = icons[randomInt(0, icons.length - 1)];

  if (kindRoll < 0.38) {
    const count = randomInt(min, max);
    const choices = shuffle([
      count,
      count < max ? count + 1 : count - 1,
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
    const wrongs = shuffle([
      total,
      Math.max(min, total - 2),
      total + 2,
      Math.max(min, total - 1)
    ]).filter((value, idx, array) => array.indexOf(value) === idx).slice(0, 4);

    return {
      type: 'sum',
      question: 'Tính tổng số lượng',
      prompt: `${a} + ${b} = ?`,
      answer: total,
      choices: wrongs
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
        <div class="object-item small">🐶</div>
        <div class="object-item small">🐱</div>
        <div class="object-item small">🐰</div>
      </div>
      <div class="group-choice">
        ${problem.leftCount} trái • ${problem.rightCount} phải
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

  html += '</div>';
  document.getElementById('gameContent').innerHTML = html;

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.onclick = () => {
      const selected = button.dataset.answer;
      const isCorrect = button.dataset.correct === 'true';
      handleAnswer(isCorrect, selected, problem);
    };
  });
}

function generateClockProblem() {
  const { min, max } = rangeForCurrentMode();
  const hourStart = state.mode === 'easy' ? min : Math.max(10, min);
  const hourEnd = state.mode === 'easy' ? Math.min(10, max) : Math.min(20, max);
  const hour = randomInt(hourStart, hourEnd);
  const minute = [0, 30][randomInt(0, 1)];
  const answer = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const options = new Set([answer]);

  while (options.size < 4) {
    const candidateHour = randomInt(hourStart, hourEnd);
    const candidateMinute = [0, 30][randomInt(0, 1)];
    const value = `${String(candidateHour).padStart(2, '0')}:${String(candidateMinute).padStart(2, '0')}`;
    options.add(value);
  }

  return {
    hour,
    minute,
    answer,
    options: shuffle([...options])
  };
}

function renderClockGame() {
  if (!state.problem || !state.problem.answer) {
    state.problem = generateClockProblem();
  }

  const problem = state.problem;
  const hourAngle = ((problem.hour % 12) * 30) + (problem.minute / 60) * 30;
  const minuteAngle = problem.minute * 6;
  const tickMarks = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * 360 - 90;
    return `<span class="tick" style="transform: translate(-50%, -94px) rotate(${angle}deg);"></span>`;
  }).join('');

  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">Đồng hồ đang chỉ mấy giờ?</p>
        <span class="badge">${state.mode === 'easy' ? 'Mức dễ 0–10' : 'Mức nâng cao 10–20'}</span>
      </div>

      <div class="clock-wrap">
        <div class="clock-face">
          ${tickMarks}
          <div class="hand hour" style="transform: translate(-50%, -100%) rotate(${hourAngle}deg);"></div>
          <div class="hand minute" style="transform: translate(-50%, -100%) rotate(${minuteAngle}deg);"></div>
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

      <div class="input-submit-row">
        <input id="clockInput" class="quiz-input" type="text" inputmode="numeric" placeholder="Nhập giờ: 08:30" aria-label="Nhập giờ" />
        <button type="button" class="submit-btn" id="clockCheckBtn">Kiểm tra</button>
      </div>
    </div>
  `;

  document.getElementById('gameContent').innerHTML = html;

  document.querySelectorAll('.answer-btn').forEach((button) => {
    button.onclick = () => {
      const selected = button.dataset.answer;
      const isCorrect = button.dataset.correct === 'true';
      handleAnswer(isCorrect, selected, problem);
    };
  });

  const clockInput = document.getElementById('clockInput');
  const clockCheckBtn = document.getElementById('clockCheckBtn');

  clockCheckBtn.onclick = () => {
    const value = normalizeClockInput(clockInput.value);
    if (!value) {
      addResultBanner('Hãy nhập giờ trước khi kiểm tra nhé! ⏰', false);
      return;
    }
    const isCorrect = value === problem.answer;
    handleAnswer(isCorrect, value, problem);
  };
}

function normalizeClockInput(value) {
  if (!value) return '';
  const cleaned = value.replace(/\s+/g, '').replace(/[^\d:]/g, '');

  if (!cleaned) return '';
  if (cleaned.includes(':')) {
    const [hourPart, minutePart] = cleaned.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart || 0);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return '';
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const digits = cleaned;
  if (digits.length === 3) {
    return `${digits.slice(0, 1).padStart(2, '0')}:${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return '';
}

function generatePositionProblem() {
  const activities = [
    { kind: 'tidy', title: '🧸 Bé cất đồ dùng', items: [
      { icon: '🧸', answer: 'toybox' }, { icon: '📚', answer: 'bookshelf' },
      { icon: '👕', answer: 'wardrobe' }, { icon: '🍽️', answer: 'shelf' },
      { icon: '🖍️', answer: 'pencilcase' }, { icon: '🧦', answer: 'wardrobe' }
    ], places: [
      { key: 'toybox', icon: '🧺🧸', label: 'Hộp đồ chơi' },
      { key: 'bookshelf', icon: '📚🗄️', label: 'Giá sách' },
      { key: 'wardrobe', icon: '🚪👕', label: 'Tủ quần áo' },
      { key: 'shelf', icon: '🍽️🗃️', label: 'Kệ bát đĩa' },
      { key: 'pencilcase', icon: '✏️🖍️', label: 'Hộp bút' }
    ]},
    { kind: 'animals', title: '🐾 Con vật về đúng nhà', items: [
      { icon: '🐟', answer: 'water' }, { icon: '🐦', answer: 'nest' },
      { icon: '🐰', answer: 'burrow' }, { icon: '🐒', answer: 'forest' },
      { icon: '🐄', answer: 'farm' }, { icon: '🐝', answer: 'hive' }
    ], places: [
      { key: 'water', icon: '🌊🐠', label: 'Ao, hồ' },
      { key: 'nest', icon: '🌳🪺', label: 'Tổ chim' },
      { key: 'burrow', icon: '🌿🕳️', label: 'Hang thỏ' },
      { key: 'forest', icon: '🌴🌳', label: 'Rừng' },
      { key: 'farm', icon: '🏡🌾', label: 'Nông trại' },
      { key: 'hive', icon: '🌼🍯', label: 'Tổ ong' }
    ]}
  ];
  const activity = activities[randomInt(0, activities.length - 1)];
  const item = activity.items[randomInt(0, activity.items.length - 1)];
  return { ...activity, item: item.icon, correctAnswer: item.answer, prompt: activity.title };
}

function renderPositionGame() {
  if (!state.problem || !state.problem.correctAnswer || !state.problem.places) state.problem = generatePositionProblem();
  const problem = state.problem;
  const html = `
    <div class="game-surface visual-drag-game">
      <div class="question-top"><p class="prompt">${problem.prompt}</p><span class="badge">👆 Kéo hình vào đúng chỗ</span></div>
      <p class="visual-instruction">${problem.kind === 'tidy' ? '🧹 Giúp bé cất đồ dùng gọn gàng nhé!' : '🏡 Hãy đưa mỗi con vật về đúng nơi sống!'}</p>
      <div class="visual-drag-item" id="visualDragItem" draggable="true" aria-label="Hình cần kéo">${problem.item}</div>
      <div class="visual-target-grid">
        ${problem.places.map(place => `<button type="button" class="visual-target" data-target="${place.key}" data-answer="${place.key}" data-correct="${place.key === problem.correctAnswer}"><span class="target-picture">${place.icon}</span><span class="target-label">${place.label}</span></button>`).join('')}
      </div>
      <p class="visual-hint">💡 Chạm vào nơi đúng hoặc kéo hình vào đó.</p>
    </div>`;
  document.getElementById('gameContent').innerHTML = html;
  const item = document.getElementById('visualDragItem');
  const targets = document.querySelectorAll('.visual-target');
  const answer = (selected) => handleAnswer(selected === problem.correctAnswer, selected, problem);
  item.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', problem.item); e.dataTransfer.effectAllowed = 'move'; });
  item.addEventListener('pointerdown', e => { item.setPointerCapture?.(e.pointerId); item.classList.add('is-being-dragged'); });
  item.addEventListener('pointerup', e => {
    item.classList.remove('is-being-dragged');
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.visual-target');
    if (target) answer(target.dataset.target);
  });
  targets.forEach(target => {
    target.addEventListener('dragover', e => { e.preventDefault(); target.classList.add('target-hover'); });
    target.addEventListener('dragleave', () => target.classList.remove('target-hover'));
    target.addEventListener('drop', e => { e.preventDefault(); answer(target.dataset.target); });
    target.addEventListener('click', () => answer(target.dataset.target));
  });
}

function generateMissingProblem() {
  const { min, max } = rangeForCurrentMode();
  const start = randomInt(min, max - 2);
  const missingPosition = randomInt(0, 2);
  const values = [start, start + 1, start + 2, start + 3];
  const missingValue = values[missingPosition];
  values[missingPosition] = null;

  return {
    sequence: values,
    missingValue,
    prompt: `Số còn thiếu: ${values.map((value) => value === null ? '—' : value).join(', ')}`,
    options: shuffle([
      missingValue,
      missingValue + 1,
      Math.max(min, missingValue - 1),
      Math.min(max, missingValue + 2)
    ]).filter((value, idx, array) => array.indexOf(value) === idx).slice(0, 4)
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
    button.onclick = () => {
      const selected = Number(button.dataset.answer);
      const isCorrect = Number(button.dataset.answer) === problem.missingValue;
      handleAnswer(isCorrect, selected, problem);
    };
  });
}

function generateListenProblem() {
  const { min, max } = rangeForCurrentMode();
  const lower = Math.max(1, min);
  const number = randomInt(lower, Math.min(max, 10));
  const objectPool = ['🐱', '🐶', '🐰', '🐟', '🦋', '🍎', '🍓', '🚗', '🌼', '⚽'];
  const object = objectPool[randomInt(0, objectPool.length - 1)];
  const counts = shuffle([
    number,
    Math.max(1, number - 1),
    Math.min(10, number + 1),
    number <= 8 ? number + 2 : number - 2
  ]).filter((value, idx, array) => array.indexOf(value) === idx).slice(0, 4);
  while (counts.length < 4) {
    const candidate = randomInt(1, 10);
    if (!counts.includes(candidate)) counts.push(candidate);
  }
  return { number, object, options: shuffle(counts) };
}

function renderListenGame() {
  if (!state.problem || !state.problem.number || !state.problem.object || !state.problem.options) {
    state.problem = generateListenProblem();
  }
  const problem = state.problem;
  const html = `
    <div class="game-surface">
      <div class="question-top">
        <p class="prompt">Nhìn số, chọn nhóm hình có số lượng tương ứng!</p>
        <span class="badge">Bé đếm bằng mắt</span>
      </div>
      <div class="narration-box" style="flex-direction:column; gap:8px;">
        <div class="big-number" aria-label="Số cần tìm">${problem.number}</div>
        <div style="font-size:1.1rem;">👀 Nhìn số rồi chọn nhóm hình có số lượng tương ứng nhé!</div>
      </div>
      <div class="option-grid quantity-picture-options" style="margin-top:18px;">
        ${problem.options.map((count, index) => `
          <button type="button" class="answer-btn quantity-picture-option" data-answer="${count}" data-correct="${count === problem.number}" aria-label="Nhóm có ${count} hình">
            <span class="picture-count" aria-hidden="true">${Array.from({length: count}, () => `<span>${problem.object}</span>`).join('')}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('gameContent').innerHTML = html;
  document.querySelectorAll('.quantity-picture-option').forEach((button) => {
    button.onclick = () => {
      const selected = Number(button.dataset.answer);
      handleAnswer(selected === problem.number, selected, problem);
    };
  });
}

function generateQuantityProblem() {
  const { min, max } = rangeForCurrentMode();
  const number = randomInt(min, max);
  const object = icons[randomInt(0, icons.length - 1)];
  const options = shuffle([
    number,
    Math.max(min, number - 2),
    Math.min(max, number + 2),
    Math.max(min, number - 1)
  ]).filter((value, idx, array) => array.indexOf(value) === idx).slice(0, 4);

  return {
    number,
    object,
    prompt: `Hãy chọn số lượng ${object} đúng bằng ${number}`,
    options
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
    button.onclick = () => {
      const selected = Number(button.dataset.answer);
      const isCorrect = Number(button.dataset.answer) === problem.number;
      handleAnswer(isCorrect, selected, problem);
    };
  });
}

function getCorrectAnswerText(problem) {
  if (state.currentGame === 'listen' && problem && problem.object) return `nhóm có ${problem.number} hình ${problem.object}`;
  if (problem && problem.places) { const place = problem.places.find(p => p.key === problem.correctAnswer); return place ? place.label : 'nơi đúng'; }
  if (state.currentGame === 'counting') {
    return problem.count ?? problem.answer ?? problem.missingValue ?? problem.number ?? 'đáp án đúng';
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

function handleAnswer(isCorrect, selected, problem) {
  if (state.hasAnswered) return;
  state.hasAnswered = true;

  const buttons = document.querySelectorAll('.answer-btn, .target-slot');
  buttons.forEach((button) => {
    const buttonIsCorrect = button.dataset.correct === 'true';
    if (buttonIsCorrect) {
      button.classList.add('correct');
    }
    if (button.dataset.answer === String(selected) && !isCorrect) {
      button.classList.add('wrong');
    }
  });

  if (isCorrect) {
    awardPoints(10);
    addResultBanner('Tuyệt vời! Đáp án đúng! 👏', true);
    playCorrectSound();

  } else {
    addResultBanner(`Mình thử lại nhé! 🌟`, false);
    playWrongSound();

  }

  const replayButton = document.createElement('button');
  replayButton.type = 'button';
  replayButton.className = 'action-btn';
  replayButton.textContent = 'Chơi lại';
  replayButton.style.marginTop = '16px';
  replayButton.onclick = () => {
    reRenderCurrentGame();
  };
  document.getElementById('gameContent').appendChild(replayButton);
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

  const gameTitle = document.getElementById('gameTitle');
  if (gameTitle) {
    gameTitle.textContent = getGameTitle();
  }

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
});

// Âm thanh nhỏ khi trẻ thao tác với trò chơi. Âm đúng/sai được phát riêng trong handleAnswer.
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.matches('.answer-btn, .target-slot, #clockCheckBtn')) return;
  playTapSound();
});


document.addEventListener('click', (event) => {
  if (event.target.closest('.object-item, .object-row, .count-object, .drag-item, .position-object')) {
    playPopSound();
  }
});
