const visualizer = document.getElementById("visualizer");
const newArrayBtn = document.getElementById("new-array");
const startSortBtn = document.getElementById("start-sort");
const pauseSortBtn = document.getElementById("pause-sort");

const state = {
  array: [],
  originalArray: [],
  size: 30,
  speed: 50,
  status: "idle" | "running" | "completed",
  comparing: [],
  swapping: [],
  sorted: new Set(),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateArray(size) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 300) + 20);
  }
  return arr;
}

function renderArray() {
  visualizer.innerHTML = "";

  for (let i = 0; i < state.array.length; i++) {
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${state.array[i]}px`;

    if (state.sorted.has(i)) {
      bar.style.background = "#43a047"; // green
    } else if (state.swapping.includes(i)) {
      bar.style.background = "#e53935"; // red
    } else if (state.comparing.includes(i)) {
      bar.style.background = "#ffb300"; // yellow
    }

    visualizer.appendChild(bar);
  }
}

function init() {
  const arr = generateArray(state.size);
  state.array = [...arr];
  state.originalArray = [...arr];
  state.sorted.clear();  
  state.status = "idle";
  renderArray();
}


function regenerateArray() {
  if (state.status === "running") return;

  const arr = generateArray(state.size);
  state.array = [...arr];
  state.originalArray = [...arr];
  state.sorted.clear();
  state.status = "idle";
  renderArray();
}
async function waitWhilePaused() {
  while (state.status === "paused") {
    await sleep(50);
  }
}
async function bubbleSort() {
  if (state.status !== "idle") return;

  state.status = "running";
  state.sorted.clear();

  const n = state.array.length;
for (let i = 0; i < n - 1; i++) {

  for (let j = 0; j < n - i - 1; j++) {
    await waitWhilePaused();

    state.comparing = [j, j + 1];
    renderArray();
    await sleep(state.speed);

    if (state.array[j] > state.array[j + 1]) {
      state.swapping = [j, j + 1];

      const temp = state.array[j];
      state.array[j] = state.array[j + 1];
      state.array[j + 1] = temp;

      renderArray();
      await sleep(state.speed);
    }

    state.comparing = [];
    state.swapping = [];
  }

  await waitWhilePaused();
  state.sorted.add(n - i - 1);
  renderArray();
}


  
  state.sorted.add(0);
  renderArray();

  state.status = "completed";
}


startSortBtn.addEventListener("click", bubbleSort);
newArrayBtn.addEventListener("click", regenerateArray);
pauseSortBtn.addEventListener("click", () => {
  if (state.status === "running") {
    state.status = "paused";
    pauseSortBtn.textContent = "Resume";
  } else if (state.status === "paused") {
    state.status = "running";
    pauseSortBtn.textContent = "Pause";
  }
});

init();
