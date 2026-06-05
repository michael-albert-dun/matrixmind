var rows = 3;
var columns = 4;
var colourCount = 4;
var values;
var moveCount;
var selectedTile = null;
var selectedPalette = null;

var colours = ["white", "#f0932b", "#6ab04c", "#e056fd", "#30336b"];

const lowerLeftSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="145.053" height="141.732" viewBox="0 0 145.053 141.732">
<path fill-rule="nonzero" fill="rgb(41.569519%, 69.018555%, 29.804993%)" fill-opacity="1" d="M 68.519531 76.535156 L 125.210938 76.535156 L 125.210938 85.039062 L 139.382812 70.867188 L 125.210938 56.691406 L 125.210938 65.195312 L 79.855469 65.195312 L 79.855469 19.839844 L 88.359375 19.839844 L 74.1875 5.667969 L 60.011719 19.839844 L 68.519531 19.839844 L 68.519531 76.535156 "/>
</svg>
`

const upperRightSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="145.053" height="141.732" viewBox="0 0 145.053 141.732">
<path fill-rule="nonzero" fill="rgb(97.645569%, 79.214478%, 14.118958%)" fill-opacity="1" d="M 79.855469 65.195312 L 23.164062 65.195312 L 23.164062 56.691406 L 8.988281 70.867188 L 23.164062 85.039062 L 23.164062 76.535156 L 68.519531 76.535156 L 68.519531 121.890625 L 60.011719 121.890625 L 74.1875 136.0625 L 88.359375 121.890625 L 79.855469 121.890625 L 79.855469 65.195312 "/>
</svg>`




window.onload = function () {
  intialise();
}


function intialise() {
  moveCount = 0;
  initialiseValues();
  initialiseBoard();
  addPalette();
  addEventListeners();
  // displaySolution();
}

function initialiseValues() {
  values = [];
  for (let r = 0; r < rows; r++) {
    let vrow = [];
    for (let c = 0; c < columns; c++) {
      vrow.push(Math.floor(1 + Math.random() * colourCount));
    }
    values.push(vrow);
  }
}

function initialiseBoard() {
  var display = document.getElementById("main-display");
  display.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      display.appendChild(makeTile(r, c, 0));
    }
  }
}

function addPalette() {
  var palette = document.getElementById("color-palette");
  palette.innerHTML = "";
  for (let i = 1; i < colourCount + 1; i++) {
    let tile = document.createElement("div");
    tile.id = "p-" + i.toString();
    tile.style.backgroundColor = colours[i];
    tile.classList.add("palette-tile");
    tile.innerHTML = i.toString();
    tile.value = i;
    tile.addEventListener("click", chooseColour);
    palette.appendChild(tile);
  }
}

function addEventListeners() {
  document.addEventListener("keyup", (e) => {
    console.log("KeyUp", e.code);
    switch (e.code) {
      case "Enter":
        makeGuess();
        initialiseBoard();
        break;
      case "ArrowRight":
        if (selectedTile != null) {
          let v = (selectedTile.value + 1) % (colourCount + 1);
          setValue(selectedTile, v);
        }
        break;
      case "ArrowLeft":
        if (selectedTile != null) {
          let v = (selectedTile.value + colourCount) % (colourCount + 1);
          setValue(selectedTile, v);
        }
        break;
      case "Digit1":
        if (selectedTile != null) {
          setValue(selectedTile, 1);
        }
        break;
      case "Digit2":
        if (selectedTile != null) {
          setValue(selectedTile, 2);
        }
        break;
      case "Digit3":
        if (selectedTile != null) {
          setValue(selectedTile, 3);
        }
        break;
      case "Digit4":
        if (selectedTile != null) {
          setValue(selectedTile, 4);
        }
        break;
    }
  });
}

function displaySolution() {
  var display = document.getElementById("main-display");
  display.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      display.appendChild(makeTile(r, c, values[r][c]));
    }
  }
}

function makeTile(r, c, value) {
  let tile = document.createElement("div");
  tile.id = r.toString() + "-" + c.toString();
  tile.value = value;
  tile.row = r;
  tile.column = c;
  tile.style.backgroundColor = colours[value];
  tile.classList.add("tile");
  tile.innerHTML = value.toString();
  tile.addEventListener("click", clickTile);
  return tile;
}

function clickTile() {
  if (selectedPalette != null) {
    setValue(this, selectedPalette.value);
  }
  if (this.classList.contains("selected")) {
    this.classList.remove("selected");
    selectedTile = null;
    return;
  }
  if (selectedTile != null) {
    selectedTile.classList.remove("selected");
  }
  selectedTile = this;
  selectedTile.classList.add("selected");
  console.log("Selected", selectedTile.id);
}

function setValue(tile, value) {
  tile.style.backgroundColor = colours[value];
  tile.value = value;
  tile.innerHTML = value.toString();
}



function guessValues() {
  let guess = [];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < columns; c++) {
      row.push(document.getElementById(r.toString() + "-" + c.toString()).value);
    }
    guess.push(row);
  }
  return guess;
}

function guessScore(gv) {
  const score = {
    rowMatches: Array(rows).fill(0),
    columnMatches: Array(columns).fill(0),
    rowNearMatches: Array(rows).fill(0),
    columnNearMatches: Array(columns).fill(0)
  }
  for (let r = 0; r < rows; r++) {
    let rd = rowDistribution(r);
    for (let c = 0; c < columns; c++) {
      if (values[r][c] == gv[r][c]) {
        score.rowMatches[r]++;
        rd[gv[r][c]]--;
      }
    }
    for (let c = 0; c < columns; c++) {
      if (rd[gv[r][c]] > 0 && values[r][c] != gv[r][c]) {
        score.rowNearMatches[r]++;
        rd[gv[r][c]]--;
      }
    }
  }
  for (let c = 0; c < columns; c++) {
    let cd = columnDistribution(c);
    for (let r = 0; r < rows; r++) {
      if (values[r][c] == gv[r][c]) {
        score.columnMatches[c]++;
        cd[gv[r][c]]--;
      }
    }
    for (let r = 0; r < rows; r++) {
      if (cd[gv[r][c]] > 0 && values[r][c] != gv[r][c]) {
        score.columnNearMatches[c]++;
        cd[gv[r][c]]--;
      }
    }
  }
  return score;
}

function rowDistribution(r) {
  let dist = Array(colourCount + 1).fill(0);
  for (let c = 0; c < columns; c++) {
    dist[values[r][c]]++;
  }
  return dist;
}

function columnDistribution(c) {
  let dist = Array(colourCount + 1).fill(0);
  for (let r = 0; r < rows; r++) {
    dist[values[r][c]]++;
  }
  return dist;
}


function chooseColour() {
  if (selectedPalette != null) {
    selectedPalette.classList.remove("selected-palette");
    if (selectedPalette == this) {
      selectedPalette = null;
      return;
    }
  }
  selectedPalette = this;
  selectedPalette.classList.add("selected-palette");
  // if (selectedTile != null) {
  //   setValue(selectedTile, this.value);
  // }
}

function makeGuess() {
  let gv = guessValues();
  let gs = guessScore(gv);
  let guessCorrect = gs.rowMatches.reduce((a, b) => a + b, 0) == columns * rows;
  let guess = document.createElement("div");
  guess.classList.add("guess");
  /* Upper left */
  let corner = document.createElement("div");
  corner.classList.add("corner-score-tile");
  guess.appendChild(corner);
  /* Column near matches */
  for (let c = 0; c < columns; c++) {
    let tile = document.createElement("div");
    tile.classList.add("column-score-tile");
    tile.innerHTML = gs.columnNearMatches[c].toString();
    guess.appendChild(tile);
  }
  /* Upper right */
  corner = document.createElement("div");
  corner.classList.add("corner-score-tile");
  corner.innerHTML = upperRightSVG;
  guess.appendChild(corner);
  for (r = 0; r < rows; r++) {
    let row = document.createElement("div");
    row.classList.add("row-score-tile");
    row.innerHTML = gs.rowMatches[r].toString();
    guess.appendChild(row);
    for (c = 0; c < columns; c++) {
      let tile = document.createElement("div");
      tile.classList.add("guess-tile");
      tile.innerHTML = gv[r][c].toString();
      tile.style.backgroundColor = colours[gv[r][c]];
      guess.appendChild(tile);
    }
    row = document.createElement("div");
    row.classList.add("row-score-tile");
    row.innerHTML = gs.rowNearMatches[r].toString();
    guess.appendChild(row);
  }
  /* Lower left */
  corner = document.createElement("div");
  corner.classList.add("corner-score-tile");
  corner.innerHTML = lowerLeftSVG;
  guess.appendChild(corner);
  for (let c = 0; c < columns; c++) {
    let tile = document.createElement("div");
    tile.classList.add("column-score-tile");
    tile.innerHTML = gs.columnMatches[c].toString();
    guess.appendChild(tile);
  }
  corner = document.createElement("div");
  corner.classList.add("corner-score-tile");
  guess.appendChild(corner);
  if (guessCorrect) {
    guess.style.border = "5px solid limegreen";
  }
  let guess_outer = document.createElement("div");
  guess_outer.classList.add("guess-outer");
  guess_outer.appendChild(guess);
  document.getElementById("guess-display").appendChild(guess_outer);
}




