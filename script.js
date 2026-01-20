/* ---------- DOM ---------- */
const visualizer = document.getElementById("visualizer");
const newArrayBtn = document.getElementById("new-array");
const startSortBtn = document.getElementById("start-sort");
const pauseSortBtn = document.getElementById("pause-sort");
const resetBtn = document.getElementById("stop-sort"); // acts as RESET
const algorithmSelect = document.getElementById("algorithm-select");

const compCountEl = document.getElementById("comp-count");
const swapCountEl = document.getElementById("swap-count");
const writeCountEl = document.getElementById("write-count");
const sizeSlider = document.getElementById("size-slider");
const sizeValue = document.getElementById("size-value");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const timeValueEl = document.getElementById("time-value");

/* ---------- STATE ---------- */
const state = {
  array: [],
  size: 30,
  speed: 50,

  status: "idle", // idle | running | paused | completed
  algorithm: "bubble",

  comparing: [],
  swapping: [],
  sorted: new Set(),
  mergeWriting: null,

  comparisons: 0,
  swaps: 0,
  writes: 0,

  startTime: null,
elapsedTime: 0,
timerInterval: null

};

let mergeSteps = [];

/* ---------- UTILITIES ---------- */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitWhilePaused() {
  while (state.status === "paused") {
    await sleep(50);
  }
}

function generateArray(size) {
  return Array.from(
    { length: size },
    () => Math.floor(Math.random() * 300) + 20,
  );
}
function mapSpeedToDelay(speed) {
  // speed: 1 (slow) → 100 (fast)
  // delay: 200ms → 5ms
  return Math.max(5, 200 - speed * 1.95);
}

function startTimer() {
  state.startTime = performance.now() - state.elapsedTime;

  state.timerInterval = setInterval(() => {
    state.elapsedTime = performance.now() - state.startTime;
    timeValueEl.textContent = (state.elapsedTime / 1000).toFixed(2) + "s";
  }, 50);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function resetTimer() {
  stopTimer();
  state.startTime = null;
  state.elapsedTime = 0;
  timeValueEl.textContent = "0.00s";
}

/* ---------- STATS ---------- */
function updateStats() {
  compCountEl.textContent = state.comparisons;
  swapCountEl.textContent = state.swaps;
  writeCountEl.textContent = state.writes;
}

function resetStats() {
  state.comparisons = 0;
  state.swaps = 0;
  state.writes = 0;
  updateStats();
}

/* ---------- RENDER ---------- */
function renderArray() {
  visualizer.innerHTML = "";

  for (let i = 0; i < state.array.length; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${state.array[i]}px`;

    if (state.sorted.has(i)) bar.style.background = "#43a047";
    else if (state.mergeWriting === i) bar.style.background = "#1e88e5";
    else if (state.swapping.includes(i)) bar.style.background = "#e53935";
    else if (state.comparing.includes(i)) bar.style.background = "#ffb300";

    visualizer.appendChild(bar);
  }
}

/* ---------- INIT ---------- */
function init() {
  state.array = generateArray(state.size);
  state.sorted.clear();
  state.comparing = [];
  state.swapping = [];
  state.mergeWriting = null;
  state.status = "idle";
  resetStats();
  renderArray();
  sizeValue.textContent = state.size;
  state.speed = mapSpeedToDelay(Number(speedSlider.value));
}

function regenerateArray() {
  if (state.status !== "idle") return;
  init();
}

/* ---------- BUBBLE SORT ---------- */
async function bubbleSort() {
  state.status = "running";
  const n = state.array.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      await waitWhilePaused();

      state.comparisons++;
      updateStats();

      state.comparing = [j, j + 1];
      renderArray();
      await sleep(state.speed);

      if (state.array[j] > state.array[j + 1]) {
        state.swaps++;
        updateStats();

        state.swapping = [j, j + 1];
        [state.array[j], state.array[j + 1]] = [
          state.array[j + 1],
          state.array[j],
        ];

        renderArray();
        await sleep(state.speed);
      }

      state.comparing = [];
      state.swapping = [];
    }

    state.sorted.add(n - i - 1);
    renderArray();
  }

  state.sorted.add(0);
  state.status = "completed";
  stopTimer();
}

/* ---------- INSERTION SORT ---------- */
async function insertionSort() {
  state.status = "running";
  const n = state.array.length;

  for (let i = 1; i < n; i++) {
    let key = state.array[i];
    let j = i - 1;

    while (j >= 0 && state.array[j] > key) {
      await waitWhilePaused();

      state.comparisons++;
      state.writes++;
      updateStats();

      state.comparing = [j, j + 1];
      state.swapping = [j + 1];

      state.array[j + 1] = state.array[j];
      renderArray();
      await sleep(state.speed);

      j--;
    }

    await waitWhilePaused();

    state.writes++;
    updateStats();

    state.array[j + 1] = key;
    renderArray();
    await sleep(state.speed);

    state.comparing = [];
    state.swapping = [];
  }

  for (let i = 0; i < n; i++) state.sorted.add(i);
  state.status = "completed";
  stopTimer();
}

/* ---------- SELECTION SORT ---------- */
async function selectionSort() {
  state.status = "running";
  const n = state.array.length;

  for (let i = 0; i < n - 1; i++) {
    let min = i;

    for (let j = i + 1; j < n; j++) {
      await waitWhilePaused();

      state.comparisons++;
      updateStats();

      state.comparing = [min, j];
      renderArray();
      await sleep(state.speed);

      if (state.array[j] < state.array[min]) min = j;
    }

    if (min !== i) {
      state.swaps++;
      updateStats();

      state.swapping = [i, min];
      [state.array[i], state.array[min]] = [state.array[min], state.array[i]];

      renderArray();
      await sleep(state.speed);
    }

    state.sorted.add(i);
    state.comparing = [];
    state.swapping = [];
  }

  state.sorted.add(n - 1);
  state.status = "completed";
  stopTimer();
}

/* ---------- MERGE SORT ---------- */
function merge(arr, l, m, r) {
  const temp = [];
  let i = l,
    j = m + 1;

  while (i <= m && j <= r) {
    temp.push(arr[i] <= arr[j] ? arr[i++] : arr[j++]);
  }
  while (i <= m) temp.push(arr[i++]);
  while (j <= r) temp.push(arr[j++]);

  for (let k = 0; k < temp.length; k++) {
    mergeSteps.push({ index: l + k, value: temp[k] });
    arr[l + k] = temp[k];
  }
}

function mergeSortHelper(arr, l, r) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  mergeSortHelper(arr, l, m);
  mergeSortHelper(arr, m + 1, r);
  merge(arr, l, m, r);
}

async function mergeSort() {
  state.status = "running";
  mergeSteps = [];

  const copy = [...state.array];
  mergeSortHelper(copy, 0, copy.length - 1);

  for (let step of mergeSteps) {
    await waitWhilePaused();

    state.writes++;
    updateStats();

    state.mergeWriting = step.index;
    state.array[step.index] = step.value;
    renderArray();
    await sleep(state.speed);
    state.mergeWriting = null;
  }

  for (let i = 0; i < state.array.length; i++) state.sorted.add(i);
  state.status = "completed";
  stopTimer();
}

/* ---------- CONTROLLER ---------- */
function startSelectedSort() {
  if (state.status !== "idle") return;

  resetStats();
  state.sorted.clear();
  state.comparing = [];
  state.swapping = [];
  state.mergeWriting = null;
resetTimer();
startTimer();

  if (state.algorithm === "bubble") bubbleSort();
  else if (state.algorithm === "insertion") insertionSort();
  else if (state.algorithm === "selection") selectionSort();
  else if (state.algorithm === "merge") mergeSort();
}

/* ---------- EVENTS ---------- */
startSortBtn.addEventListener("click", startSelectedSort);
newArrayBtn.addEventListener("click", regenerateArray);

pauseSortBtn.addEventListener("click", () => {
  if (state.status === "running") {
    state.status = "paused";
    stopTimer();
    pauseSortBtn.textContent = "Resume";
  } else if (state.status === "paused") {
    state.status = "running";
    startTimer();
    pauseSortBtn.textContent = "Pause";
  }
});


resetBtn.addEventListener("click", () => {
  window.location.reload(); // 🔥 HARD RESET
});

algorithmSelect.addEventListener("change", () => {
  if (state.status !== "idle") return;
  state.algorithm = algorithmSelect.value;
  state.sorted.clear();
  state.comparing = [];
  state.swapping = [];
  state.mergeWriting = null;
  renderArray();
});
sizeSlider.addEventListener("input", () => {
  if (state.status !== "idle") return;

  const newSize = Number(sizeSlider.value);
  state.size = newSize;
  sizeValue.textContent = newSize;

  init(); // regenerate array safely
});
speedSlider.addEventListener("input", () => {
  const speed = Number(speedSlider.value);
  state.speed = mapSpeedToDelay(speed);

  if (speed < 30) speedValue.textContent = "Slow";
  else if (speed < 70) speedValue.textContent = "Medium";
  else speedValue.textContent = "Fast";
});

/* ---------- START ---------- */
init();
