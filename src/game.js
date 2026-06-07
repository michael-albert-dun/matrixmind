const BOARD_SIZES = [
  { rows: 2, cols: 3 },
  { rows: 2, cols: 4 },
  { rows: 3, cols: 3 },
  { rows: 3, cols: 4 }
];
const DEFAULT_SETTINGS = {
  rows: 2,
  cols: 3,
  colorCount: 4,
  showCompleteLines: true,
  showColorNumbers: false
};
const ALL_COLORS = [
  { key: "red", label: "Red", value: "#d84b2a" },
  { key: "blue", label: "Blue", value: "#0072b2" },
  { key: "green", label: "Green", value: "#009e73" },
  { key: "yellow", label: "Yellow", value: "#f0d84a" },
  { key: "white", label: "White", value: "#f7f2df" },
  { key: "black", label: "Black", value: "#242129" }
];
const MINI_METRICS = {
  cell: 36,
  peg: 27,
  pip: 6,
  pipGap: 2
};
const LIVE_BOARD_METRICS = {
  cell: 56,
  scoreTrack: 26,
  gap: 10,
  padding: 18
};
const LAYOUT_METRICS = {
  cardPaddingX: 24,
  miniMatrixGap: 6,
  cardBoardGap: 40
};
let ROWS = DEFAULT_SETTINGS.rows;
let COLS = DEFAULT_SETTINGS.cols;
let COLORS = ALL_COLORS.slice(0, DEFAULT_SETTINGS.colorCount);
let SHOW_COMPLETE_LINES = DEFAULT_SETTINGS.showCompleteLines;
let SHOW_COLOR_NUMBERS = DEFAULT_SETTINGS.showColorNumbers;
let splashActive = false;
let splashTimers = [];
const state = {
  secret: [],
  guess: [],
  selectedCell: 0,
  history: [],
  solved: false
};

const SHOULD_RUN_SPLASH = window.location.search === "";

const elements = {
  gameShell: document.querySelector(".game-shell"),
  board: document.querySelector("#board"),
  palette: document.querySelector("#palette"),
  history: document.querySelector("#history"),
  status: document.querySelector("#status"),
  submitButton: document.querySelector("#submit-button"),
  newButton: document.querySelector("#new-button"),
  instructionsButton: document.querySelector("#instructions-button"),
  instructionsDialog: document.querySelector("#instructions-dialog"),
  instructionsCloseButton: document.querySelector("#instructions-close-button"),
  settingsButton: document.querySelector("#settings-button"),
  settingsDialog: document.querySelector("#settings-dialog"),
  settingsForm: document.querySelector("#settings-form"),
  boardSizeSelect: document.querySelector("#board-size-select"),
  colorCountSelect: document.querySelector("#color-count-select"),
  completeLinesSelect: document.querySelector("#complete-lines-select"),
  numberedColorsSelect: document.querySelector("#numbered-colors-select")
};

applyUrlSettings();
syncBoardProperties();
elements.submitButton.addEventListener("click", () => {
  stopSplashAnimation();
  submitGuess();
});
elements.newButton.addEventListener("click", () => {
  stopSplashAnimation();
  startGame();
});
elements.instructionsButton.addEventListener("click", () => {
  stopSplashAnimation();
  openInstructions();
});
elements.instructionsCloseButton.addEventListener("click", closeInstructions);
elements.settingsButton.addEventListener("click", () => {
  stopSplashAnimation();
  openSettings();
});
elements.settingsForm.addEventListener("submit", applySettings);
elements.settingsForm.querySelector("[value='cancel']").addEventListener("click", closeSettings);
window.addEventListener("popstate", () => {
  stopSplashAnimation();
  applyUrlSettings();
  startGame({ updateUrl: false, useUrlSolution: true });
});
document.addEventListener("keydown", handleKeyDown);

startGame({
  updateUrl: !hasUrlSolution(),
  useUrlSolution: true,
  splash: SHOULD_RUN_SPLASH
});

function startGame(options = {}) {
  const { updateUrl = true, useUrlSolution = false, splash = false } = options;
  const urlSecret = useUrlSolution ? secretFromUrl() : null;

  stopSplashAnimation();
  state.secret = urlSecret || makeRandomGrid();
  state.guess = Array.from({ length: ROWS * COLS }, () => null);
  state.selectedCell = 0;
  state.history = [];
  state.solved = false;
  syncBoardProperties();
  syncSettingsControls();
  if (updateUrl || !urlSecret) {
    updateGameUrl();
  }
  render();
  if (splash) {
    startSplashAnimation();
  }
}

function startSplashAnimation() {
  const splashGuess = makeRandomGrid();
  const initialDelay = 840;
  const stepDelay = 520;

  splashActive = true;
  splashGuess.forEach((colorIndex, index) => {
    scheduleSplashStep(() => {
      state.selectedCell = index;
      state.guess[index] = colorIndex;
      render();
    }, initialDelay + index * stepDelay);
  });
  scheduleSplashStep(() => {
    submitGuess({ keepSplashActive: true });
    stopSplashAnimation();
  }, initialDelay + 220 + splashGuess.length * stepDelay);
}

function scheduleSplashStep(callback, delay) {
  const timer = window.setTimeout(() => {
    if (!splashActive) {
      return;
    }

    callback();
  }, delay);

  splashTimers.push(timer);
}

function stopSplashAnimation() {
  splashTimers.forEach((timer) => window.clearTimeout(timer));
  splashTimers = [];
  splashActive = false;
}

function applyUrlSettings() {
  const params = new URLSearchParams(window.location.search);
  const size = parseBoardSize(params.get("size"));
  const colorCount = parseColorCount(params.get("colours") || params.get("colors"));
  const showCompleteLines = parseCompleteLines(params.get("complete"));
  const showColorNumbers = parseColorNumbers(params.get("numbers"));

  ROWS = size.rows;
  COLS = size.cols;
  COLORS = ALL_COLORS.slice(0, colorCount);
  SHOW_COMPLETE_LINES = showCompleteLines;
  SHOW_COLOR_NUMBERS = showColorNumbers;
}

function parseBoardSize(value) {
  const match = /^([23])x([34])$/.exec(value || "");
  const rows = match ? Number(match[1]) : DEFAULT_SETTINGS.rows;
  const cols = match ? Number(match[2]) : DEFAULT_SETTINGS.cols;

  if (BOARD_SIZES.some((size) => size.rows === rows && size.cols === cols)) {
    return { rows, cols };
  }

  return {
    rows: DEFAULT_SETTINGS.rows,
    cols: DEFAULT_SETTINGS.cols
  };
}

function parseColorCount(value) {
  const colorCount = Number(value);

  if (Number.isInteger(colorCount) && colorCount >= 3 && colorCount <= 6) {
    return colorCount;
  }

  return DEFAULT_SETTINGS.colorCount;
}

function parseCompleteLines(value) {
  if (value === "hide") {
    return false;
  }

  if (value === "show") {
    return true;
  }

  return DEFAULT_SETTINGS.showCompleteLines;
}

function parseColorNumbers(value) {
  if (value === "show") {
    return true;
  }

  if (value === "hide") {
    return false;
  }

  return DEFAULT_SETTINGS.showColorNumbers;
}

function syncBoardProperties() {
  elements.board.style.setProperty("--board-cols", String(COLS));
  elements.board.style.setProperty("--board-rows", String(ROWS));
  elements.gameShell.classList.toggle("show-color-numbers", SHOW_COLOR_NUMBERS);
  setLayoutProperties();
}

function syncSettingsControls() {
  elements.boardSizeSelect.value = `${ROWS}x${COLS}`;
  elements.colorCountSelect.value = String(COLORS.length);
  elements.completeLinesSelect.value = SHOW_COMPLETE_LINES ? "show" : "hide";
  elements.numberedColorsSelect.value = SHOW_COLOR_NUMBERS ? "show" : "hide";
}

function openSettings() {
  syncSettingsControls();
  elements.settingsDialog.showModal();
}

function openInstructions() {
  elements.instructionsDialog.showModal();
}

function closeInstructions() {
  elements.instructionsDialog.close();
}

function closeSettings() {
  elements.settingsDialog.close();
}

function applySettings(event) {
  event.preventDefault();

  const size = parseBoardSize(elements.boardSizeSelect.value);
  const colorCount = parseColorCount(elements.colorCountSelect.value);
  const showCompleteLines = parseCompleteLines(elements.completeLinesSelect.value);
  const showColorNumbers = parseColorNumbers(elements.numberedColorsSelect.value);

  ROWS = size.rows;
  COLS = size.cols;
  COLORS = ALL_COLORS.slice(0, colorCount);
  SHOW_COMPLETE_LINES = showCompleteLines;
  SHOW_COLOR_NUMBERS = showColorNumbers;
  closeSettings();
  startGame();
}

function updateGameUrl() {
  const params = new URLSearchParams(window.location.search);

  params.set("size", `${ROWS}x${COLS}`);
  params.set("colours", String(COLORS.length));
  params.set("complete", SHOW_COMPLETE_LINES ? "show" : "hide");
  params.set("numbers", SHOW_COLOR_NUMBERS ? "show" : "hide");
  params.delete("colors");
  params.set("s", encodeSolution(state.secret));
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function hasUrlSolution() {
  return new URLSearchParams(window.location.search).has("s");
}

function secretFromUrl() {
  const encoded = new URLSearchParams(window.location.search).get("s");
  const secret = decodeSolution(encoded);

  if (secret && secret.length === ROWS * COLS && secret.every((colorIndex) => colorIndex < COLORS.length)) {
    return secret;
  }

  return null;
}

function encodeSolution(secret) {
  const digits = secret.join("");
  const bytes = Array.from(digits, (digit, index) =>
    digit.charCodeAt(0) ^ solutionMaskByte(index)
  );

  return binaryToBase64Url(String.fromCharCode(...bytes));
}

function decodeSolution(encoded) {
  if (!encoded) {
    return null;
  }

  try {
    const binary = base64UrlToBinary(encoded);
    const digits = Array.from(binary, (char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ solutionMaskByte(index))
    ).join("");

    if (!/^\d+$/.test(digits)) {
      return null;
    }

    return Array.from(digits, Number);
  } catch {
    return null;
  }
}

function solutionMaskByte(index) {
  let value = (ROWS * 73) ^ (COLS * 151) ^ (COLORS.length * 199) ^ (index * 37) ^ 0x5a;

  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value & 0xff;
}

function binaryToBase64Url(binary) {
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBinary(encoded) {
  const base64 = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");

  return atob(base64);
}

function makeRandomGrid() {
  return Array.from({ length: ROWS * COLS }, () => randomColorIndex());
}

function setLayoutProperties() {
  const boardWidth = liveBoardWidth();
  const boardHeight = liveBoardHeight();
  const cardWidth = scoreCardWidth();
  const shellWidth = 2 * (cardWidth + LAYOUT_METRICS.cardBoardGap + boardWidth / 2);

  elements.gameShell.style.setProperty("--live-board-width", `${boardWidth}px`);
  elements.gameShell.style.setProperty("--live-board-height", `${boardHeight}px`);
  elements.gameShell.style.setProperty("--shell-width", `${Math.ceil(shellWidth)}px`);
}

function liveBoardWidth() {
  const columnCount = COLS + 2;

  return (
    LIVE_BOARD_METRICS.padding * 2 +
    LIVE_BOARD_METRICS.scoreTrack * 2 +
    LIVE_BOARD_METRICS.cell * COLS +
    LIVE_BOARD_METRICS.gap * (columnCount - 1)
  );
}

function liveBoardHeight() {
  const rowCount = ROWS + 2;

  return (
    LIVE_BOARD_METRICS.padding * 2 +
    LIVE_BOARD_METRICS.scoreTrack * 2 +
    LIVE_BOARD_METRICS.cell * ROWS +
    LIVE_BOARD_METRICS.gap * (rowCount - 1)
  );
}

function scoreCardWidth() {
  const rowScoreTrack = scoreTrackSize(COLS, MINI_METRICS);
  const columnCount = COLS + 2;

  return (
    LAYOUT_METRICS.cardPaddingX +
    rowScoreTrack * 2 +
    MINI_METRICS.cell * COLS +
    LAYOUT_METRICS.miniMatrixGap * (columnCount - 1)
  );
}

function render() {
  renderBoard();
  renderPalette();
  renderHistory();
  renderStatus();
}

function renderBoard() {
  elements.board.innerHTML = "";

  elements.board.append(makeBoardCornerGuide());

  for (let col = 0; col < COLS; col += 1) {
    elements.board.append(makeBoardScoreGuide("top"));
  }

  elements.board.append(makeBoardCornerGuide());

  for (let row = 0; row < ROWS; row += 1) {
    elements.board.append(makeBoardScoreGuide("left"));

    for (let col = 0; col < COLS; col += 1) {
      const index = cellIndex(row, col);
      const colorIndex = state.guess[index];
      const button = document.createElement("button");

      button.type = "button";
      button.className = [
        "cell",
        colorIndex === null ? "is-empty" : null,
        index === state.selectedCell ? "is-selected" : null
      ].filter(Boolean).join(" ");
      button.setAttribute("aria-label", cellLabel(index, colorIndex));
      button.addEventListener("click", () => {
        stopSplashAnimation();
        state.selectedCell = index;
        render();
      });

      const peg = document.createElement("span");

      peg.className = "peg";
      peg.setAttribute("aria-hidden", "true");
      if (colorIndex !== null) {
        peg.style.setProperty("--peg-color", COLORS[colorIndex].value);
        peg.dataset.colorNumber = String(colorIndex + 1);
        peg.dataset.colorKey = COLORS[colorIndex].key;
      }
      button.append(peg);
      elements.board.append(button);
    }

    elements.board.append(makeBoardScoreGuide("right"));
  }

  elements.board.append(makeBoardCornerGuide());

  for (let col = 0; col < COLS; col += 1) {
    elements.board.append(makeBoardScoreGuide("bottom"));
  }

  elements.board.append(makeBoardCornerGuide());
}

function makeBoardScoreGuide(side) {
  const guide = document.createElement("div");

  guide.className = `board-score-guide is-${side}`;
  guide.setAttribute("aria-hidden", "true");
  return guide;
}

function makeBoardCornerGuide() {
  const guide = document.createElement("div");

  guide.className = "board-corner-guide";
  guide.setAttribute("aria-hidden", "true");
  return guide;
}

function renderPalette() {
  elements.palette.innerHTML = "";

  COLORS.forEach((color, index) => {
    const button = document.createElement("button");
    const peg = document.createElement("span");

    button.type = "button";
    button.className = "palette-button";
    button.style.setProperty("--peg-color", color.value);
    button.setAttribute("aria-label", color.label);
    button.addEventListener("click", () => {
      setCellColor(state.selectedCell, index);
    });

    peg.className = "peg";
    peg.style.setProperty("--peg-color", color.value);
    peg.dataset.colorNumber = String(index + 1);
    peg.dataset.colorKey = color.key;
    peg.setAttribute("aria-hidden", "true");
    button.append(peg);
    elements.palette.append(button);
  });
}

function renderHistory() {
  elements.history.innerHTML = "";

  state.history.forEach((entry, index) => {
    elements.history.append(makeHistoryItem(entry, index + 1));
  });

  if (!state.solved) {
    elements.history.append(makePendingHistoryItem(state.history.length + 1));
  }
}

function makeHistoryItem(entry, guessNumber) {
  const item = document.createElement("li");
  const card = document.createElement("div");

  item.className = [
    "history-item",
    entry.solved ? "is-solved" : null
  ].filter(Boolean).join(" ");
  card.className = "history-card";
  item.setAttribute("aria-label", `Guess ${guessNumber}`);
  positionHistoryItem(item, guessNumber);
  card.append(
    makeMoveNumber(guessNumber),
    makeMiniMatrix(entry.guess, entry.score, MINI_METRICS)
  );
  item.append(card);
  return item;
}

function makePendingHistoryItem(placementNumber) {
  const item = document.createElement("li");
  const card = document.createElement("div");

  item.className = "history-item is-pending";
  card.className = "history-card";
  item.setAttribute("aria-label", "Current unscored guess");
  positionHistoryItem(item, placementNumber);
  card.append(
    makeMoveNumberSpacer(),
    makeMiniMatrix(state.guess, null, MINI_METRICS)
  );
  item.append(card);
  return item;
}

function positionHistoryItem(item, guessNumber) {
  const anchorRow = 3;

  if (guessNumber < anchorRow) {
    item.style.gridColumn = "1";
    item.style.gridRow = String(guessNumber);
    return;
  }

  const belowIndex = guessNumber - anchorRow;
  const cardsPerBelowRow = 4;

  item.style.gridColumn = String(1 + (belowIndex % cardsPerBelowRow));
  item.style.gridRow = String(anchorRow + Math.floor(belowIndex / cardsPerBelowRow));
}

function renderStatus() {
  if (state.solved) {
    elements.status.textContent = `Solved in ${state.history.length}`;
  } else {
    elements.status.textContent = state.history.length === 0 ? "" : `Guess ${state.history.length + 1}`;
  }

  elements.submitButton.disabled = state.solved || state.guess.some((colorIndex) => colorIndex === null);
}

function makeMoveNumber(guessNumber) {
  const label = document.createElement("span");

  label.className = "move-number";
  label.textContent = guessNumber;
  return label;
}

function makeMoveNumberSpacer() {
  const spacer = document.createElement("span");

  spacer.className = "move-number move-number-spacer";
  spacer.setAttribute("aria-hidden", "true");
  return spacer;
}

function makeMiniMatrix(guess, score, metrics) {
  const matrix = document.createElement("div");

  matrix.className = "mini-matrix";
  matrix.style.setProperty("--matrix-cols", String(COLS));
  matrix.style.setProperty("--matrix-rows", String(ROWS));
  matrix.style.setProperty("--mini-cell", `${metrics.cell}px`);
  matrix.style.setProperty("--mini-peg", `${metrics.peg}px`);
  matrix.style.setProperty("--score-size", `${metrics.pip}px`);
  matrix.style.setProperty("--score-gap", `${metrics.pipGap}px`);
  matrix.style.setProperty("--row-score-track", `${scoreTrackSize(COLS, metrics)}px`);
  matrix.style.setProperty("--column-score-track", `${scoreTrackSize(ROWS, metrics)}px`);
  matrix.append(makeCornerCell());

  for (let col = 0; col < COLS; col += 1) {
    matrix.append(makeScoreCell(0, score?.columns[col].near || 0, ROWS, true, "top"));
  }

  matrix.append(makeCornerCell());

  for (let row = 0; row < ROWS; row += 1) {
    matrix.append(makeScoreCell(score?.rows[row].exact || 0, 0, COLS, false, "left"));

    for (let col = 0; col < COLS; col += 1) {
      matrix.append(makeMiniPeg(guess[cellIndex(row, col)]));
    }

    matrix.append(makeScoreCell(0, score?.rows[row].near || 0, COLS, false, "right"));
  }

  matrix.append(makeCornerCell());

  for (let col = 0; col < COLS; col += 1) {
    matrix.append(makeScoreCell(score?.columns[col].exact || 0, 0, ROWS, true, "bottom"));
  }

  matrix.append(makeCornerCell());
  return matrix;
}

function makeMiniPeg(colorIndex) {
  const cell = document.createElement("div");

  cell.className = "mini-cell";

  if (colorIndex === null) {
    cell.classList.add("is-empty");
    return cell;
  }

  const peg = document.createElement("span");

  peg.className = "mini-peg";
  peg.style.setProperty("--peg-color", COLORS[colorIndex].value);
  peg.dataset.colorNumber = String(colorIndex + 1);
  peg.dataset.colorKey = COLORS[colorIndex].key;
  peg.setAttribute("aria-hidden", "true");
  cell.append(peg);
  return cell;
}

function makeScoreCell(exactCount, nearCount, slots, isColumn, side) {
  const cell = document.createElement("div");
  const pipKinds = scorePipKinds(exactCount, nearCount, slots, side);

  cell.className = [
    "score-cell",
    isColumn ? "is-column" : null,
    side ? `is-${side}` : null
  ].filter(Boolean).join(" ");
  cell.style.setProperty("--score-slots", String(slots));
  cell.setAttribute("aria-label", `${exactCount} exact, ${nearCount} colour only`);

  pipKinds.forEach((kind) => {
    const pip = document.createElement("span");

    pip.className = [
      "score-pip",
      kind ? `is-${kind}` : null
    ].filter(Boolean).join(" ");
    cell.append(pip);
  });

  return cell;
}

function scorePipKinds(exactCount, nearCount, slots, side) {
  const filled = [
    ...Array.from({ length: exactCount }, () => "exact"),
    ...Array.from({ length: nearCount }, () => "near")
  ];
  const empty = Array.from({ length: Math.max(0, slots - filled.length) }, () => null);

  return side === "left" || side === "top" ? [...empty, ...filled] : [...filled, ...empty];
}

function scoreTrackSize(slots, metrics) {
  return slots * metrics.pip + Math.max(0, slots - 1) * metrics.pipGap;
}

function scaleMetrics(metrics, scale) {
  return {
    cell: Math.round(metrics.cell * scale),
    peg: Math.round(metrics.peg * scale),
    pip: Math.round(metrics.pip * scale),
    pipGap: Math.round(metrics.pipGap * scale)
  };
}

function makeCornerCell(label = "") {
  const cell = document.createElement("div");

  cell.className = "corner-cell";
  cell.textContent = label;
  return cell;
}

function setCellColor(index, colorIndex, options = {}) {
  const { advanceSelection = false } = options;

  if (state.solved) {
    return;
  }

  stopSplashAnimation();
  state.guess[index] = colorIndex;

  if (advanceSelection) {
    state.selectedCell = nextOpenCellIndexAfter(index, state.guess);
  }

  render();
}

function submitGuess(options = {}) {
  const { keepSplashActive = false } = options;

  if (!keepSplashActive) {
    stopSplashAnimation();
  }

  if (state.solved || state.guess.some((colorIndex) => colorIndex === null)) {
    return;
  }

  const guess = [...state.guess];
  const score = scoreGuess(guess);
  const solved = score.rows.every((row) => row.exact === COLS);

  state.history.push({ guess, score, solved });
  state.solved = solved;
  state.guess = solved ? Array.from({ length: ROWS * COLS }, () => null) : makeKnownCorrectGuess();
  state.selectedCell = firstOpenCellIndex(state.guess);
  render();
}

function makeKnownCorrectGuess() {
  const nextGuess = Array.from({ length: ROWS * COLS }, () => null);

  if (!SHOW_COMPLETE_LINES) {
    return nextGuess;
  }

  state.history.forEach((entry) => {
    entry.score.rows.forEach((rowScore, row) => {
      if (rowScore.exact !== COLS) {
        return;
      }

      for (let col = 0; col < COLS; col += 1) {
        nextGuess[cellIndex(row, col)] = entry.guess[cellIndex(row, col)];
      }
    });

    entry.score.columns.forEach((columnScore, col) => {
      if (columnScore.exact !== ROWS) {
        return;
      }

      for (let row = 0; row < ROWS; row += 1) {
        nextGuess[cellIndex(row, col)] = entry.guess[cellIndex(row, col)];
      }
    });
  });

  return nextGuess;
}

function firstOpenCellIndex(guess) {
  const emptyIndex = guess.findIndex((colorIndex) => colorIndex === null);

  return emptyIndex === -1 ? 0 : emptyIndex;
}

function nextOpenCellIndexAfter(index, guess) {
  const count = guess.length;

  for (let offset = 1; offset < count; offset += 1) {
    const nextIndex = wrapCellIndex(index + offset);

    if (guess[nextIndex] === null) {
      return nextIndex;
    }
  }

  return index;
}

function scoreGuess(guess) {
  return {
    rows: Array.from({ length: ROWS }, (_, row) =>
      scoreLine(
        rowValues(state.secret, row),
        rowValues(guess, row)
      )
    ),
    columns: Array.from({ length: COLS }, (_, col) =>
      scoreLine(
        columnValues(state.secret, col),
        columnValues(guess, col)
      )
    )
  };
}

function scoreLine(secretLine, guessLine) {
  const secretRemainder = [];
  const guessRemainder = [];
  let exact = 0;
  let near = 0;

  secretLine.forEach((secretColor, index) => {
    if (secretColor === guessLine[index]) {
      exact += 1;
      return;
    }

    secretRemainder.push(secretColor);
    guessRemainder.push(guessLine[index]);
  });

  guessRemainder.forEach((guessColor) => {
    const matchIndex = secretRemainder.indexOf(guessColor);

    if (matchIndex === -1) {
      return;
    }

    near += 1;
    secretRemainder.splice(matchIndex, 1);
  });

  return { exact, near };
}

function handleKeyDown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  stopSplashAnimation();

  if (/^[1-6]$/.test(event.key) && Number(event.key) <= COLORS.length) {
    event.preventDefault();
    setCellColor(state.selectedCell, Number(event.key) - 1, { advanceSelection: true });
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submitGuess();
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    clearSelectedCell();
    return;
  }

  const deltaByKey = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -COLS,
    ArrowDown: COLS
  };
  const delta = deltaByKey[event.key];

  if (delta === undefined) {
    return;
  }

  event.preventDefault();
  state.selectedCell = wrapCellIndex(state.selectedCell + delta);
  render();
}

function rowValues(grid, row) {
  return Array.from({ length: COLS }, (_, col) => grid[cellIndex(row, col)]);
}

function columnValues(grid, col) {
  return Array.from({ length: ROWS }, (_, row) => grid[cellIndex(row, col)]);
}

function clearSelectedCell() {
  if (state.solved) {
    return;
  }

  state.guess[state.selectedCell] = null;
  render();
}

function cellLabel(index, colorIndex) {
  const row = Math.floor(index / COLS) + 1;
  const col = (index % COLS) + 1;

  if (colorIndex === null) {
    return `Empty peg at row ${row}, column ${col}`;
  }

  return `${COLORS[colorIndex].label} peg at row ${row}, column ${col}`;
}

function wrapCellIndex(index) {
  const count = ROWS * COLS;

  return ((index % count) + count) % count;
}

function cellIndex(row, col) {
  return row * COLS + col;
}

function randomColorIndex() {
  return Math.floor(Math.random() * COLORS.length);
}
