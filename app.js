'use strict';
/* ============================================================
   СМЕНА — прототип цифрового инструмента для «Очаково»
   Концепция A + C + B: мини-апп ВК (игровой путь) +
   «Лаборатория вкуса» + наставник с пре-бордингом.
   Демо работает офлайн: данные в localStorage, экспорт JSON.
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- цвета ---------------- */
  // Палитра живёт в CSS-переменных (см. styles.css): графит + фирменный синий.
  const cssVar = (name, fallback) =>
    (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim() || fallback;

  const rgba = (hex, alpha) => {
    const h = hex.replace('#', '').trim();
    const full = h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h;
    const n = parseInt(full, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + alpha + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  };

  const LS_STATE = 'och_smena_v1';
  const LS_LEADS = 'och_leads_v1';
  const LS_CHECK = 'och_checklist_v1';

  /* ---------------- данные ---------------- */

  const TRACKS = [
    {
      id: 'engineer',
      ico: '⚙️',
      name: 'Инженер',
      desc: 'Автоматизация и наладка линий: этикетаж, упаковка, выдувная машина, паллетайзер. Ремонтные мастерские, техническая поддержка.',
      money: 'старт от 70 000 ₽ · сменный график 2/2',
      vacancies: [
        'Оператор линии розлива (от 70 000 ₽)',
        'Наладчик технологического оборудования',
        'Инженер технической поддержки',
        'Практика в цехе розлива'
      ]
    },
    {
      id: 'tech',
      ico: '🧪',
      name: 'Технолог / химик-лаборант',
      desc: 'Цех варки и лаборатория: сырьё, сиропы, контроль качества каждой партии. Работа с рецептурами и показателями.',
      money: 'лаборант от 60 000 ₽ · техцех от 70 000 ₽',
      vacancies: [
        'Химик-лаборант (от 60 000 ₽)',
        'Оператор технологического цеха (от 70 000 ₽)',
        'Практика в лаборатории',
        'Практика в технологическом цехе'
      ]
    },
    {
      id: 'operator',
      ico: '📦',
      name: 'Оператор / склад',
      desc: 'Складской комплекс и розлив: программа, товарно-транспортные накладные, комплектация заказов, управление комплектовщиками.',
      money: 'склад от 60 000 ₽ · кладовщик от 56 000 ₽',
      vacancies: [
        'Оператор склада (от 60 000 ₽)',
        'Кладовщик (от 56 000 ₽)',
        'Оператор линии розлива (от 70 000 ₽)',
        'Практика на складском комплексе'
      ]
    }
  ];

  const HISTORY = [
    {
      year: 1978,
      q: 'Комбинат построили к Олимпиаде-80',
      options: [1974, 1978, 1984],
      fact: 'Московский пиво-безалкогольный комбинат начал работу в 1978 году — его построили к Олимпиаде-80, чтобы поить гостей Игр.'
    },
    {
      year: 1994,
      q: 'Первый в мире розлив пива в ПЭТ-бутылку',
      options: [1990, 1994, 1999],
      fact: 'В 1994-м «Очаково» первым в мире начало разливать пиво в пластиковые бутылки, а за ним этот приём повторили другие производители.'
    },
    {
      year: 1995,
      q: 'Первое российское пиво в алюминиевой банке',
      options: [1995, 2001, 1989],
      fact: 'Российское пиво в алюминиевых банках впервые выпустили на московском заводе «Очаково» в 1995 году — спустя год после ПЭТ-запуска.'
    },
    {
      year: 1998,
      q: 'Старт кваса «Очаковский» — главного бренда',
      options: [1993, 1998, 2004],
      fact: 'В 1998-м начался выпуск кваса «Очаковский» — самого известного бренда компании и лидера рынка натурального кваса.'
    }
  ];

  const LINE = [
    { name: 'Скорость розлива', val: '24 000', unit: 'бут./час', norm: 'норма 22 000–26 000', ok: true },
    { name: 'Давление CO₂', val: '3,4', unit: 'бар', norm: 'норма 2,0–2,6', ok: false },
    { name: 'Качество этикетажа', val: '99,8', unit: '%', norm: 'норма ≥ 99,5', ok: true },
    { name: 'Температура сиропа', val: '18', unit: '°C', norm: 'норма 12–20', ok: true }
  ];

  const SAMPLES = [
    { id: '214', acid: '2,4', dens: '8,2', co2: '2,3', ok: true },
    { id: '215', acid: '3,6', dens: '8,4', co2: '2,4', ok: false },
    { id: '216', acid: '2,7', dens: '8,1', co2: '2,5', ok: true }
  ];

  const BASES = [
    { id: 'kvass', name: 'Квас', note: 'настоящий, брожения' },
    { id: 'lemon', name: 'Лимонад', note: 'газированный' },
    { id: 'mors', name: 'Морс', note: 'ягодный' }
  ];

  const INGREDIENTS = [
    { id: 'oblepiha', name: 'Облепиха', adj: 'Облепиховый', p: [7, 3, 1, 4] },
    { id: 'tarhun', name: 'Тархун', adj: 'Тархунный', p: [2, 6, 2, 9] },
    { id: 'lavanda', name: 'Лаванда', adj: 'Лавандовый', p: [1, 5, 3, 6] },
    { id: 'imbir', name: 'Имбирь', adj: 'Имбирный', p: [3, 2, 10, 5] },
    { id: 'smorodina', name: 'Чёрная смородина', adj: 'Смородиновый', p: [9, 4, 1, 6] },
    { id: 'myata', name: 'Мята', adj: 'Мятный', p: [1, 4, 2, 10] },
    { id: 'vishnya', name: 'Вишня', adj: 'Вишнёвый', p: [8, 7, 1, 3] },
    { id: 'kedr', name: 'Кедровый орех', adj: 'Кедровый', p: [1, 6, 5, 2] },
    { id: 'apelsin', name: 'Апельсин', adj: 'Апельсиновый', p: [6, 6, 1, 5] }
  ];

  const QUIZ = [
    {
      q: 'В каком году комбинат начал работу к Олимпиаде-80?',
      opts: ['1974', '1978', '1984'],
      right: 1,
      why: 'Комбинат запустили в 1978 году специально к Олимпийским играм 1980-го.'
    },
    {
      q: 'Что «Очаково» сделало первым в мире в 1994 году?',
      opts: ['Разлило пиво в ПЭТ-бутылку', 'Выпустило квас в банке', 'Разлило лимонад в стекло'],
      right: 0,
      why: 'Первый в мире промышленный розлив пива в ПЭТ — технология, которую потом подхватил рынок.'
    },
    {
      q: 'Какой бренд компании называют самым известным?',
      opts: ['«Джин-Тоник»', 'Квас «Очаковский»', 'Вода «Очаково»'],
      right: 1,
      why: 'Квас «Очаковский» выпускается с 1998 года и делает компанию лидером рынка натурального кваса.'
    },
    {
      q: 'Со скольки лет «Очаково» берёт на практику и стажировку?',
      opts: ['С 16 лет', 'С 18 лет', 'С 21 года'],
      right: 1,
      why: 'Только с 18 лет — это прямое требование компании к стажировкам и практике.'
    },
    {
      q: 'Сколько производств входит в «Очаково»?',
      opts: ['4', '7', '10'],
      right: 2,
      why: 'Десять предприятий, построенных с нуля, плюс свои солодовни и виноградники на Тамани.'
    }
  ];

  const BOARD = [
    { uni: 'МГУПП', city: 'Москва', pts: 268 },
    { uni: 'РХТУ им. Д. И. Менделеева', city: 'Москва', pts: 255 },
    { uni: 'МГТУ им. Н. Э. Баумана', city: 'Москва', pts: 243 },
    { uni: 'МИРЭА — Российский технологический университет', city: 'Москва', pts: 231 },
    { uni: 'Политехнический колледж им. П. А. Овчинникова', city: 'Москва', pts: 214 },
    { uni: 'НИУ «МЭИ»', city: 'Москва', pts: 202 }
  ];

  const CHECKLIST = [
    { t: 'Паспорт и СНИЛС', d: 'Оригиналы понадобятся в первый день. Копии — для отдела кадров.' },
    { t: 'Договор на практику от вуза', d: 'Договор подписывается до практики, дневник заполняешь сам, характеристику выдаёт компания.' },
    { t: 'Заезд в общежитие', d: 'Марьино, ул. Рябиновая, 44. Приехать до 14:00 или после 16:00. Студентам — 3 400 ₽/мес, сотрудникам — 6 800 ₽.' },
    { t: 'Пропуск и первый день', d: 'Пропуск оформляет отдел кадров. Медосмотр и спецодежда — за счёт компании.' },
    { t: 'Что взять с собой', d: 'Фен и утюг в общежитии есть, кипятильник — свой. Душ на первом этаже, кухня на этаже.' },
    { t: 'Сохранить телефонный справочник', d: 'Учебный центр 8 800 100 77 77 (доб. 1244/3105), отдел кадров (доб. 1234), общежитие 8 495 446 42 55.' }
  ];

  const FUNNEL = [
    { k: 'Показы в каналах и вузах', v: 48000, pct: '' },
    { k: 'Старт игры «Смена»', v: 6240, pct: '13% от показов' },
    { k: 'Дошли до 2-й смены', v: 3100, pct: '50% от старта' },
    { k: 'Прошли контрольный квиз', v: 1780, pct: '57%' },
    { k: 'Оставили заявку', v: 214, pct: '12% от квиза' },
    { k: 'Приглашение на практику', v: 96, pct: '45% от заявок' },
    { k: 'Вышли на работу', v: 41, pct: '43%' }
  ];

  const SEQ = ['s-track', 's-history', 's-line', 's-quality', 's-flavor', 's-quiz'];
  const LABELS = {
    's-track': 'Смена 1 из 6',
    's-history': 'Смена 1 из 6',
    's-line': 'Смена 2 из 6',
    's-quality': 'Смена 3 из 6',
    's-flavor': 'Смена 4 из 6',
    's-quiz': 'Смена 5 из 6',
    's-final': 'Смена 6 из 6',
    's-form': 'Заявка',
    's-done': 'Заявка',
    's-board': 'Рейтинг',
    's-mentor': 'Наставник',
    's-hr': 'Пульт HR'
  };

  /* ---------------- состояние ---------------- */

  const fresh = {
    track: null,
    points: 0,
    done: { track: false, history: false, line: false, quality: false, flavor: false, quiz: false },
    quizScore: 0,
    flavor: null,
    lead: null
  };

  let state = load(LS_STATE, fresh);
  let stack = [];
  let current = 's-splash';

  function load(k, fb) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return JSON.parse(JSON.stringify(fb));
      const saved = JSON.parse(raw);
      const out = Object.assign(JSON.parse(JSON.stringify(fb)), saved);
      if (fb.done) out.done = Object.assign({}, fb.done, saved.done || {});
      return out;
    } catch (e) {
      return JSON.parse(JSON.stringify(fb));
    }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ }
  }
  const persist = () => save(LS_STATE, state);

  function addPoints(n) {
    state.points += n;
    $('#score').textContent = state.points;
    persist();
  }

  /* ---------------- навигация ---------------- */

  function go(id, push = true) {
    if (!document.getElementById(id)) return;
    if (push && current !== id) stack.push(current);
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    current = id;
    const inGame = id !== 's-splash';
    $('#topbar').style.display = inGame ? 'flex' : 'none';
    $('#shift-label').textContent = LABELS[id] || '';
    renderDots();
    $('#score').textContent = state.points;
    window.scrollTo(0, 0);

    // экраны, содержимое которых зависит от состояния
    if (id === 's-final') renderFinal();
    if (id === 's-board') renderBoard();
    if (id === 's-hr') renderHR();
    if (id === 's-form') renderVacancies();
    if (id === 's-mentor') renderMentor();
  }

  function back() {
    const prev = stack.pop();
    go(prev || 's-splash', false);
  }

  function renderDots() {
    const order = ['track', 'history', 'line', 'quality', 'flavor', 'quiz'];
    const idx = SEQ.indexOf(current);
    $('#dots').innerHTML = order
      .map((k, i) => `<i class="${state.done[k] || (idx >= 0 && i < idx) ? 'on' : ''}"></i>`)
      .join('');
  }

  /* ---------------- трек ---------------- */

  function renderTracks() {
    $('#track-list').innerHTML = TRACKS.map(t => `
      <button class="track ${state.track === t.id ? 'sel' : ''}" data-track="${t.id}">
        <span class="track-ico">${t.ico}</span>
        <span>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <span class="money">${t.money}</span>
        </span>
      </button>`).join('');

    $$('#track-list .track').forEach(b => b.addEventListener('click', () => {
      state.track = b.dataset.track;
      state.done.track = true;
      persist();
      renderTracks();
      renderVacancies();
      setTimeout(() => go('s-history'), 140);
    }));
  }

  /* ---------------- история ---------------- */

  function renderHistory() {
    $('#hist-list').innerHTML = HISTORY.map((h, i) => `
      <div class="hist-card" id="hist-${i}">
        <p class="hist-q">${i + 1}. ${h.q}</p>
        <div class="years">${h.options.map(y => `<button class="year" data-i="${i}" data-y="${y}">${y}</button>`).join('')}</div>
        <p class="hist-fact">${h.fact}</p>
      </div>`).join('');

    $$('#hist-list .year').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      const card = $('#hist-' + i);
      if (card.classList.contains('done')) return;
      if (Number(btn.dataset.y) === HISTORY[i].year) {
        btn.classList.add('right');
        card.classList.add('done');
        addPoints(25);
        checkHistory();
      } else {
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 700);
      }
    }));
  }

  function checkHistory() {
    const allDone = $$('#hist-list .hist-card').every(c => c.classList.contains('done'));
    if (allDone) {
      $('#hist-next').hidden = false;
      state.done.history = true;
      persist();
      renderDots();
    }
  }

  /* ---------------- линия ---------------- */

  let lineTries = 0;

  function renderLine() {
    $('#line-grid').innerHTML = LINE.map((s, i) => `
      <button class="stat" data-i="${i}">
        <div class="s-name">${s.name}</div>
        <div class="s-val">${s.val} <span style="font-size:13px;font-weight:700">${s.unit}</span></div>
        <div class="s-norm">${s.norm}</div>
      </button>`).join('');

    $$('#line-grid .stat').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if (state.done.line) return;
      if (LINE[i].ok) {
        lineTries++;
        btn.classList.add('wrong');
        $('#line-hint').textContent = 'Здесь показатели в норме. Сравни значение с регламентом ещё раз — отклонение одно.';
        setTimeout(() => btn.classList.remove('wrong'), 800);
      } else {
        btn.classList.add('right');
        const good = lineTries === 0;
        addPoints(good ? 30 : 15);
        $('#line-hint').textContent = 'Верно: давление CO₂ 3,4 бар при норме 2,0–2,6. Так линия ушла бы в брак по переливу — станцию останавливаем и стравливаем газ.';
        state.done.line = true;
        persist();
        $('#line-result').textContent = good ? '+30 баллов · с первой попытки' : '+15 баллов';
        $('#line-next').hidden = false;
        renderDots();
      }
    }));
  }

  /* ---------------- лаборатория (качество) ---------------- */

  let qualTries = 0;

  function renderQuality() {
    $('#qual-grid').innerHTML = SAMPLES.map((s, i) => `
      <button class="qual" data-i="${i}">
        <div class="q-head">
          <span class="q-title">Партия №${s.id}</span>
          <span style="font-size:11px;color:var(--muted)">проба из техцеха</span>
        </div>
        <div class="q-rows">
          <div class="q-row"><span>Кислотность</span><b>${s.acid} (норма 2,0–3,0)</b></div>
          <div class="q-row"><span>Плотность</span><b>${s.dens} % (7,5–8,5)</b></div>
          <div class="q-row"><span>CO₂</span><b>${s.co2} бар (2,0–2,6)</b></div>
        </div>
      </button>`).join('');

    $$('#qual-grid .qual').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if (state.done.quality) return;
      if (SAMPLES[i].ok) {
        qualTries++;
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 800);
        $('#qual-hint').textContent = 'Эта партия проходит регламент по всем трём показателям. Проверь остальные.';
      } else {
        btn.classList.add('right');
        const good = qualTries === 0;
        addPoints(good ? 30 : 15);
        $('#qual-hint').textContent = 'Точно: у партии №215 кислотность 3,6 при норме до 3,0. Такое сырьё вернём поставщику, а партию — на переработку.';
        state.done.quality = true;
        persist();
        $('#qual-result').textContent = good ? '+30 баллов · с первой попытки' : '+15 баллов';
        $('#qual-next').hidden = false;
        renderDots();
      }
    }));
  }

  /* ---------------- лаборатория вкуса ---------------- */

  let flavorPick = { base: null, ings: [] };

  function renderFlavor() {
    $('#base-list').innerHTML = BASES.map(b => `
      <button class="chip ${flavorPick.base === b.id ? 'sel' : ''}" data-base="${b.id}">${b.name}</button>`).join('');

    $('#ing-list').innerHTML = INGREDIENTS.map(g => `
      <button class="chip ${flavorPick.ings.includes(g.id) ? 'on' : ''}" data-ing="${g.id}">${g.name}</button>`).join('');

    $('#ing-count').textContent = `(${flavorPick.ings.length}/3)`;
    $('#btn-create').disabled = !(flavorPick.base && flavorPick.ings.length === 3);

    $$('#base-list .chip').forEach(b => b.addEventListener('click', () => {
      flavorPick.base = b.dataset.base;
      renderFlavor();
    }));

    $$('#ing-list .chip').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.ing;
      const at = flavorPick.ings.indexOf(id);
      if (at >= 0) flavorPick.ings.splice(at, 1);
      else if (flavorPick.ings.length < 3) flavorPick.ings.push(id);
      renderFlavor();
    }));
  }

  function makeFlavor() {
    const base = BASES.find(b => b.id === flavorPick.base);
    const ings = flavorPick.ings.map(id => INGREDIENTS.find(g => g.id === id));
    const adj = ings[0].adj;
    const name = `${adj} ${base.name.toLowerCase()}`;
    const profile = [0, 1, 2, 3].map(k =>
      Math.round(ings.reduce((s, g) => s + g.p[k], 0) / ings.length)
    );
    return { base, ings, name, profile };
  }

  function renderFlavorResult() {
    const f = makeFlavor();
    state.flavor = { name: f.name, base: f.base.name, ings: f.ings.map(g => g.name), profile: f.profile };
    const labels = ['Кислинка', 'Сладость', 'Пряность', 'Свежесть'];
    $('#flavor-result').innerHTML = `
      <div class="flavor-card">
        <div class="fc-top"><span>Очаково · лаборатория вкуса</span><span>партия №${String(state.points + 7).padStart(3, '0')}</span></div>
        <h3>${f.name}</h3>
        <p class="fc-sub">Твой личный вкус на основе «${f.base.name}»: ${f.ings.map(g => g.name.toLowerCase()).join(' + ')}.
        Так в «Очаково» и рождаются новые позиции — от идеи до первой партии.</p>
        <div class="fc-ings">${f.ings.map(g => `<span>${g.name}</span>`).join('')}</div>
        <div class="profile">
          ${f.profile.map((v, i) => `
            <div class="p-bar"><span>${labels[i]}</span><span class="p-track"><i style="width:${v * 10}%"></i></span><span>${v}</span></div>`).join('')}
        </div>
        <div class="fc-actions">
          <button class="btn btn-white" id="btn-png">Скачать карточку</button>
          <button class="btn btn-outline" id="btn-copy">Скопировать</button>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:12px">Дальше: контрольные вопросы →</button>`;

    $('#btn-png').addEventListener('click', () => downloadCard(f));
    $('#btn-copy').addEventListener('click', () => {
      const text = `Мой вкус для «Очаково»: ${f.name} (${f.base.name} + ${f.ings.map(g => g.name.toLowerCase()).join(', ')}). Собрал в мини-аппе «Смена».`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => flash($('#btn-copy'), 'Скопировано'),
          () => flash($('#btn-copy'), 'Не удалось')
        );
      } else {
        flash($('#btn-copy'), 'Скопируй вручную');
      }
    });
    $('#flavor-result .btn-primary').addEventListener('click', () => go('s-quiz'));

    state.done.flavor = true;
    if (!state.flavorPts) { state.flavorPts = true; addPoints(25); }
    persist();
    renderDots();
  }

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1400);
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line ? line + ' ' + words[n] : words[n];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = words[n];
        y += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y + lh;
  }

  function downloadCard(f) {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    const x = c.getContext('2d');

    // цвета берём из активной темы, чтобы карточка совпадала с интерфейсом
    const hero1 = cssVar('--c-hero-1', '#4E9B2E');
    const hero2 = cssVar('--c-hero-2', '#2E6517');
    const onHero = cssVar('--c-on-hero', '#FFFFFF');

    const g = x.createLinearGradient(0, 0, 1080, 1350);
    g.addColorStop(0, hero1);
    g.addColorStop(1, hero2);
    x.fillStyle = g;
    x.fillRect(0, 0, 1080, 1350);

    // узор
    x.fillStyle = rgba(onHero, 0.12);
    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 36; j++) {
        if ((i + j) % 3 === 0) x.fillRect(26 + i * 38, 26 + j * 38, 7, 7);
      }
    }

    x.fillStyle = onHero;
    x.font = '800 40px Inter, Arial, sans-serif';
    x.fillText('ОЧАКОВО', 72, 118);
    x.globalAlpha = .8;
    x.font = '700 22px Inter, Arial, sans-serif';
    x.fillText('СМЕНА · ЛАБОРАТОРИЯ ВКУСА', 72, 158);
    x.globalAlpha = 1;

    x.font = '900 86px Inter, Arial, sans-serif';
    const lines = [];
    const words = f.name.split(' ');
    let cur = '';
    words.forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (x.measureText(t).width > 920 && cur) { lines.push(cur); cur = w; }
      else cur = t;
    });
    if (cur) lines.push(cur);

    let y = 330;
    lines.forEach(l => { x.fillText(l, 72, y); y += 92; });

    x.globalAlpha = .9;
    x.font = '500 30px Inter, Arial, sans-serif';
    x.fillText('вкус, которого ещё нет в линейке', 72, y + 6);
    x.globalAlpha = 1;

    const labels = ['Кислинка', 'Сладость', 'Пряность', 'Свежесть'];
    y += 100;
    f.profile.forEach((v, i) => {
      x.font = '600 26px Inter, Arial, sans-serif';
      x.globalAlpha = .85;
      x.fillText(labels[i], 72, y);
      x.globalAlpha = 1;
      x.fillStyle = rgba(onHero, 0.28);
      x.fillRect(300, y - 18, 700, 12);
      x.fillStyle = onHero;
      x.fillRect(300, y - 18, 700 * (v / 10), 12);
      y += 58;
    });

    x.fillStyle = onHero;
    x.font = '600 26px Inter, Arial, sans-serif';
    x.fillText('Состав: ' + f.ings.map(g => g.name.toLowerCase()).join(' · '), 72, 1140);
    x.globalAlpha = .75;
    x.font = '500 24px Inter, Arial, sans-serif';
    x.fillText('Собрано в мини-аппе «Смена» · практика и стажировка в «Очаково» · 18+', 72, 1230);
    x.globalAlpha = 1;

    try {
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'ochakovo-vkus.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Скачивание недоступно в этом браузере. Карточку можно показать на экране.');
    }
  }

  /* ---------------- квиз ---------------- */

  let quizIdx = 0;
  let quizLocked = false;

  function renderQuiz() {
    if (quizIdx >= QUIZ.length) {
      $('#quiz-progress').textContent = 'Контрольный блок пройден';
      $('#quiz-body').innerHTML = `
        <div class="quiz-why"><b>${state.quizScore} из ${QUIZ.length}</b> верных ответов.<br>
        ${state.quizScore >= 4 ? 'Ты знаешь компанию лучше, чем большинство кандидатов — это видно и на защите.' : 'Есть что подтянуть: вернись на смену с историей, там все ответы.'}</div>`;
      state.done.quiz = true;
      persist();
      $('#quiz-next').hidden = false;
      renderDots();
      return;
    }

    const q = QUIZ[quizIdx];
    quizLocked = false;
    $('#quiz-progress').textContent = `Вопрос ${quizIdx + 1} из ${QUIZ.length} · верно: ${state.quizScore}`;
    $('#quiz-body').innerHTML = `
      <p class="quiz-q">${q.q}</p>
      ${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}
      <div id="quiz-why"></div>`;

    $$('#quiz-body .opt').forEach(b => b.addEventListener('click', () => {
      if (quizLocked) return;
      quizLocked = true;
      const i = Number(b.dataset.i);
      const right = i === q.right;
      $$('#quiz-body .opt')[q.right].classList.add('right');
      if (!right) b.classList.add('wrong');
      if (right) { state.quizScore++; addPoints(20); }
      $('#quiz-why').innerHTML = `<div class="quiz-why">${right ? '✅ ' : '❌ '}${q.why}</div>
        <button class="btn btn-primary" id="btn-next-q">${quizIdx === QUIZ.length - 1 ? 'Показать итоги' : 'Следующий вопрос'}</button>`;
      $('#btn-next-q').addEventListener('click', () => {
        quizIdx++;
        renderQuiz();
      });
    }));
  }

  /* ---------------- финал ---------------- */

  function renderFinal() {
    const pts = state.points;
    const rank = pts >= 260 ? 'Легенда смены' : pts >= 200 ? 'Мастер смены' : pts >= 120 ? 'Сменщик' : 'Стажёр смены';
    const track = TRACKS.find(t => t.id === state.track) || TRACKS[0];
    const maxPts = 285;
    $('#final-body').innerHTML = `
      <div class="verdict">
        <div class="v-rank">твой результат · ${Math.min(100, Math.round(pts / maxPts * 100))}% пути</div>
        <h2>${rank}</h2>
        <p>${pts} баллов из ${maxPts}. Рекомендованный трек — «${track.name}».<br>
        Контрольный блок: ${state.quizScore} из ${QUIZ.length} верных.</p>
      </div>

      <div class="kpi">
        <div><b>${state.quizScore}/${QUIZ.length}</b><span>верных ответов о компании</span></div>
        <div><b class="kpi-taste">${state.flavor ? state.flavor.name : '—'}</b><span>твой вкус</span></div>
      </div>

      <div class="prize"><span class="p-ico">🏭</span><span><b>Экскурсия по производству с дегустацией</b><span>Для участников, дошедших до финала: линия розлива, лаборатория, музей компании.</span></span></div>
      <div class="prize"><span class="p-ico">🎁</span><span><b>Мерч «Очаково»</b><span>Шоппер, кружка, стикерпак. Топ-3 вуза получают набор на команду.</span></span></div>
      <div class="prize"><span class="p-ico">📄</span><span><b>Собеседование вне очереди</b><span>Лучшим — приглашение в отдел подбора на практике с марта по август.</span></span></div>

      <button class="btn btn-primary" data-go="s-form">Записаться на практику →</button>
      <button class="btn btn-ghost" data-go="s-board">Рейтинг вузов</button>
      <button class="btn btn-ghost" data-go="s-mentor">Что взять на первый день</button>

      <p class="note">Демо-прототип: баллы и рейтинг хранятся локально. В продуктивной версии результат пишется в профиль кандидата и в дашборд HR.</p>`;
  }

  /* ---------------- форма ---------------- */

  function renderVacancies() {
    const track = TRACKS.find(t => t.id === state.track) || TRACKS[1];
    $('#vacancy-select').innerHTML = track.vacancies
      .map(v => `<option>${v}</option>`).join('') + '<option>Пока не выбрал(а)</option>';
  }

  function age(dob) {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return -1;
    const t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
    return a;
  }

  function setErr(input, msg) {
    input.classList.toggle('bad', !!msg);
    const em = input.parentElement.querySelector('.err');
    if (em) em.textContent = msg || '';
    return !msg;
  }

  function submitLead(e) {
    e.preventDefault();
    const f = e.target;
    const fio = f.fio.value.trim();
    const phone = f.phone.value.trim();
    const dob = f.dob.value;
    const uni = f.uni.value.trim();
    const digits = phone.replace(/\D/g, '');
    const a = age(dob);
    let ok = true;

    ok = setErr(f.fio, fio.split(/\s+/).length < 2 ? 'Укажи фамилию и имя' : '') && ok;
    ok = setErr(f.phone, digits.length < 10 ? 'Нужен телефон из 10–11 цифр' : '') && ok;
    ok = setErr(f.dob, a < 18 ? 'Берём только с 18 лет' : a > 60 ? 'Проверь дату рождения' : '') && ok;
    ok = setErr(f.uni, uni.length < 2 ? 'Укажи вуз или колледж' : '') && ok;
    const consentErr = $('#consent-err');
    if (!f.consent.checked) { consentErr.textContent = 'Нужно согласие на обработку данных'; ok = false; }
    else consentErr.textContent = '';

    if (!ok) return;

    const track = TRACKS.find(t => t.id === state.track) || TRACKS[1];
    const lead = {
      id: 'ОЧ-' + Date.now().toString(36).toUpperCase().slice(-6),
      createdAt: new Date().toISOString(),
      fio, phone, dob, age: a, uni,
      course: f.course.value,
      city: f.city.value,
      vacancy: f.vacancy.value,
      ready: f.ready.value,
      track: track.name,
      points: state.points,
      quiz: state.quizScore + '/' + QUIZ.length,
      flavor: state.flavor ? state.flavor.name : null,
      consent: true
    };

    const leads = load(LS_LEADS, []);
    leads.unshift(lead);
    save(LS_LEADS, leads);
    state.lead = lead;
    persist();

    $('#done-body').innerHTML = `
      <p class="lead">Заявка №${lead.id} ушла в отдел подбора. Наставник напишет в течение рабочего дня
        и пришлёт ссылку на чек-лист первого дня.</p>
      <div class="ticket">
        <div class="t-row"><span>Заявка</span><b>№${lead.id}</b></div>
        <div class="t-row"><span>Кандидат</span><b>${lead.fio}</b></div>
        <div class="t-row"><span>Вакансия</span><b>${lead.vacancy}</b></div>
        <div class="t-row"><span>Трек</span><b>${lead.track}</b></div>
        <div class="t-row"><span>Готовность выйти</span><b>${lead.ready}</b></div>
        <div class="t-row"><span>Результат игры</span><b>${lead.points} баллов · квиз ${lead.quiz}</b></div>
      </div>`;
    go('s-done');
  }

  /* ---------------- рейтинг ---------------- */

  function renderBoard() {
    const uni = state.lead ? state.lead.uni : 'Твой вуз';
    const rows = BOARD.map(b => ({ ...b, me: false }));
    const mine = rows.find(r => r.uni.toLowerCase() === uni.toLowerCase());
    if (mine) {
      mine.me = true;
      mine.pts = Math.max(mine.pts, state.points);
      if (state.lead) mine.city = state.lead.city;
    } else {
      rows.push({ uni, city: state.lead ? state.lead.city : '—', pts: state.points, me: true });
    }
    rows.sort((a, b) => b.pts - a.pts);

    $('#board-body').innerHTML = `
      <div class="board">
        ${rows.map((r, i) => `
          <div class="b-row ${r.me ? 'me' : ''}">
            <span class="b-n">${i + 1}</span>
            <span class="b-uni">${r.uni}${r.me ? ' · ты' : ''}<small>${r.city} · ${r.me ? 'твой результат' : 'средний балл команды'}</small></span>
            <span class="b-p">${r.pts}</span>
          </div>`).join('')}
      </div>
      <p class="note">Рейтинг считается по среднему баллу за смены — один сильный участник поднимает весь вуз.
        Это то, что делает игру вирусной внутри учебного заведения.</p>`;
  }

  /* ---------------- наставник ---------------- */

  function renderMentor() {
    const checks = load(LS_CHECK, {});
    $('#mentor-body').innerHTML = `
      <div class="checklist">
        ${CHECKLIST.map((c, i) => `
          <label class="cl-item ${checks[i] ? 'done' : ''}" data-i="${i}">
            <input type="checkbox" ${checks[i] ? 'checked' : ''}>
            <span class="cl-text"><b>${c.t}</b><span>${c.d}</span></span>
          </label>`).join('')}
      </div>
      <button class="btn btn-dark" id="btn-remind">Напомнить в VK / Telegram</button>
      <button class="btn btn-ghost" data-go="s-form">Оставить заявку, если ещё не оставил</button>`;

    $$('#mentor-body .cl-item input').forEach(inp => inp.addEventListener('change', () => {
      const i = inp.closest('.cl-item').dataset.i;
      const checks2 = load(LS_CHECK, {});
      checks2[i] = inp.checked;
      save(LS_CHECK, checks2);
      inp.closest('.cl-item').classList.toggle('done', inp.checked);
    }));

    $('#btn-remind').addEventListener('click', e => flash(e.target, 'Напоминания включены'));
  }

  /* ---------------- пульт HR ---------------- */

  function renderHR() {
    const leads = load(LS_LEADS, []);
    const max = FUNNEL[0].v;

    $('#hr-body').innerHTML = `
      <div class="kpi">
        <div><b>701 ₽</b><span>стоимость заявки в модели пилота</span></div>
        <div><b>+41</b><span>найм за 6 недель пилота</span></div>
        <div><b>0,085%</b><span>конверсия охвата в найм</span></div>
        <div><b>12%</b><span>квиз → заявка</span></div>
      </div>

      <div class="field-label">Воронка пилота (модель, 6 недель)</div>
      <div class="hr-funnel">
        ${FUNNEL.map(f => `
          <div class="fr">
            <div class="fr-top"><span>${f.k}</span><b>${f.v.toLocaleString('ru-RU')} ${f.pct ? '· ' + f.pct : ''}</b></div>
            <div class="fr-bar"><i style="width:${Math.max(3, Math.sqrt(f.v / max) * 100)}%"></i></div>
          </div>`).join('')}
      </div>

      <div class="field-label">Заявки из прототипа: ${leads.length}</div>
      ${leads.length ? leads.map(l => `
        <div class="lead-item">
          <b>${l.fio}</b> · ${l.age} лет<br>
          <span>${l.uni}, ${l.course} курс · ${l.city}</span>
          <div class="l-meta">${l.vacancy} · ${l.ready} · ${l.points} баллов · квиз ${l.quiz}</div>
          <span class="tag">${l.track} · №${l.id}</span>
        </div>`).join('') : '<p class="note">Пока пусто — пройди игру и оставь заявку, она появится здесь.</p>'}

      <button class="btn btn-ghost" id="btn-export">Выгрузить заявки в JSON</button>
      <button class="btn btn-ghost" id="btn-reset">Сбросить демо-данные</button>

      <div class="quote">Что мерим в продукте: охват и K-фактор (приглашения друзей),
        долю дошедших до 2-й смены, конверсию квиз → заявка, долю 18–26 в заявках,
        стоимость заявки и найма по каналам (QR в вузах, посты в чатах, VK-реклама).
        Все события уходят в единую аналитику с UTM-метками по каналу.</div>`;

    $('#btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ochakovo-leads.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    });

    $('#btn-reset').addEventListener('click', () => {
      if (!confirm('Сбросить прогресс и заявки?')) return;
      localStorage.removeItem(LS_STATE);
      localStorage.removeItem(LS_LEADS);
      localStorage.removeItem(LS_CHECK);
      location.reload();
    });
  }

  /* ---------------- события ---------------- */

  document.addEventListener('click', e => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) { go(goEl.dataset.go); return; }
  });

  $('#btn-back').addEventListener('click', back);
  $('#btn-create').addEventListener('click', renderFlavorResult);
  $('#lead-form').addEventListener('submit', submitLead);

  // подсказки в поле телефона
  $('#lead-form').phone.addEventListener('input', e => {
    let v = e.target.value.replace(/[^\d+]/g, '');
    e.target.value = v;
  });

  /* ---------------- старт ---------------- */

  renderTracks();
  renderHistory();
  renderLine();
  renderQuality();
  renderFlavor();
  renderQuiz();
  renderFinal();
  renderVacancies();
  renderMentor();
  renderBoard();
  renderHR();
  $('#topbar').style.display = 'none';
  $('#score').textContent = state.points;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', cssVar('--c-hero-1', '#0086D6'));

  /* ---------------- демо-режим и прямые ссылки ---------------- */
  // index.html?demo=1#s-final — заполненное состояние для показа и скриншотов
  function restoreProgress() {
    if (state.track) {
      $$('#track-list .track').forEach(b => b.classList.toggle('sel', b.dataset.track === state.track));
    }
    if (state.done.history) {
      $$('#hist-list .hist-card').forEach((c, i) => {
        c.classList.add('done');
        const y = c.querySelector(`.year[data-y="${HISTORY[i].year}"]`);
        if (y) y.classList.add('right');
      });
      $('#hist-next').hidden = false;
    }
    if (state.done.line) {
      const i = LINE.findIndex(s => !s.ok);
      const el = $$('#line-grid .stat')[i];
      if (el) el.classList.add('right');
      $('#line-result').textContent = '+30 баллов · с первой попытки';
      $('#line-next').hidden = false;
    }
    if (state.done.quality) {
      const i = SAMPLES.findIndex(s => !s.ok);
      const el = $$('#qual-grid .qual')[i];
      if (el) el.classList.add('right');
      $('#qual-result').textContent = '+30 баллов · с первой попытки';
      $('#qual-next').hidden = false;
    }
  }
  restoreProgress();

  function seedDemo() {
    state.track = 'tech';
    state.points = 245;
    state.quizScore = 5;
    state.done = { track: true, history: true, line: true, quality: true, flavor: true, quiz: true };
    state.flavorPts = true;
    state.flavor = {
      name: 'Имбирный квас',
      base: 'Квас',
      ings: ['Имбирь', 'Облепиха', 'Мята'],
      profile: [4, 3, 4, 6]
    };
    state.lead = {
      id: 'ОЧ-7F2K1A',
      createdAt: new Date().toISOString(),
      fio: 'Иванова Анна Сергеевна',
      phone: '+7 999 000-00-00',
      dob: '2004-05-14',
      age: 22,
      uni: 'МГУПП',
      course: '4',
      city: 'Москва',
      vacancy: 'Химик-лаборант (от 60 000 ₽)',
      ready: 'На практику с марта',
      track: 'Технолог / химик-лаборант',
      points: 245,
      quiz: '5/5',
      flavor: 'Имбирный квас',
      consent: true
    };
    persist();

    const leads = load(LS_LEADS, []);
    if (!leads.length) {
      save(LS_LEADS, [state.lead, {
        id: 'ОЧ-6C1B9D', createdAt: new Date(Date.now() - 36e5).toISOString(),
        fio: 'Петров Максим', age: 21, uni: 'РХТУ им. Д. И. Менделеева', course: '3',
        city: 'Москва', vacancy: 'Оператор линии розлива (от 70 000 ₽)',
        ready: 'В течение 2 недель', track: 'Инженер', points: 210, quiz: '4/5'
      }, {
        id: 'ОЧ-5A8H2C', createdAt: new Date(Date.now() - 72e5).toISOString(),
        fio: 'Ким Алиса', age: 19, uni: 'Политехнический колледж им. П. А. Овчинникова', course: '2',
        city: 'Московская область', vacancy: 'Оператор склада (от 60 000 ₽)',
        ready: 'К высокому сезону (лето)', track: 'Оператор / склад', points: 168, quiz: '3/5'
      }]);
    }
  }

  /* ---------------- автотест воронки (?selftest=1) ---------------- */
  // Прогоняет весь путь игрока кликами и печатает отчёт в <pre id="selftest-out">
  function selfTest() {
    const log = [];
    const click = sel => {
      const el = document.querySelector(sel);
      if (!el) { log.push('MISS ' + sel); return null; }
      el.click();
      return el;
    };
    go('s-track', false);
    click('#track-list .track[data-track="tech"]');
    go('s-history', false);
    HISTORY.forEach(h => {
      const b = document.querySelector('#hist-list .year[data-y="' + h.year + '"]');
      if (b) b.click(); else log.push('MISS year ' + h.year);
    });
    go('s-line', false);
    click('#line-grid .stat[data-i="1"]');
    go('s-quality', false);
    click('#qual-grid .qual[data-i="1"]');
    go('s-flavor', false);
    click('#base-list .chip[data-base="kvass"]');
    ['imbir', 'oblepiha', 'myata'].forEach(id => click('#ing-list .chip[data-ing="' + id + '"]'));
    click('#btn-create');
    go('s-quiz', false);
    QUIZ.forEach(() => {
      const opts = $$('#quiz-body .opt');
      if (!opts.length) { log.push('MISS quiz opts'); return; }
      opts[0].click();
      const n = $('#btn-next-q');
      if (n) n.click();
    });
    go('s-form', false);
    const f = $('#lead-form');
    f.fio.value = 'Тестов Тест Тестович';
    f.phone.value = '+7 999 000 11 22';
    f.dob.value = '2003-04-05';
    f.uni.value = 'МГТУ им. Баумана';
    f.consent.checked = true;
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    const leads = load(LS_LEADS, []);
    const ok = !!state.lead && leads.length > 0 && state.quizScore >= 0 && state.points > 0;
    const report = {
      result: ok ? 'SELFTEST PASS' : 'SELFTEST FAIL',
      points: state.points,
      quizScore: state.quizScore,
      flavor: state.flavor ? state.flavor.name : null,
      leadId: state.lead ? state.lead.id : null,
      leads: leads.length,
      screen: current,
      misses: log
    };
    const pre = document.createElement('pre');
    pre.id = 'selftest-out';
    pre.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:9999;background:#fff;' +
      'color:#000;font:10px/1.35 monospace;padding:6px;white-space:pre-wrap;opacity:.97';
    pre.textContent = JSON.stringify(report, null, 2);
    document.body.appendChild(pre);
    document.title = report.result;
  }

  const params = new URLSearchParams(location.search);
  const DEMO = params.get('demo') === '1';
  if (DEMO) seedDemo();
  restoreProgress();

  if (params.get('selftest') === '1') selfTest();
  const hash = location.hash.replace('#', '');
  const target = hash || (DEMO ? 's-final' : '');
  if (target && document.getElementById(target)) {
    if (target === 's-flavor') {
      flavorPick = { base: 'kvass', ings: ['imbir', 'oblepiha', 'myata'] };
      renderFlavor();
      renderFlavorResult();
    }
    go(target, false);
  }

  // браузер прыгает к якорю #s-... — возвращаем страницу наверх
  const toTop = () => window.scrollTo(0, 0);
  window.addEventListener('load', toTop);
  window.addEventListener('hashchange', toTop);
  setTimeout(toTop, 80);
})();
