class Element {
    constructor(emoji, number) {
        this.emoji = emoji;
        this.number = number;
    }
}

class Equation {
  constructor(stringEquation, result) {
      this.stringEquation = stringEquation;
      this.result = result;
  }
}

const emojiz = ['🍎', '🍌', '🍇', '🥝', '🍉', '🍊', '🍋', '🍏', '🍐', '🥕']
const MIN_VALUE = 1
const MAX_VALUE = 10
const MIN_RESULT = 1
const MAX_RESULT = 20
var quizElements = new Map()
var equationsMap = new Map()

const selectQuizEmojiz = () => {
  let indexes = []
  while (indexes.length < 3) {
    let randomIndex = Math.floor(Math.random() * emojiz.length)
    if (!indexes.includes(randomIndex)) {
      indexes.push(randomIndex)
    }
  }
  return indexes
}

const initiateQuizElements = (emojiIndexes) => {
  for (let i = 0; i < emojiIndexes.length; i++) {
    let number = Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE
    quizElements.set(i, new Element(emojiz[emojiIndexes[i]], number))
  }
}

const randomOperation = () => Math.random() > 0.5 ? '+' : '-'

const applyOperation = (left, operation, right) => operation === '+' ? left + right : left - right

const generateEquations = () => {
  const first = quizElements.get(0)
  const second = quizElements.get(1)
  const third = quizElements.get(2)

  const operation1 = randomOperation()
  const operation2 = randomOperation()
  const operation3 = randomOperation()

  const sum1 = first.number * 3
  const sum2 = applyOperation(second.number * 2, operation1, first.number)
  const sum3 = applyOperation(applyOperation(third.number, operation2, first.number), operation3, second.number)

  const equations = [
    `${first.emoji} + ${first.emoji} + ${first.emoji} = ${sum1}`,
    `${second.emoji} + ${second.emoji} ${operation1} ${first.emoji} = ${sum2}`,
    `${third.emoji} ${operation2} ${first.emoji} ${operation3} ${second.emoji} = ${sum3}`
  ]
  const results = [sum1, sum2, sum3]

  return { equations, results }
}

const isAllowedResult = (result) => result >= MIN_RESULT && result <= MAX_RESULT

const generateAllowedEquations = (emojiIndexes) => {
  while (true) {
    initiateQuizElements(emojiIndexes)
    const generated = generateEquations()
    if (generated.results.every(isAllowedResult)) {
      return generated
    }
  }
}

const populateEquations = (equations, results) => {
  for (let i = 0; i < equations.length; i++) {
    equationsMap.set(i, new Equation(equations[i], results[i]))
  }
}

const insertEquationsIntoDOM = (equationsMap) => {
  const container = document.getElementById('fruit-equations');
  const listFragment = document.createDocumentFragment();
  equationsMap.forEach((equation) => {
      const li = document.createElement('li');
      li.textContent = equation.stringEquation;
      listFragment.appendChild(li);
  });
  container.innerHTML = '';
  container.appendChild(listFragment);
}

insertEquationControlsIntoDOM = (quizElements) => {
  const container = document.getElementById('fruit-control');

  const fragment = document.createDocumentFragment();

  quizElements.forEach((element, index) => {
    const emoji = element.emoji;

    const div = document.createElement('div');
    div.className = 'input-group has-validation input-group-lg mb-3';
    const span = document.createElement('span');
    span.className = 'input-group-text';
    span.textContent = `${emoji} =`;
    const input = document.createElement('input');
    input.id = `fruit-${index}`;
    input.type = 'number';
    input.className = 'form-control';
    input.setAttribute('aria-label', emoji);
    input.setAttribute('aria-describedby', 'addon-wrapping');
    input.inputMode = 'numeric';
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('enterkeyhint', index === quizElements.size - 1 ? 'done' : 'next');
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
  button.className = 'btn btn-lg btn-primary';
  button.textContent = 'Перевірити відповідь ⚡️';

  button.onclick = function() { checkResults(); };

  fragment.appendChild(button);

  container.innerHTML = '';
  container.appendChild(fragment);
}

const handleGenerateProblemClick = () => {
  document.getElementById('welcome').classList.add('d-none');
  document.getElementById('fruit-problem').classList.remove('d-none');

  const indexes = selectQuizEmojiz()
  const { equations, results } = generateAllowedEquations(indexes)
  populateEquations(equations, results)
  insertEquationsIntoDOM(equationsMap)
  insertEquationControlsIntoDOM(quizElements)
}

const showGenerateAgainButton = () => {
  const container = document.getElementById('fruit-control');

  const fragment = document.createDocumentFragment();

  const button = document.createElement('button');
  button.id = 'next-problem-button';
  button.className = 'btn btn-lg btn-success';
  button.textContent = 'Наступне завдання 🚀';

  button.onclick = function() { handleGenerateProblemClick(); };

  fragment.appendChild(button);
  container.appendChild(fragment);
}

const checkResults = () => {
  quizElements.forEach((element, index) => {
    const input = document.querySelector(`#fruit-${index}`);
    const userInput = parseInt(input.value, 10);
    
    const feedbackId = `feedback-${index}`;
    let feedbackElement = document.getElementById(feedbackId);

    if (feedbackElement) {
      input.classList.remove('is-valid', 'is-invalid');
      feedbackElement.remove();
    }

    feedbackElement = document.createElement('div');
    feedbackElement.id = feedbackId;

    if (userInput === element.number) {
        input.classList.add('is-valid');
    } else {
        input.classList.add('is-invalid');

        feedbackElement.textContent = `Правильна відповідь: ${element.number}`;
        feedbackElement.className = 'invalid-feedback';
    }

    input.parentNode.appendChild(feedbackElement);
    input.disabled = true;
  });


  showGenerateAgainButton();
  const checkResultsButton = document.getElementById('check-problem-results');
  checkResultsButton.classList.add('d-none');
  if (document.activeElement) document.activeElement.blur();
  document.getElementById('next-problem-button').scrollIntoView({ block: 'nearest' });
}

