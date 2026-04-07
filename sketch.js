const URL = "https://teachablemachine.withgoogle.com/models/42p7-H03g/";

let model, webcam;
let playerCurrentPrediction = "-";
let predictionMap = {
  Rock: 0,
  Paper: 0,
  Scissors: 0
};

let gameStarted = false;
let roundActive = false;
let playerScore = 0;
let computerScore = 0;

const validMoves = ["Rock", "Paper", "Scissors"];

const emojiMap = {
  Rock: "✊",
  Paper: "✋",
  Scissors: "✌️",
  WAITING: "?"
};

const startBtn = document.getElementById("startBtn");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const resetBtn = document.getElementById("resetBtn");

const countdownEl = document.getElementById("countdown");
const playerMoveEl = document.getElementById("playerMove");
const computerMoveEl = document.getElementById("computerMove");
const resultEl = document.getElementById("result");
const playerScoreEl = document.getElementById("playerScore");
const computerScoreEl = document.getElementById("computerScore");
const labelContainer = document.getElementById("label-container");
const webcamContainer = document.getElementById("webcam-container");
const statusPill = document.getElementById("statusPill");

const rockBar = document.getElementById("rockBar");
const paperBar = document.getElementById("paperBar");
const scissorsBar = document.getElementById("scissorsBar");
const rockPct = document.getElementById("rockPct");
const paperPct = document.getElementById("paperPct");
const scissorsPct = document.getElementById("scissorsPct");

const playerEmoji = document.getElementById("playerEmoji");
const computerEmoji = document.getElementById("computerEmoji");
const playerMoveBig = document.getElementById("playerMoveBig");
const computerMoveBig = document.getElementById("computerMoveBig");

const countdownOverlay = document.getElementById("countdownOverlay");
const countdownBig = document.getElementById("countdownBig");
const resultFlash = document.getElementById("resultFlash");
const resultFlashText = document.getElementById("resultFlashText");

function setSystemState(state) {
  webcamContainer.classList.remove(
    "state-idle",
    "state-ready",
    "state-countdown",
    "state-win",
    "state-lose"
  );

  switch (state) {
    case "ready":
      webcamContainer.classList.add("state-ready");
      statusPill.textContent = "READY";
      break;
    case "countdown":
      webcamContainer.classList.add("state-countdown");
      statusPill.textContent = "SCANNING";
      break;
    case "win":
      webcamContainer.classList.add("state-win");
      statusPill.textContent = "YOU WIN";
      break;
    case "lose":
      webcamContainer.classList.add("state-lose");
      statusPill.textContent = "MACHINE WIN";
      break;
    default:
      webcamContainer.classList.add("state-idle");
      statusPill.textContent = "IDLE";
      break;
  }
}

function setGestureDisplay(playerMove = "WAITING", computerMove = "WAITING") {
  playerEmoji.textContent = emojiMap[playerMove] || "?";
  computerEmoji.textContent = emojiMap[computerMove] || "?";
  playerMoveBig.textContent = playerMove.toUpperCase();
  computerMoveBig.textContent = computerMove.toUpperCase();
}

function updateConfidenceBars() {
  rockBar.style.width = `${predictionMap.Rock}%`;
  paperBar.style.width = `${predictionMap.Paper}%`;
  scissorsBar.style.width = `${predictionMap.Scissors}%`;

  rockPct.textContent = `${predictionMap.Rock}%`;
  paperPct.textContent = `${predictionMap.Paper}%`;
  scissorsPct.textContent = `${predictionMap.Scissors}%`;
}

function showCountdownOverlay(text) {
  countdownBig.textContent = text;
  countdownBig.style.animation = "none";
  void countdownBig.offsetWidth;
  countdownBig.style.animation = "pulseCountdown 0.8s ease forwards";
  countdownOverlay.classList.remove("hidden");
}

function hideCountdownOverlay() {
  countdownOverlay.classList.add("hidden");
}

function showResultFlash(type, text) {
  resultFlash.classList.remove("hidden", "flash-win", "flash-lose", "flash-tie");
  resultFlash.classList.add(`flash-${type}`);
  resultFlashText.textContent = text;
  resultFlashText.style.animation = "none";
  void resultFlashText.offsetWidth;
  resultFlashText.style.animation = "resultPop 0.9s ease forwards";
}

function hideResultFlash() {
  resultFlash.classList.add("hidden");
  resultFlash.classList.remove("flash-win", "flash-lose", "flash-tie");
}

async function init() {
  try {
    if (!window.tmImage) {
      throw new Error("tmImage library failed to load");
    }

    labelContainer.innerHTML = "Loading model...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);

    labelContainer.innerHTML = "Model loaded. Requesting camera access...";

    webcam = new tmImage.Webcam(520, 390, true);
    await webcam.setup();
    await webcam.play();

    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    setSystemState("ready");
    labelContainer.innerHTML = "System ready. Show Rock, Paper, or Scissors to the camera.";
    window.requestAnimationFrame(loop);
  } catch (error) {
    console.error(error);
    labelContainer.innerHTML = "Error: " + error.message;
  }
}

async function loop() {
  if (webcam) {
    webcam.update();
    await predict();
  }
  window.requestAnimationFrame(loop);
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);

  let highestProb = 0;
  let bestClass = "-";

  predictionMap = {
    Rock: 0,
    Paper: 0,
    Scissors: 0
  };

  for (let i = 0; i < prediction.length; i++) {
    const className = prediction[i].className;
    const percent = Math.round(prediction[i].probability * 100);

    if (className.toLowerCase().includes("rock")) predictionMap.Rock = percent;
    if (className.toLowerCase().includes("paper")) predictionMap.Paper = percent;
    if (className.toLowerCase().includes("scissor")) predictionMap.Scissors = percent;

    if (prediction[i].probability > highestProb) {
      highestProb = prediction[i].probability;
      bestClass = className;
    }
  }

  updateConfidenceBars();
  playerCurrentPrediction = bestClass;

  labelContainer.innerHTML =
    `Current detection: <strong>${bestClass}</strong> (${(highestProb * 100).toFixed(1)}%)`;
}

function normalizeMove(move) {
  if (!move) return null;
  const lower = move.toLowerCase().trim();

  if (lower.includes("rock")) return "Rock";
  if (lower.includes("paper")) return "Paper";
  if (lower.includes("scissor")) return "Scissors";

  return null;
}

function getComputerMove() {
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

function getWinner(player, computer) {
  if (player === computer) return "Tie";

  if (
    (player === "Rock" && computer === "Scissors") ||
    (player === "Paper" && computer === "Rock") ||
    (player === "Scissors" && computer === "Paper")
  ) {
    return "Win";
  }

  return "Lose";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animatedCountdown() {
  setSystemState("countdown");

  countdownEl.textContent = "Get ready...";
  showCountdownOverlay("3");
  await delay(850);

  countdownEl.textContent = "3";
  showCountdownOverlay("2");
  await delay(850);

  countdownEl.textContent = "2";
  showCountdownOverlay("1");
  await delay(850);

  countdownEl.textContent = "1";
  showCountdownOverlay("GO");
  await delay(900);

  hideCountdownOverlay();
}

async function startRound() {
  if (roundActive) return;

  if (!model || !webcam) {
    resultEl.textContent = "Result: Start the game first";
    return;
  }

  roundActive = true;
  nextRoundBtn.disabled = true;
  hideResultFlash();

  playerMoveEl.textContent = "Your move: -";
  computerMoveEl.textContent = "Computer: -";
  resultEl.textContent = "Result: Waiting...";
  countdownEl.textContent = "Preparing round...";
  setGestureDisplay("WAITING", "WAITING");

  await delay(500);
  await animatedCountdown();

  const playerMove = normalizeMove(playerCurrentPrediction);

  if (!playerMove) {
    countdownEl.textContent = "Could not recognize your move.";
    resultEl.textContent = "Result: Try again";
    setSystemState("ready");
    roundActive = false;
    nextRoundBtn.disabled = false;
    return;
  }

  const computerMove = getComputerMove();
  const winner = getWinner(playerMove, computerMove);

  playerMoveEl.textContent = `Your move: ${playerMove}`;
  computerMoveEl.textContent = `Computer: ${computerMove}`;
  setGestureDisplay(playerMove, computerMove);

  if (winner === "Win") {
    playerScore++;
    resultEl.textContent = "Result: You win this round!";
    countdownEl.textContent = "You got this one!";
    showResultFlash("win", "YOU WIN");
    setSystemState("win");
  } else if (winner === "Lose") {
    computerScore++;
    resultEl.textContent = "Result: Machine wins this round!";
    countdownEl.textContent = "The machine got this one.";
    showResultFlash("lose", "MACHINE WINS");
    setSystemState("lose");
  } else {
    resultEl.textContent = "Result: Tie!";
    countdownEl.textContent = "Same result!";
    showResultFlash("tie", "TIE");
    setSystemState("ready");
  }

  playerScoreEl.textContent = `You: ${playerScore}`;
  computerScoreEl.textContent = `Machine: ${computerScore}`;

  await delay(1100);
  hideResultFlash();

  if (playerScore >= 5) {
    countdownEl.textContent = "Final result: You won!";
    nextRoundBtn.disabled = true;
    roundActive = false;
    return;
  }

  if (computerScore >= 5) {
    countdownEl.textContent = "Final result: Machine won!";
    nextRoundBtn.disabled = true;
    roundActive = false;
    return;
  }

  countdownEl.textContent = "Round complete. Ready again.";
  nextRoundBtn.disabled = false;
  roundActive = false;

  if (winner !== "Win" && winner !== "Lose") {
    setSystemState("ready");
  }
}

startBtn.addEventListener("click", async () => {
  if (!gameStarted) {
    await init();
    gameStarted = true;
  }
  await startRound();
});

nextRoundBtn.addEventListener("click", async () => {
  await startRound();
});

resetBtn.addEventListener("click", () => {
  playerScore = 0;
  computerScore = 0;
  roundActive = false;
  hideResultFlash();
  hideCountdownOverlay();

  playerScoreEl.textContent = "You: 0";
  computerScoreEl.textContent = "Machine: 0";
  countdownEl.textContent = "Press Start";
  playerMoveEl.textContent = "Your move: -";
  computerMoveEl.textContent = "Computer: -";
  resultEl.textContent = "Result: -";
  nextRoundBtn.disabled = true;

  setGestureDisplay("WAITING", "WAITING");
  setSystemState(webcam ? "ready" : "idle");

  predictionMap = {
    Rock: 0,
    Paper: 0,
    Scissors: 0
  };
  updateConfidenceBars();
});