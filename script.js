const maxWrong = 6;
let chosenWord = '';
let guessedLetters = new Set();
let wrongGuesses = 0;
let wins = 0;
let losses = 0;

const wordDiv = document.getElementById('word');
const lettersDiv = document.getElementById('letters');
const messageDiv = document.getElementById('message');
const hintDiv = document.getElementById('hint');
const resetBtn = document.getElementById('reset-btn');
const difficultySelect = document.getElementById('difficulty-select');
const scoreboardDiv = document.getElementById('scoreboard');

const hangmanParts = [
  document.getElementById('head'),
  document.getElementById('body'),
  document.getElementById('left-arm'),
  document.getElementById('right-arm'),
  document.getElementById('left-leg'),
  document.getElementById('right-leg')
];

const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundWin = document.getElementById('sound-win');
const soundLose = document.getElementById('sound-lose');

function loadScores() {
  wins = parseInt(localStorage.getItem('hangmanWins')) || 0;
  losses = parseInt(localStorage.getItem('hangmanLosses')) || 0;
  updateScoreboard();
}
function saveScores() {
  localStorage.setItem('hangmanWins', wins);
  localStorage.setItem('hangmanLosses', losses);
  updateScoreboard();
}
function updateScoreboard() {
  scoreboardDiv.textContent = `Wins: ${wins} | Losses: ${losses}`;
}

async function fetchDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    let data;
    try {
      data = await response.json();
    } catch {
      return 'No definition available.';
    }
    if (Array.isArray(data) && data[0]?.meanings?.length > 0) {
      const defs = data[0].meanings[0].definitions;
      for (const def of defs) {
        if (def.definition) return def.definition;
      }
    }
    return 'No definition found.';
  } catch {
    return 'No definition available.';
  }
}

async function fetchRandomWord(difficulty) {
  let lengthOptions = [];
  if (difficulty === 'easy') lengthOptions = [3, 4];
  else if (difficulty === 'medium') lengthOptions = [5, 6];
  else lengthOptions = [7, 8, 9, 10];

  const randomLength = lengthOptions[Math.floor(Math.random() * lengthOptions.length)];
  const url = `https://random-word-api.herokuapp.com/word?number=1&length=${randomLength}`;

  try {
    const res = await fetch(url);
    let words;
    try {
      words = await res.json();
    } catch {
      return null;
    }
    if (Array.isArray(words) && words.length > 0) {
      const word = words[0].toLowerCase().replace(/[^a-z]/g, '');
      return word;
    }
    return null;
  } catch {
    return null;
  }
}

function updateWordDisplay() {
  let display = '';
  for (const letter of chosenWord) {
    display += guessedLetters.has(letter) ? letter + ' ' : '_ ';
  }
  wordDiv.textContent = display.trim();
}

function createLetterButtons() {
  lettersDiv.innerHTML = '';
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const button = document.createElement('button');
    button.textContent = letter;
    button.classList.add('letter-btn');
    button.addEventListener('click', () => handleGuess(letter.toLowerCase(), button));
    lettersDiv.appendChild(button);
  }
}

function animateHangmanPart(part) {
  part.classList.add('show-part');
}

async function handleGuess(letter, button) {
  button.disabled = true;
  hintDiv.textContent = '';

  if (chosenWord.includes(letter)) {
    guessedLetters.add(letter);
    updateWordDisplay();
    messageDiv.textContent = 'Good guess! 🎉';
    soundCorrect.currentTime = 0;
    soundCorrect.play();

    if ([...chosenWord].every(l => guessedLetters.has(l))) {
      messageDiv.textContent = `🎊 You won! The word was: ${chosenWord}`;
      disableAllButtons();
      wins++;
      saveScores();
      soundWin.currentTime = 0;
      soundWin.play();
    }
  } else {
    wrongGuesses++;
    if (wrongGuesses <= hangmanParts.length) {
      animateHangmanPart(hangmanParts[wrongGuesses - 1]);
    }
    messageDiv.textContent = `Wrong guess! You have ${maxWrong - wrongGuesses} tries left.`;
    soundWrong.currentTime = 0;
    soundWrong.play();

    if (maxWrong - wrongGuesses === 1) {
      messageDiv.textContent += ' Hint loading...';
      const def = await fetchDefinition(chosenWord);
      hintDiv.textContent = `💡 Hint: ${def}`;
    }

    if (wrongGuesses >= maxWrong) {
      messageDiv.textContent = `💀 Game over! The word was: ${chosenWord}`;
      revealWord();
      disableAllButtons();
      losses++;
      saveScores();
      soundLose.currentTime = 0;
      soundLose.play();
    }
  }
}

function disableAllButtons() {
  document.querySelectorAll('.letter-btn').forEach(btn => btn.disabled = true);
}

function revealWord() {
  wordDiv.textContent = chosenWord.split('').join(' ');
}

async function resetGame() {
  messageDiv.textContent = 'Loading word... Please wait.';
  hintDiv.textContent = '';
  guessedLetters.clear();
  wrongGuesses = 0;
  hangmanParts.forEach(part => {
    part.style.visibility = 'hidden';
    part.classList.remove('show-part');
  });
  createLetterButtons();

  const difficulty = difficultySelect.value;
  let word = null;
  for (let i = 0; i < 5; i++) {
    word = await fetchRandomWord(difficulty);
    if (word) break;
  }
  if (!word) {
    messageDiv.textContent = 'Failed to load a word. Please try again.';
    return;
  }
  chosenWord = word;
  updateWordDisplay();
  messageDiv.textContent = `New game started! Difficulty: ${difficulty}`;
}

resetBtn.addEventListener('click', resetGame);
difficultySelect.addEventListener('change', resetGame);

loadScores();
resetGame();
