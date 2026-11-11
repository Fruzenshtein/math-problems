class QuizItem {
  constructor(emoji, number) {
    this.emoji = emoji;
    this.number = number;
  }
}

class Equation {
  constructor(text, result) {
    this.text = text;
    this.result = result;
  }
}

const EMOJIS = ['🍎', '🍌', '🍇', '🥝', '🍉', '🍊', '🍋', '🍏', '🍐', '🥕'];
const LEVELS = [
  { id: 1, name: 'Легкий', description: '3 фрукти, числа до 5, лише додавання', fruits: 3, minValue: 1, maxValue: 5, minResult: 1, maxResult: 10, operations: ['+'] },
  { id: 2, name: 'Середній', description: '3 фрукти, числа до 10, плюс і мінус', fruits: 3, minValue: 1, maxValue: 10, minResult: 1, maxResult: 20, operations: ['+', '−'] },
  { id: 3, name: 'Складний', description: '3 фрукти, числа до 20, результати до 50', fruits: 3, minValue: 1, maxValue: 20, minResult: 1, maxResult: 50, operations: ['+', '−'] },
  { id: 4, name: 'Експерт', description: '4 фрукти, 4 рівняння, числа до 20', fruits: 4, minValue: 1, maxValue: 20, minResult: 1, maxResult: 50, operations: ['+', '−'] },
  { id: 5, name: 'Майстер', description: '5 фруктів, 5 рівнянь, множення', fruits: 5, minValue: 1, maxValue: 10, minResult: 1, maxResult: 100, operations: ['+', '−', '×'] }
];
const MAX_ATTEMPTS = 5000;
const STORAGE_KEY = 'fruit-math:level';

let currentLevel = LEVELS[0];
let quizItems = [];
let equations = [];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (list) => list[randomInt(0, list.length - 1)];

const shuffle = (list) => {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const selectEmojis = (count) => shuffle(EMOJIS).slice(0, count);

const createQuizItems = (level, emojis) =>
  emojis.map((emoji) => new QuizItem(emoji, randomInt(level.minValue, level.maxValue)));

const evaluateExpression = (values, operations) => {
  let total = 0;
  let term = values[0];
  let sign = 1;
  operations.forEach((operation, i) => {
    const value = values[i + 1];
    if (operation === '×') {
      term *= value;
    } else {
      total += sign * term;
      sign = operation === '+' ? 1 : -1;
      term = value;
    }
  });
  return total + sign * term;
};

const buildEquation = (items, indexes, operations) => {
  const values = indexes.map((i) => items[i].number);
  const result = evaluateExpression(values, operations);
  const parts = [items[indexes[0]].emoji];
  operations.forEach((operation, k) => {
    parts.push(operation, items[indexes[k + 1]].emoji);
  });
  return new Equation(`${parts.join(' ')} = ${result}`, result);
};

const planEquation = (level, position, forcedOperation) => {
  const operation = () => forcedOperation || pick(level.operations);
  if (position === 0) {
    return level.operations.includes('×') && !forcedOperation
      ? { indexes: [0, 0], operations: ['×'] }
      : { indexes: [0, 0, 0], operations: ['+', '+'] };
  }
  if (position === 1) {
    return { indexes: [1, 1, 0], operations: ['+', operation()] };
  }
  const known = Array.from({ length: position }, (_, i) => i);
  const first = pick(known);
  const second = pick(known.filter((i) => i !== first));
  return { indexes: [position, first, second], operations: [operation(), operation()] };
};

const buildTask = (level, items, forcedOperation) =>
  Array.from({ length: level.fruits }, (_, position) => {
    const plan = planEquation(level, position, forcedOperation);
    return buildEquation(items, plan.indexes, plan.operations);
  });

const isAllowedResult = (level, result) => result >= level.minResult && result <= level.maxResult;

const generateTask = (level) => {
  const emojis = selectEmojis(level.fruits);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const items = createQuizItems(level, emojis);
    const built = buildTask(level, items);
    if (built.every((equation) => isAllowedResult(level, equation.result))) {
      return { items, equations: built };
    }
  }
  const items = emojis.map((emoji) => new QuizItem(emoji, level.minValue));
  return { items, equations: buildTask(level, items, '+') };
};

const readStoredLevel = () => {
  try {
    const id = Number(localStorage.getItem(STORAGE_KEY));
    return LEVELS.find((level) => level.id === id) || LEVELS[0];
  } catch (_) {
    return LEVELS[0];
  }
};

const storeLevel = (level) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(level.id));
  } catch (_) {}
};

const renderLevelButtons = () => {
  const container = document.getElementById('level-list');
  const fragment = document.createDocumentFragment();
  LEVELS.forEach((level) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-lg level-btn ${level === currentLevel ? 'btn-primary' : 'btn-outline-primary'}`;
    const title = document.createElement('strong');
    title.textContent = `${level.id} · ${level.name}`;
    const description = document.createElement('small');
    description.textContent = level.description;
    button.appendChild(title);
    button.appendChild(description);
    button.onclick = () => startLevel(level);
    fragment.appendChild(button);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
};

const insertEquationsIntoDOM = () => {
  const container = document.getElementById('fruit-equations');
  const fragment = document.createDocumentFragment();
  equations.forEach((equation) => {
    const li = document.createElement('li');
    li.textContent = equation.text;
    fragment.appendChild(li);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
};

const insertEquationControlsIntoDOM = () => {
  const container = document.getElementById('fruit-control');
  const fragment = document.createDocumentFragment();

  quizItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'input-group has-validation input-group-lg mb-3';
    const span = document.createElement('span');
    span.className = 'input-group-text';
    span.textContent = `${item.emoji} =`;
    const input = document.createElement('input');
    input.id = `fruit-${index}`;
    input.type = 'number';
    input.className = 'form-control';
    input.setAttribute('aria-label', item.emoji);
    input.inputMode = 'numeric';
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('enterkeyhint', index === quizItems.length - 1 ? 'done' : 'next');
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const nextInput = document.getElementById(`fruit-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      } else {
        checkResults();
      }
    });

    div.appendChild(span);
    div.appendChild(input);
    fragment.appendChild(div);
  });

  const button = document.createElement('button');
  button.id = 'check-problem-results';
  button.type = 'button';
  button.className = 'btn btn-lg btn-primary';
  button.textContent = 'Перевірити відповідь ⚡️';
  button.onclick = () => checkResults();
  fragment.appendChild(button);

  container.innerHTML = '';
  container.appendChild(fragment);
};

const showGenerateAgainButton = () => {
  const container = document.getElementById('fruit-control');
  const button = document.createElement('button');
  button.id = 'next-problem-button';
  button.type = 'button';
  button.className = 'btn btn-lg btn-success';
  button.textContent = 'Наступне завдання 🚀';
  button.onclick = () => newTask();
  container.appendChild(button);
};

const newTask = () => {
  const task = generateTask(currentLevel);
  quizItems = task.items;
  equations = task.equations;
  document.getElementById('level-badge').textContent = `Рівень ${currentLevel.id} · ${currentLevel.name}`;
  insertEquationsIntoDOM();
  insertEquationControlsIntoDOM();
  window.scrollTo(0, 0);
};

const startLevel = (level) => {
  currentLevel = level;
  storeLevel(level);
  document.getElementById('welcome').classList.add('d-none');
  document.getElementById('fruit-problem').classList.remove('d-none');
  newTask();
};

const showLevels = () => {
  renderLevelButtons();
  document.getElementById('fruit-problem').classList.add('d-none');
  document.getElementById('welcome').classList.remove('d-none');
  window.scrollTo(0, 0);
};

const checkResults = () => {
  if (document.getElementById('next-problem-button')) return;

  quizItems.forEach((item, index) => {
    const input = document.getElementById(`fruit-${index}`);
    const userInput = parseInt(input.value, 10);

    if (userInput === item.number) {
      input.classList.add('is-valid');
    } else {
      input.classList.add('is-invalid');
      const feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      feedback.textContent = `Правильна відповідь: ${item.number}`;
      input.parentNode.appendChild(feedback);
    }
    input.disabled = true;
  });

  document.getElementById('check-problem-results').classList.add('d-none');
  showGenerateAgainButton();
  if (document.activeElement) document.activeElement.blur();
  document.getElementById('next-problem-button').scrollIntoView({ block: 'nearest' });
};

document.getElementById('change-level').addEventListener('click', showLevels);

currentLevel = readStoredLevel();
renderLevelButtons();
