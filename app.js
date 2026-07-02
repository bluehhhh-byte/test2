const el = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat('ko-KR');
const data = window.__DATA__ || { disasters: [], facilities: [] };
const rssFeedUrl = 'https://www.korea.kr/rss/dept_mois.xml';
const PAGE_SIZE = 50;
const RSS_PAGE_SIZE = 10;
const state = { type: '', region: '', summary: 'region', visible: PAGE_SIZE, rssVisible: RSS_PAGE_SIZE, rssItems: [] };
const typePalette = [
  { bg: '#e0f2fe', fg: '#075985', line: '#38bdf8' },
  { bg: '#dcfce7', fg: '#166534', line: '#22c55e' },
  { bg: '#fef3c7', fg: '#92400e', line: '#f59e0b' },
  { bg: '#fee2e2', fg: '#991b1b', line: '#ef4444' },
  { bg: '#ede9fe', fg: '#5b21b6', line: '#8b5cf6' },
  { bg: '#fce7f3', fg: '#9d174d', line: '#ec4899' },
  { bg: '#ccfbf1', fg: '#115e59', line: '#14b8a6' },
  { bg: '#e5e7eb', fg: '#374151', line: '#6b7280' }
];
let disasterTypes = [];

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

function typeStyle(type) {
  const idx = Math.max(0, disasterTypes.indexOf(type));
  const color = typePalette[idx % typePalette.length];
  return `--type-bg:${color.bg};--type-fg:${color.fg};--type-line:${color.line}`;
}

function renderFilters() {
  disasterTypes = unique(data.disasters.map((d) => d['재난유형']));
  const regions = unique(data.disasters.map((d) => d['발생지역']));
  el('typeFilter').innerHTML = optionHTML('재난유형 전체') + disasterTypes.map((v) => optionHTML(v, v)).join('');
  el('regionFilter').innerHTML = optionHTML('발생지역 전체') + regions.map((v) => optionHTML(v, v)).join('');
}

function card(row) {
  const casualty = row['인명피해여부'] === 'Y';
  return `
    <article class="card ${casualty ? 'casualty-card' : ''}" style="${typeStyle(row['재난유형'])}">
      <div class="card-top">
        <div class="card-id">${row['사건ID']}</div>
        <div class="pill type-pill">${row['재난유형']}</div>
      </div>
      <div class="meta">
        <div><span>발생일자</span>${row['발생일자']}</div>
        <div><span>발생지역</span>${row['발생지역']}</div>
        <div><span>피해금액</span>${fmt(row['피해금액_만원'])}만원</div>
      </div>
      <div class="card-footer">규모등급 ${fmt(row['규모등급'])} · <span class="casualty ${casualty ? 'danger' : ''}">인명피해 ${casualty ? '있음' : '없음'}</span> · 복구 ${fmt(row['복구기간_일'])}일</div>
    </article>`;
}

function filteredDisasters() {
  return data.disasters.filter((d) => (!state.type || d['재난유형'] === state.type) && (!state.region || d['발생지역'] === state.region));
}

function summaryDisasters() {
  return filteredDisasters();
}

function facilityRowsForSummary() {
  const disasters = summaryDisasters();
  const regions = new Set(disasters.map((d) => d['발생지역']).filter(Boolean));
  if (!state.type && !state.region) return data.facilities;
  return data.facilities.filter((f) => regions.has(f['지역']));
}

function filteredFacilities() {
  return facilityRowsForSummary();
}

function meterWidth(count, total) {
  if (!total) return '0%';
  return `${Math.max(3, Math.min(100, (count / total) * 100))}%`;
}

function renderMetrics(rows, visibleRows) {
  const facilities = filteredFacilities();
  el('totalReports').textContent = fmt(rows.length);
  el('totalFacilities').textContent = fmt(facilities.length);
  el('resultCount').textContent = `${fmt(visibleRows.length)}건`;
  el('reportMeter').style.width = meterWidth(rows.length, data.disasters.length);
  el('facilityMeter').style.width = meterWidth(facilities.length, data.facilities.length);
  el('visibleMeter').style.width = meterWidth(visibleRows.length, Math.max(rows.length, 1));
}

function renderDisasters() {
  const rows = filteredDisasters();
  const visibleRows = rows.slice(0, state.visible);
  el('cards').innerHTML = visibleRows.map(card).join('') || '<div class="muted">조건에 맞는 재난 사건이 없습니다.</div>';
  el('summaryChip').textContent = `${fmt(visibleRows.length)} / ${fmt(rows.length)}건 표시`;
  renderMetrics(rows, visibleRows);

  const loadMore = el('loadMoreButton');
  const remaining = rows.length - visibleRows.length;
  loadMore.hidden = remaining <= 0;
  loadMore.textContent = remaining > 0 ? `계속보기 (${fmt(remaining)}건 남음)` : '계속보기';
}

function renderFacilitySummary() {
  const facilities = facilityRowsForSummary();
  const disasters = summaryDisasters();
  const disasterCountByRegion = new Map();
  disasters.forEach((row) => {
    const region = row['발생지역'] || '-';
    disasterCountByRegion.set(region, (disasterCountByRegion.get(region) || 0) + 1);
  });

  const key = state.summary === 'facility' ? '시설유형' : '지역';
  const map = new Map();
  facilities.forEach((row) => {
    const k = row[key] || '-';
    const bucket = map.get(k) || { count: 0, capacity: 0, disasterCount: 0 };
    bucket.count += 1;
    bucket.capacity += Number(row['수용인원'] || 0);
    if (key === '지역') bucket.disasterCount = disasterCountByRegion.get(k) || 0;
    map.set(k, bucket);
  });

  const items = [...map.entries()].sort((a, b) => b[1].count - a[1].count || b[1].capacity - a[1].capacity || String(a[0]).localeCompare(String(b[0]), 'ko'));
  const maxCount = Math.max(...items.map(([, v]) => v.count), 1);
  const label = state.summary === 'facility' ? '시설유형' : '지역';
  const disasterHeader = state.summary === 'facility' ? '' : '<th>관련 재난</th>';
  const rows = items.map(([name, v], index) => `
    <tr>
      <td class="rank">${index + 1}</td>
      <td class="summary-name">${name}</td>
      <td>
        <div class="bar-cell"><span style="width:${meterWidth(v.count, maxCount)}"></span><strong>${fmt(v.count)}개</strong></div>
      </td>
      <td>${fmt(v.capacity)}명</td>
      ${state.summary === 'facility' ? '' : `<td>${fmt(v.disasterCount)}건</td>`}
    </tr>
  `).join('');

  el('facilitySummary').innerHTML = items.length ? `
    <div class="summary-table-wrap">
      <table class="summary-table">
        <thead><tr><th>순위</th><th>${label}</th><th>시설 수</th><th>수용인원</th>${disasterHeader}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  ` : '<div class="muted">선택한 조건과 연결된 안전시설 정보가 없습니다.</div>';
}

function formatRssDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = weekdays[date.getUTCDay()];
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 || 12;
  const minuteText = minute ? ` ${minute}분` : '';
  return `${year}년 ${month}월 ${day}일(${weekday}) ${period} ${hour12}시${minuteText}`;
}

function renderRss(items, statusText) {
  state.rssItems = items;
  const heroItems = items.slice(0, 5);
  const listItems = items.slice(0, state.rssVisible);
  el('rssHeroStatus').textContent = statusText;
  el('rssHeroList').innerHTML = heroItems.map((item) => `<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a><div><time>${formatRssDate(item.date)}</time></div></li>`).join('');
  el('rssStatus').textContent = `실시간 ${Math.min(state.rssVisible, items.length)} / ${items.length}건`;
  el('rssList').innerHTML = listItems.map((item) => `<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a><div><time>${formatRssDate(item.date)}</time></div><p>${item.desc || ''}</p></li>`).join('');

  const rssMore = el('rssMoreButton');
  const remaining = items.length - listItems.length;
  rssMore.hidden = remaining <= 0;
  rssMore.textContent = remaining > 0 ? `계속보기 (${fmt(remaining)}건 남음)` : '계속보기';
}

async function loadRss() {
  try {
    if (Array.isArray(window.__RSS_ITEMS__) && window.__RSS_ITEMS__.length >= 5) {
      const items = window.__RSS_ITEMS__;
      renderRss(items, `실시간 ${Math.min(5, items.length)}건`);
      return;
    }
    const res = await fetch(rssFeedUrl);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, 20).map((item) => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '#',
      date: item.querySelector('pubDate')?.textContent || '',
      desc: (item.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '')
    }));
    renderRss(items, `실시간 ${Math.min(5, items.length)}건`);
  } catch (err) {
    const items = window.__RSS_ITEMS__ || [];
    renderRss(items, '보조 목록 표시');
  }
}

function resetVisible() {
  state.visible = PAGE_SIZE;
}

function bindEvents() {
  el('typeFilter').addEventListener('change', (e) => {
    state.type = e.target.value;
    resetVisible();
    renderDisasters();
    renderFacilitySummary();
  });
  el('regionFilter').addEventListener('change', (e) => {
    state.region = e.target.value;
    resetVisible();
    renderDisasters();
    renderFacilitySummary();
  });
  el('resetButton').addEventListener('click', () => {
    state.type = '';
    state.region = '';
    resetVisible();
    el('typeFilter').value = '';
    el('regionFilter').value = '';
    renderDisasters();
    renderFacilitySummary();
  });
  el('loadMoreButton').addEventListener('click', () => {
    state.visible += PAGE_SIZE;
    renderDisasters();
  });
  el('rssMoreButton').addEventListener('click', () => {
    state.rssVisible += RSS_PAGE_SIZE;
    renderRss(state.rssItems, `실시간 ${Math.min(5, state.rssItems.length)}건`);
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
  renderFilters();
  renderDisasters();
  renderFacilitySummary();
  bindEvents();
  await loadRss();
}

boot();
