const state = {
  names: ["SPPG", "PEMDES"],
  points: [0, 0],
  sets: [0, 0],
  setNumber: 1,
  pointHistory: [],
  setHistory: [],
  generalHistory: [],
  seconds: 0,
  running: false
};
const $ = id => document.getElementById(id);
let clockInterval = null;

function pointSnapshot() {
  return { points: [...state.points] };
}
function setSnapshot() {
  return { sets: [...state.sets], setNumber: state.setNumber };
}
function savePointUndo() {
  state.pointHistory.push(pointSnapshot());
  if (state.pointHistory.length > 100) state.pointHistory.shift();
}
function saveSetUndo() {
  state.setHistory.push(setSnapshot());
  if (state.setHistory.length > 100) state.setHistory.shift();
}
function render() {
  $("nameA").textContent = $("captionA").textContent = $("setLabelA").textContent = state.names[0];
  $("nameB").textContent = $("captionB").textContent = $("setLabelB").textContent = state.names[1];
  $("scoreA").textContent = String(state.points[0]).padStart(2, "0");
  $("scoreB").textContent = String(state.points[1]).padStart(2, "0");
  $("setsA").textContent = state.sets[0];
  $("setsB").textContent = state.sets[1];
  $("setIndicator").textContent = `SET ${state.setNumber}`;
}
function status(message) { $("status").textContent = message; }

function addPoint(team) {
  if (state.points[team] >= 99) {
    status(`Poin ${state.names[team]} sudah mencapai batas 99.`);
    return;
  }
  savePointUndo();
  state.points[team]++;
  render();
  startClock();
  status(`Poin ${state.names[team]}: ${String(state.points[team]).padStart(2, "0")}`);
}
function undoPoints() {
  if (!state.pointHistory.length) {
    status("Belum ada perubahan poin pertandingan untuk di-undo.");
    return;
  }
  state.points = state.pointHistory.pop().points;
  render();
  status("Undo poin berhasil. Kemenangan set tidak berubah.");
}
function addSetWin(team) {
  if (state.sets[team] >= 3) {
    status(`${state.names[team]} sudah mencapai 3 kemenangan set.`);
    return;
  }
  saveSetUndo();
  state.sets[team]++;
  render();
  status(`Kemenangan set ditambahkan untuk ${state.names[team]}.`);
}
function undoSetWin(team) {
  if (state.sets[team] <= 0) {
    status(`Kemenangan set ${state.names[team]} sudah 0.`);
    return;
  }
  saveSetUndo();
  state.sets[team]--;
  render();
  status(`Satu kemenangan set ${state.names[team]} dibatalkan.`);
}
function undoSetAction() {
  if (!state.setHistory.length) {
    status("Belum ada perubahan set untuk di-undo.");
    return;
  }
  const previous = state.setHistory.pop();
  state.sets = previous.sets;
  state.setNumber = previous.setNumber;
  render();
  status("Undo set berhasil. Poin pertandingan tidak berubah.");
}
function nextSet() {
  saveSetUndo();
  state.setNumber++;
  // Skor poin mempunyai riwayat terpisah; reset ini dapat dibatalkan dengan Undo Poin.
  savePointUndo();
  state.points = [0, 0];
  render();
  status(`Set ${state.setNumber} dimulai. Poin kembali ke 00.`);
}
function resetPoints() {
  savePointUndo();
  state.points = [0, 0];
  render();
  status("Poin pertandingan direset ke 00. Kemenangan set tidak berubah.");
}
function switchSides() {
  savePointUndo();
  saveSetUndo();
  [state.names[0], state.names[1]] = [state.names[1], state.names[0]];
  [state.points[0], state.points[1]] = [state.points[1], state.points[0]];
  [state.sets[0], state.sets[1]] = [state.sets[1], state.sets[0]];
  render();
  status("Posisi tim ditukar.");
}
function openNameDialog() {
  $("inputA").value = state.names[0];
  $("inputB").value = state.names[1];
  $("nameDialog").showModal();
}
$("nameForm").addEventListener("submit", event => {
  event.preventDefault();
  const a = $("inputA").value.trim(), b = $("inputB").value.trim();
  if (!a || !b) { alert("Nama kedua tim harus diisi."); return; }
  state.names = [a, b];
  render();
  $("nameDialog").close();
  status("Nama tim diperbarui.");
});
$("cancelNames").addEventListener("click", () => $("nameDialog").close());
$("nameA").addEventListener("click", openNameDialog);
$("nameB").addEventListener("click", openNameDialog);

$("addA").addEventListener("click", () => addPoint(0));
$("addB").addEventListener("click", () => addPoint(1));
$("scoreA").addEventListener("click", () => addPoint(0));
$("scoreB").addEventListener("click", () => addPoint(1));
$("addSetA").addEventListener("click", () => addSetWin(0));
$("addSetB").addEventListener("click", () => addSetWin(1));
$("undoSetA").addEventListener("click", () => undoSetWin(0));
$("undoSetB").addEventListener("click", () => undoSetWin(1));
$("undoPoints").addEventListener("click", undoPoints);
$("undoSet").addEventListener("click", undoSetAction);
$("switch").addEventListener("click", switchSides);
$("nextSet").addEventListener("click", nextSet);
$("resetPoints").addEventListener("click", resetPoints);
$("resetMatch").addEventListener("click", () => $("confirmDialog").showModal());
$("confirmReset").addEventListener("click", event => {
  event.preventDefault();
  state.points = [0, 0]; state.sets = [0, 0]; state.setNumber = 1;
  state.pointHistory = []; state.setHistory = [];
  state.seconds = 0; state.running = false;
  if (clockInterval !== null) { clearInterval(clockInterval); clockInterval = null; }
  $("clock").textContent = "00:00";
  $("confirmDialog").close();
  render();
  status("Pertandingan baru siap dimulai.");
});
function startClock() {
  if (state.running) return;
  state.running = true;
  clockInterval = setInterval(() => {
    state.seconds++;
    $("clock").textContent = `${String(Math.floor(state.seconds / 60)).padStart(2, "0")}:${String(state.seconds % 60).padStart(2, "0")}`;
  }, 1000);
}
document.addEventListener("keydown", event => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  if (event.key.toLowerCase() === "a") addPoint(0);
  if (event.key.toLowerCase() === "l") addPoint(1);
  if (event.key.toLowerCase() === "z") undoPoints();
});
render();
