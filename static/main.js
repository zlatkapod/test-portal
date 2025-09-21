const state = {
  categories: [],
  selectedCategory: null,
  mode: 'flashcards',
  flashIndex: 0,
  flashcards: [],
  testItems: [],
};

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function loadCategories() {
  const data = await fetchJSON('/api/categories');
  state.categories = data.categories;
  renderCategories();
}

function renderCategories() {
  const ul = document.getElementById('category-list');
  ul.innerHTML = '';
  state.categories.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    if (state.selectedCategory === name) li.classList.add('active');
    li.onclick = () => {
      state.selectedCategory = name;
      state.flashIndex = 0;
      state.flashcards = [];
      state.testItems = [];
      renderCategories();
      loadMode();
    };
    ul.appendChild(li);
  });
}

function setupToolbar() {
  const modeSel = document.getElementById('mode-select');
  const testCfg = document.getElementById('test-config');
  modeSel.onchange = () => {
    state.mode = modeSel.value;
    testCfg.style.display = state.mode === 'test' ? '' : 'none';
    loadMode();
  };
  document.getElementById('load-test').onclick = loadTest;
}

async function loadMode() {
  const content = document.getElementById('content');
  if (!state.selectedCategory) {
    content.innerHTML = '<p>Please select a category.</p>';
    return;
  }
  if (state.mode === 'flashcards') {
    if (state.flashcards.length === 0) {
      const data = await fetchJSON(`/api/questions?category=${encodeURIComponent(state.selectedCategory)}&mode=flashcards&limit=1000`);
      state.flashcards = data.items;
    }
    renderFlashcard();
  } else {
    content.innerHTML = '<p>Configure and load a test.</p>';
  }
}

function renderFlashcard() {
  const content = document.getElementById('content');
  if (state.flashcards.length === 0) {
    content.innerHTML = '<p>No cards.</p>';
    return;
  }
  const idx = state.flashIndex;
  const item = state.flashcards[idx];
  content.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  const q = document.createElement('div');
  q.textContent = `Q${idx + 1}/${state.flashcards.length}: ${item.question}`;
  card.appendChild(q);
  const ans = document.createElement('div');
  ans.className = 'answer';
  ans.textContent = 'Reveal answer';
  let revealed = false;
  ans.onclick = () => {
    if (!revealed) {
      ans.textContent = item.answer;
      revealed = true;
    } else {
      ans.textContent = 'Reveal answer';
      revealed = false;
    }
  };
  card.appendChild(ans);
  const controls = document.createElement('div');
  controls.className = 'controls';
  const prev = document.createElement('button'); prev.textContent = 'Prev'; prev.onclick = () => { if (state.flashIndex > 0) { state.flashIndex--; renderFlashcard(); } };
  const next = document.createElement('button'); next.textContent = 'Next'; next.onclick = () => { if (state.flashIndex < state.flashcards.length - 1) { state.flashIndex++; renderFlashcard(); } };
  controls.appendChild(prev); controls.appendChild(next);
  card.appendChild(controls);
  content.appendChild(card);
}

async function loadTest() {
  const n = parseInt(document.getElementById('qpp').value || '5', 10);
  const data = await fetchJSON(`/api/questions?category=${encodeURIComponent(state.selectedCategory)}&mode=test&limit=${n}`);
  state.testItems = data.items.map(it => ({...it, userAnswer: '', result: null}));
  renderTest();
}

function renderTest() {
  const content = document.getElementById('content');
  content.innerHTML = '';
  state.testItems.forEach((it, i) => {
    const div = document.createElement('div');
    div.className = 'qa-item';
    const q = document.createElement('div'); q.textContent = `Q${i + 1}: ${it.question}`;
    const input = document.createElement('input'); input.type = 'text'; input.value = it.userAnswer; input.oninput = (e) => { it.userAnswer = e.target.value; };
    const btn = document.createElement('button'); btn.textContent = 'Check'; btn.onclick = async () => {
      const res = await fetchJSON('/api/check', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ category: state.selectedCategory, question: it.question, answer: it.userAnswer }) });
      it.result = res.correct;
      div.classList.remove('correct', 'incorrect');
      div.classList.add(res.correct ? 'correct' : 'incorrect');
      resultEl.textContent = res.correct ? 'Correct' : `Incorrect. Answer: ${res.expected}`;
    };
    const resultEl = document.createElement('div'); resultEl.className = 'result';
    div.append(q, input, btn, resultEl);
    content.appendChild(div);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupToolbar();
  await loadCategories();
});
