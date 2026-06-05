const ROWS = 3;
const COLS = 4;
const COLORS = [
  { key: "orange", label: "Orange", value: "#e69f00" },
  { key: "sky", label: "Sky blue", value: "#56b4e9" },
  { key: "green", label: "Bluish green", value: "#009e73" },
  { key: "purple", label: "Reddish purple", value: "#cc79a7" }
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
const state = {
  secret: [],
  guess: [],
  selectedCell: 0,
  history: [],
  solved: false
};

const elements = {
  gameShell: document.querySelector(".game-shell"),
  board: document.querySelector("#board"),
  palette: document.querySelector("#palette"),
  history: document.querySelector("#history"),
  status: document.querySelector("#status"),
  submitButton: document.querySelector("#submit-button"),
  newButton: document.querySelector("#new-button")
};

elements.board.style.setProperty("--board-cols", String(COLS));
elements.board.style.setProperty("--board-rows", String(ROWS));
setLayoutProperties();
elements.submitButton.addEventListener("click", submitGuess);
elements.newButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyDown);

startGame();

function startGame() {
  state.secret = makeRandomGrid();
  state.guess = Array.from({ length: ROWS * COLS }, () => null);
  state.selectedCell = 0;
  state.history = [];
  state.solved = false;
  render();
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
        state.selectedCell = index;
        render();
      });

      const peg = document.createElement("span");

      peg.className = "peg";
      peg.setAttribute("aria-hidden", "true");
      if (colorIndex !== null) {
        peg.style.setProperty("--peg-color", COLORS[colorIndex].value);
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
  card.append(makeMiniMatrix(state.guess, null, MINI_METRICS));
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

function setCellColor(index, colorIndex) {
  if (state.solved) {
    return;
  }

  state.guess[index] = colorIndex;
  render();
}

function submitGuess() {
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

  if (/^[1-4]$/.test(event.key)) {
    event.preventDefault();
    setCellColor(state.selectedCell, Number(event.key) - 1);
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
