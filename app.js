const el = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat('ko-KR');
const data = window.__DATA__ || { disasters: [], facilities: [] };
const rssFeedUrl = 'https://www.korea.kr/rss/dept_mois.xml';
const state = { type: '', region: '', summary: 'region' };

function fmt(v) {
  if (v === null || v === undefined || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? nf.format(n) : String(v);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'ko'));
}

function optionHTML(label, value = '') {
  return `<option value="${value}">${label}</option>`;
}

function renderFilters() {
  const types = unique(data.disasters.map((d) => d['재난유형']));
  const regions = unique(data.disasters.map((d) => d['발생지역']));
  el('typeFilter').innerHTML = optionHTML('재난유형 전체') + types.map((v) => optionHTML(v, v)).join('');
  el('regionFilter').innerHTML = optionHTML('발생지역 전체') + regions.map((v) => optionHTML(v, v)).join('');
}

function card(row) {
  return `
    <article class="card">
      <div class="card-top">
        <div class="card-id">${row['사건ID']}</div>
        <div class="pill">${row['재난유형']}</div>
      </div>
      <div class="meta">
        <div><span>발생일자</span>${row['발생일자']}</div>
        <div><span>발생지역</span>${row['발생지역']}</div>
        <div><span>피해금액</span>${fmt(row['피해금액_만원'])}만원</div>
      </div>
      <div class="card-footer">규모등급 ${fmt(row['규모등급'])} · 인명피해 ${row['인명피해여부'] === 'Y' ? '있음' : '없음'} · 복구 ${fmt(row['복구기간_일'])}일</div>
    </article>`;
}

function filteredDisasters() {
  return data.disasters.filter((d) => (!state.type || d['재난유형'] === state.type) && (!state.region || d['발생지역'] === state.region));
}

function renderDisasters() {
  const rows = filteredDisasters();
  el('cards').innerHTML = rows.map(card).join('') || '<div class="muted">조건에 맞는 재난 사건이 없습니다.</div>';
  el('resultCount').textContent = `${rows.length}건`;
  el('summaryChip').textContent = `전체 ${rows.length}건`;
}

function renderFacilitySummary() {
  const rows = data.facilities || [];
  const key = state.summary === 'facility' ? '시설유형' : '지역';
  const map = new Map();
  rows.forEach((row) => {
    const k = row[key] || '-';
    const bucket = map.get(k) || { count: 0, capacity: 0 };
    bucket.count += 1;
    bucket.capacity += Number(row['수용인원'] || 0);
    map.set(k, bucket);
  });
  const items = [...map.entries()].sort((a, b) => b[1].count - a[1].count || String(a[0]).localeCompare(String(b[0]), 'ko'));
  el('facilitySummary').innerHTML = items.map(([name, v]) => `
    <div class="summary-item">
      <strong>${name}</strong>
      <span>${v.count}개 시설 · 수용인원 합계 ${fmt(v.capacity)}명</span>
    </div>
  `).join('');
}

function renderTotals() {
  el('totalReports').textContent = fmt(data.disasters.length);
  el('totalFacilities').textContent = fmt(data.facilities.length);
}

function renderRss(items, statusText) {
  el('rssHeroStatus').textContent = statusText;
  el('rssHeroList').innerHTML = items.map((item) => `<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a><div><time>${item.date || ''}</time></div></li>`).join('');
  el('rssStatus').textContent = statusText;
  el('rssList').innerHTML = items.map((item) => `<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a><div><time>${item.date || ''}</time></div><p>${item.desc || ''}</p></li>`).join('');
}

async function loadRss() {
  try {
    if (Array.isArray(window.__RSS_ITEMS__) && window.__RSS_ITEMS__.length >= 5) {
      const items = window.__RSS_ITEMS__.slice(0, 5);
      renderRss(items, `최신 ${items.length}건`);
      return;
    }
    const res = await fetch(rssFeedUrl);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, 5).map((item) => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '#',
      date: item.querySelector('pubDate')?.textContent || '',
      desc: (item.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '')
    }));
    renderRss(items, `최신 ${items.length}건`);
  } catch (err) {
    const items = (window.__RSS_ITEMS__ || []).slice(0, 5);
    renderRss(items, 'RSS 보조 목록 표시');
  }
}

function bindEvents() {
  el('typeFilter').addEventListener('change', (e) => {
    state.type = e.target.value;
    renderDisasters();
  });
  el('regionFilter').addEventListener('change', (e) => {
    state.region = e.target.value;
    renderDisasters();
  });
  el('resetButton').addEventListener('click', () => {
    state.type = '';
    state.region = '';
    el('typeFilter').value = '';
    el('regionFilter').value = '';
    renderDisasters();
  });
  document.querySelectorAll('.toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.summary = btn.dataset.summary;
      renderFacilitySummary();
    });
  });
}

async function boot() {
  renderTotals();
  renderFilters();
  renderDisasters();
  renderFacilitySummary();
  bindEvents();
  await loadRss();
}

boot();
