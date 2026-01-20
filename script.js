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
const docEls = {
  name: document.getElementById("current-algo-name"),
  type: document.getElementById("algo-type"),

  best: document.getElementById("complexity-best"),
  avg: document.getElementById("complexity-avg"),
  worst: document.getElementById("complexity-worst"),
  space: document.getElementById("complexity-space"),
  stable: document.getElementById("is-stable"),
  inplace: document.getElementById("is-inplace"),

  desc: document.getElementById("algo-desc"),
  steps: document.getElementById("algo-steps"),
  uses: document.getElementById("algo-uses"),
  avoid: document.getElementById("algo-avoid"),
  pros: document.getElementById("algo-pros"),
  cons: document.getElementById("algo-cons")
};

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
  pivotIndex: null,

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
function renderAlgorithmDocs(algoKey) {
  const doc = algorithmDocs[algoKey];
  if (!doc) return;

  docEls.name.textContent = doc.name;
  docEls.type.textContent = doc.type;

  docEls.best.textContent = doc.complexity.best;
  docEls.avg.textContent = doc.complexity.avg;
  docEls.worst.textContent = doc.complexity.worst;
  docEls.space.textContent = doc.complexity.space;
  docEls.stable.textContent = doc.complexity.stable;
  docEls.inplace.textContent = doc.complexity.inplace;

  docEls.desc.textContent = doc.description;

  // Helper to render lists
  const fillList = (el, items) => {
    el.innerHTML = "";
    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      el.appendChild(li);
    });
  };

  fillList(docEls.steps, doc.steps);
  fillList(docEls.uses, doc.uses);
  fillList(docEls.avoid, doc.avoid);
  fillList(docEls.pros, doc.pros);
  fillList(docEls.cons, doc.cons);
}

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
    else if (state.pivotIndex === i) {
  bar.style.background = "#8e24aa"; // purple pivot
}

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
  renderAlgorithmDocs(state.algorithm);

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
async function partition(low, high) {
  // 🔀 Random pivot selection
  const randomIndex =
    Math.floor(Math.random() * (high - low + 1)) + low;

  if (randomIndex !== high) {
    state.swaps++;
    updateStats();

    state.swapping = [randomIndex, high];
    [state.array[randomIndex], state.array[high]] =
      [state.array[high], state.array[randomIndex]];

    renderArray();
    await sleep(state.speed);
  }

  const pivot = state.array[high];
  state.pivotIndex = high;

  let i = low;

  for (let j = low; j < high; j++) {
    await waitWhilePaused();

    state.comparisons++;
    updateStats();

    state.comparing = [j, high];
    renderArray();
    await sleep(state.speed);

    if (state.array[j] < pivot) {
      if (i !== j) {
        state.swaps++;
        updateStats();

        state.swapping = [i, j];
        [state.array[i], state.array[j]] =
          [state.array[j], state.array[i]];

        renderArray();
        await sleep(state.speed);
      }
      i++;
    }

    state.comparing = [];
    state.swapping = [];
  }

  // Place pivot in correct position
  if (i !== high) {
    state.swaps++;
    updateStats();

    state.swapping = [i, high];
    [state.array[i], state.array[high]] =
      [state.array[high], state.array[i]];

    renderArray();
    await sleep(state.speed);
  }

  state.pivotIndex = null;
  return i;
}

async function quickSortHelper(low, high) {
  if (low >= high) return;

  const pivotPos = await partition(low, high);

  await quickSortHelper(low, pivotPos - 1);
  await quickSortHelper(pivotPos + 1, high);
}

async function quickSort() {
  state.status = "running";

  await quickSortHelper(0, state.array.length - 1);

  for (let i = 0; i < state.array.length; i++) {
    state.sorted.add(i);
  }

  state.status = "completed";
  stopTimer();
  renderArray();
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
  else if (state.algorithm === "quick") quickSort();

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
algorithmSelect.addEventListener("change", () => {
  if (state.status !== "idle") return;

  state.algorithm = algorithmSelect.value;

  renderAlgorithmDocs(state.algorithm);

  state.sorted.clear();
  state.comparing = [];
  state.swapping = [];
  state.mergeWriting = null;

  renderArray();
});

/* ---------- START ---------- */

const algorithmDocs = {
  bubble: {
    name: "Bubble Sort",
    type: "Comparison Sort",

    complexity: {
      best: "O(n)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      stable: "Yes",
      inplace: "Yes"
    },

    description:
      "Bubble Sort is a simple comparison-based algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.",

    steps: [
      "Start at the beginning of the array",
      "Compare adjacent elements",
      "Swap them if they are in the wrong order",
      "The largest element moves to the end in each pass",
      "Repeat for the remaining unsorted portion",
      "Stop when no swaps occur in a full pass"
    ],

    uses: [
      "Educational purposes",
      "Very small datasets",
      "Nearly sorted data",
      "When simplicity matters more than performance"
    ],

    avoid: [
      "Large datasets",
      "Performance-critical applications",
      "Real-time systems",
      "Production-scale sorting"
    ],

    pros: [
      "Very easy to understand",
      "In-place sorting",
      "Stable algorithm",
      "Can detect already sorted arrays"
    ],

    cons: [
      "Extremely slow for large inputs",
      "O(n²) time complexity",
      "Unnecessary comparisons",
      "Not practical for real-world use"
    ]
  },

  insertion: {
    name: "Insertion Sort",
    type: "Comparison Sort",

    complexity: {
      best: "O(n)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      stable: "Yes",
      inplace: "Yes"
    },

    description:
      "Insertion Sort builds the sorted array one element at a time by inserting each element into its correct position among the previously sorted elements.",

    steps: [
      "Start from the second element",
      "Compare it with elements before it",
      "Shift larger elements one position right",
      "Insert the element at the correct position",
      "Repeat for all elements"
    ],

    uses: [
      "Small datasets",
      "Nearly sorted arrays",
      "Online sorting (streaming data)",
      "When memory usage must be minimal"
    ],

    avoid: [
      "Large datasets",
      "Highly unsorted data",
      "Performance-critical systems"
    ],

    pros: [
      "Efficient for nearly sorted data",
      "Stable algorithm",
      "In-place sorting",
      "Simple implementation"
    ],

    cons: [
      "O(n²) worst-case time",
      "Slow for large datasets",
      "Not suitable for large-scale applications"
    ]
  },

  selection: {
    name: "Selection Sort",
    type: "Comparison Sort",

    complexity: {
      best: "O(n²)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      stable: "No",
      inplace: "Yes"
    },

    description:
      "Selection Sort repeatedly selects the smallest element from the unsorted portion and places it at the beginning.",

    steps: [
      "Find the minimum element in the array",
      "Swap it with the first unsorted element",
      "Move the boundary of sorted/unsorted",
      "Repeat until array is sorted"
    ],

    uses: [
      "Educational purposes",
      "Small datasets",
      "When swap count must be minimized"
    ],

    avoid: [
      "Large datasets",
      "Time-sensitive applications"
    ],

    pros: [
      "Simple to understand",
      "Minimal number of swaps",
      "In-place sorting"
    ],

    cons: [
      "Always O(n²)",
      "Not stable",
      "Poor performance"
    ]
  },
  quick: {
  name: "Quick Sort",
  type: "Divide and Conquer",

  complexity: {
    best: "O(n log n)",
    avg: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
    stable: "No",
    inplace: "Yes"
  },

  description:
    "Quick Sort is a divide-and-conquer algorithm that selects a pivot element and partitions the array around the pivot, placing smaller elements before it and larger elements after it.",

  steps: [
    "Choose a pivot element",
    "Partition the array around the pivot",
    "Elements smaller than pivot go left",
    "Elements larger than pivot go right",
    "Recursively apply to left and right subarrays"
  ],

  uses: [
    "Large datasets",
    "General-purpose sorting",
    "Performance-critical applications"
  ],

  avoid: [
    "When stability is required",
    "Worst-case sensitive systems",
    "Already sorted data without random pivot"
  ],

  pros: [
    "Very fast in practice",
    "In-place sorting",
    "Good cache performance"
  ],

  cons: [
    "Worst-case O(n²)",
    "Not stable",
    "Performance depends on pivot choice"
  ]
},


  merge: {
    name: "Merge Sort",
    type: "Divide and Conquer",

    complexity: {
      best: "O(n log n)",
      avg: "O(n log n)",
      worst: "O(n log n)",
      space: "O(n)",
      stable: "Yes",
      inplace: "No"
    },

    description:
      "Merge Sort divides the array into halves, sorts them recursively, and then merges the sorted halves.",

    steps: [
      "Divide the array into two halves",
      "Recursively sort each half",
      "Merge the sorted halves",
      "Repeat until fully sorted"
    ],

    uses: [
      "Large datasets",
      "Stable sorting requirement",
      "Linked lists",
      "External sorting"
    ],

    avoid: [
      "Memory-constrained systems",
      "In-place sorting requirements"
    ],

    pros: [
      "Guaranteed O(n log n)",
      "Stable algorithm",
      "Excellent for large datasets"
    ],

    cons: [
      "Requires extra memory",
      "Slower than Quick Sort in practice"
    ]
  }
};
init();