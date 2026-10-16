(function () {
  var topics = window.DSA_TOPICS || [];
  var questions = window.DSA_QUESTIONS || [];
  var root = document.getElementById('app');
  var labels = {
    concept: 'วิเคราะห์แนวคิด',
    logic: 'วิเคราะห์ข้อความ',
    trace: 'ทำนายผลโค้ด',
    fill: 'เติมโค้ด · เลือก A–D'
  };
  var state = {
    view: 'home',
    mode: '',
    questions: [],
    index: 0,
    answers: {},
    checked: {},
    resultFilter: 'all'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }
  function normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase()
      .replace(/[θΘ]/g, 'theta').replace(/\s+/g, '').replace(/[;{}]/g, '');
  }
  function correct(question, answer) {
    if (answer === undefined || answer === null || answer === '') return false;
    return Number(answer) === Number(question.answer);
  }
  function userAnswer(question, answer) {
    if (answer === undefined || answer === null || answer === '') return 'ยังไม่ได้ตอบ';
    return question.options[Number(answer)];
  }
  function rightAnswer(question) {
    return question.options[question.answer];
  }
  function codeMarkup(code) {
    return esc(code).replace(/____/g, '<span class="blank-mark">____</span>');
  }
  function history() {
    try {
      var saved = JSON.parse(localStorage.getItem('structure-lab-history') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (e) { return []; }
  }
  function saveHistory(item) {
    var items = history();
    items.unshift(item);
    try { localStorage.setItem('structure-lab-history', JSON.stringify(items.slice(0, 20))); } catch (e) {}
  }
  function drawWithoutRecentRepeats(topicId, pool, count, modeKey) {
    var key = 'structure-lab-cycle-v2';
    var saved = {};
    var valid = Object.create(null);
    var picked = [];
    var pickedIds = Object.create(null);
    var deferred = [];
    pool.forEach(function (item) { valid[item.id] = item; });
    try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { saved = {}; }
    if (!saved[modeKey]) saved[modeKey] = {};
    var queue = Array.isArray(saved[modeKey][topicId])
      ? saved[modeKey][topicId].filter(function (id, index, list) {
          return valid[id] && list.indexOf(id) === index;
        })
      : [];
    if (!queue.length) queue = shuffle(pool).map(function (item) { return item.id; });

    var target = Math.min(count, pool.length);
    while (picked.length < target) {
      if (!queue.length) {
        deferred = picked.map(function (item) { return item.id; });
        queue = shuffle(pool.filter(function (item) { return !pickedIds[item.id]; }))
          .map(function (item) { return item.id; });
      }
      var nextId = queue.shift();
      if (!nextId || pickedIds[nextId]) continue;
      pickedIds[nextId] = true;
      picked.push(valid[nextId]);
    }

    saved[modeKey][topicId] = queue.concat(deferred);
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
    return picked;
  }
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    root.focus({ preventScroll: true });
  }

  function renderHome() {
    state.view = 'home';
    var last = history()[0];
    var topicCards = topics.map(function (topic) {
      return '<button class="topic-card" data-topic="' + esc(topic.id) + '" aria-label="เริ่มฝึก ' + esc(topic.title) + '">' +
        '<span><span class="topic-card-top"><span class="topic-icon">' + esc(topic.icon) + '</span><span class="topic-count">40 QUESTIONS</span></span>' +
        '<h3>' + esc(topic.title) + '</h3><p>' + esc(topic.description) + '</p></span>' +
        '<span class="topic-card-bottom"><span class="topic-difficulty">Medium · Challenging</span><span class="topic-start">Practice this topic <span>↗</span></span></span></button>';
    }).join('');

    root.innerHTML =
      '<div class="page-wrap home-view">' +
        '<section class="hero"><div class="hero-copy-wrap">' +
          '<div class="eyebrow">STUDY SYSTEM <span>·</span> LECTURE 01—11</div>' +
          '<h1>เข้าใจ <span class="accent">logic</span><br>ก่อนท่องจำ</h1>' +
          '<p class="hero-copy">ฝึกคิดกับ <strong>Data Structures &amp; Algorithms</strong> ผ่านการเลือกโครงสร้างที่เหมาะ ไล่โค้ดทีละบรรทัด และเติมส่วนที่ขาด มีเฉลยอธิบายทุกข้อ</p>' +
          '<div class="hero-actions"><button class="button-primary" data-action="exam">เริ่มข้อสอบ 50 ข้อ <span class="arrow">↗</span></button>' +
          '<a class="button-secondary" href="#topics" data-action="topics">เลือกฝึกตามหมวด <span>↓</span></a></div>' +
        '</div><div class="hero-visual" aria-hidden="true"><div class="hero-orbit"><i class="hero-orbit-dot"></i></div>' +
          '<div class="visual-card"><div class="visual-card-top"><span>DATA STRUCTURE / MAP</span><span class="live-badge">● READY TO TRACE</span></div>' +
            '<div class="node-map"><svg viewBox="0 0 330 145" role="presentation">' +
              '<g stroke="#738579" stroke-width="1.4" fill="none"><path d="M165 31 L88 77 M165 31 L243 77 M88 87 L49 124 M88 87 L126 124 M243 87 L205 124 M243 87 L282 124"/></g>' +
              '<g fill="#d7f078" stroke="#25332f" stroke-width="3"><circle cx="165" cy="28" r="17"/><circle cx="88" cy="78" r="17"/><circle cx="243" cy="78" r="17"/><circle cx="49" cy="125" r="14"/><circle cx="126" cy="125" r="14"/><circle cx="205" cy="125" r="14"/><circle cx="282" cy="125" r="14"/></g>' +
              '<g fill="#25332f" font-family="monospace" font-size="11" text-anchor="middle" dominant-baseline="central"><text x="165" y="28">A</text><text x="88" y="78">B</text><text x="243" y="78">C</text><text x="49" y="125">D</text><text x="126" y="125">E</text><text x="205" y="125">F</text><text x="282" y="125">G</text></g>' +
              '<circle cx="165" cy="28" r="24" fill="none" stroke="#d7f078" stroke-opacity=".33"/></svg></div>' +
            '<div class="visual-label"><span>TRACE THE RELATIONSHIPS</span><strong>01 / 11</strong></div></div>' +
          '<div class="visual-sticker sticker-code">head → node<br><b>next</b> → node<br>tail → null</div><div class="visual-sticker sticker-index">O(log n) <span>↗</span></div></div></section>' +
        '<section class="stats-strip" aria-label="สถิติคลังข้อสอบ">' +
          '<div class="stat"><span class="stat-number">400</span><span class="stat-copy"><strong>โจทย์ในคลัง</strong><span>มีทั้งแนวคิดและ code trace</span></span></div>' +
          '<div class="stat"><span class="stat-number">50</span><span class="stat-copy"><strong>ข้อ / รอบสอบ</strong><span>สุ่มครบทุกหมวด หมวดละ 5 ข้อ</span></span></div>' +
          '<div class="stat"><span class="stat-number">10</span><span class="stat-copy"><strong>หมวดเนื้อหา</strong><span>ตั้งแต่ Arrays จนถึง Graphs</span></span></div></section>' +
        '<section id="topics" class="topic-section"><div class="section-heading"><div><div class="section-kicker">PICK A CONCEPT</div><h2>เลือกหมวดที่อยากฝึก</h2></div>' +
          '<p>แต่ละหมวดมี 40 ข้อ ฝึกครั้งละ 15 ข้อ สลับข้อวิเคราะห์ แนวคิด ทำนายผลโค้ด และเติมโค้ดแบบเลือก A–D</p></div>' +
          '<div class="topic-grid">' + topicCards + '</div></section>' +
        '<section class="examband"><div class="examband-copy"><span>MOCK EXAM / 50 QUESTIONS</span>' +
          '<h3>' + (last ? 'คะแนนล่าสุด ' + last.score + '/' + last.total : 'พร้อมลองทำข้อสอบหรือยัง?') + '</h3>' +
          '<p>' + (last ? 'แต่ละหมวดจะพักข้อที่เพิ่งออกไว้จนกว่าจะหมุนคลังครบ' : 'หนึ่งรอบมี 50 ข้อ ครอบคลุมทุกหมวด และดูเฉลยหลังส่งข้อสอบ') + '</p></div>' +
          '<button class="button-primary" data-action="exam">สุ่มข้อสอบรอบใหม่ <span class="arrow">↗</span></button></section>' +
      '</div>';
  }

  function beginPractice(topicId) {
    var pool = questions.filter(function (item) { return item.topicId === topicId; });
    if (!pool.length) return;
    state.mode = 'practice';
    state.questions = drawWithoutRecentRepeats(topicId, pool, 15, 'practice');
    state.index = 0;
    state.answers = {};
    state.checked = {};
    renderSession();
    scrollTop();
  }
  function beginExam() {
    var picked = [];
    topics.forEach(function (topic) {
      var pool = questions.filter(function (item) { return item.topicId === topic.id; });
      picked = picked.concat(drawWithoutRecentRepeats(topic.id, pool, 5, 'exam'));
    });
    state.mode = 'exam';
    state.questions = shuffle(picked);
    state.index = 0;
    state.answers = {};
    state.checked = {};
    renderSession();
    scrollTop();
  }

  function choiceMarkup(question, index, selected) {
    var active = selected !== undefined && Number(selected) === index;
    var key = String.fromCharCode(65 + index);
    return '<button type="button" class="answer-choice' + (active ? ' selected' : '') + '" data-choice="' + index + '" aria-pressed="' + active + '">' +
      '<span class="choice-key">' + key + '</span><span>' + esc(question.options[index]) + '</span></button>';
  }

  function renderSession() {
    state.view = 'session';
    if (!state.questions.length) { renderHome(); return; }
    var q = state.questions[state.index];
    var total = state.questions.length;
    var pos = state.index + 1;
    var answer = state.answers[q.id];
    var checked = !!state.checked[q.id];
    var isRight = checked && correct(q, answer);
    var title = state.mode === 'exam' ? 'ข้อสอบจำลอง · สุ่มครบทุกหมวด' : 'ฝึกตามหมวด · ' + q.topicTitle;
    var controls;

    if (state.mode === 'practice') {
      controls = '<button type="button" class="button-dark" data-action="' + (checked ? 'next' : 'check') + '">' +
        (checked ? (pos === total ? 'จบการฝึก' : 'ข้อต่อไป') : 'ตรวจคำตอบ') + ' <span>' + (checked ? '→' : '↗') + '</span></button>' +
        (!checked ? '<button type="button" class="button-light" data-action="next">ข้ามข้อนี้ →</button>' : '');
    } else {
      controls = '<button type="button" class="button-dark" data-action="' + (pos === total ? 'submit-exam' : 'next') + '">' +
        (pos === total ? 'ส่งข้อสอบ' : 'ข้อถัดไป') + ' <span>↗</span></button>';
    }

    var input = '<div class="answer-list" role="group" aria-label="ตัวเลือกคำตอบ A ถึง D">' +
      q.options.map(function (_, i) { return choiceMarkup(q, i, answer); }).join('') + '</div>';

    var feedback = checked && state.mode === 'practice'
      ? '<div class="session-feedback ' + (isRight ? 'correct' : 'incorrect') + '" role="status">' +
        '<strong>' + (isRight ? 'ถูกต้อง · มองเห็นหลักคิดแล้ว' : 'ยังไม่ตรง ลองเทียบกับเหตุผลนี้') + '</strong>' +
        '<div>เฉลย ' + String.fromCharCode(65 + Number(q.answer)) + ': ' +
          (q.type === 'fill' ? '<code>' + esc(rightAnswer(q)) + '</code>' : esc(rightAnswer(q))) + '</div>' +
        '<div>' + esc(q.explanation) + '</div></div>'
      : '';

    var nav = state.questions.map(function (item, i) {
      var has = state.answers[item.id] !== undefined && state.answers[item.id] !== '';
      var cls = (i === state.index ? 'current ' : '') + (has ? 'answered' : '');
      return '<button type="button" class="' + cls + '" data-jump="' + i + '" aria-label="ไปข้อ ' + (i + 1) + '" aria-current="' + (i === state.index ? 'step' : 'false') + '">' +
        String(i + 1).padStart(2, '0') + '</button>';
    }).join('');
    var answered = Object.keys(state.answers).filter(function (key) { return state.answers[key] !== ''; }).length;
    var code = q.code ? '<div class="code-panel"><pre>' + codeMarkup(q.code) + '</pre></div>' : '';
    var difficultyClass = q.difficulty === 'Challenging' ? ' level-hard' : '';

    root.innerHTML = '<div class="page-wrap session-view">' +
      '<div class="session-top"><button type="button" class="back-button" data-action="home">← กลับหน้าหลัก</button>' +
      '<div class="session-label"><strong>' + esc(title) + '</strong>' +
      (state.mode === 'exam' ? 'เลือกคำตอบให้ครบ แล้วส่งเพื่อดูเฉลย' : 'ตอบแล้วกดตรวจ เพื่ออ่านเหตุผลประกอบ') + '</div></div>' +
      '<div class="session-progress" aria-label="ความคืบหน้า ' + pos + ' จาก ' + total + '"><span style="width:' + Math.round(pos / total * 100) + '%"></span></div>' +
      '<div class="session-layout"><article class="question-card"><div class="question-meta">' +
      '<span class="tag">' + esc(q.topicTitle) + '</span><span class="tag type-tag">' + esc(labels[q.type]) + '</span>' +
      '<span class="tag' + difficultyClass + '">' + esc(q.difficulty) + '</span><span class="question-number">Q ' + String(pos).padStart(2, '0') + ' / ' + total + '</span></div>' +
      '<h1 class="question-prompt">' + esc(q.prompt) + '</h1>' + code + input + feedback +
      '<div class="session-actions"><button type="button" class="button-light" data-action="previous"' + (state.index === 0 ? ' disabled' : '') + '>← ก่อนหน้า</button>' +
      controls + '</div></article>' +
      '<aside class="navigator-card"><h3>ข้อในรอบนี้</h3><p>' + answered + '/' + total + ' ตอบแล้ว</p>' +
      '<div class="navigator-grid">' + nav + '</div><div class="navigator-legend"><span><i class="legend-dot"></i>ตอบแล้ว</span><span><i class="legend-dot empty"></i>ยังไม่ตอบ</span></div>' +
      '<div class="exam-note">' + (state.mode === 'exam'
        ? 'ข้อสอบสุ่ม 5 ข้อจากแต่ละหมวด รวม 50 ข้อ เฉลยแสดงหลังส่งข้อสอบ'
        : 'ฝึก 15 ข้อจากคลัง 40 ข้อ โดยพักข้อที่เพิ่งทำแล้วไว้ก่อน') + '</div></aside></div></div>';

  }

  function choose(index) {
    var q = state.questions[state.index];
    if (!q || state.checked[q.id]) return;
    state.answers[q.id] = index;
    renderSession();
  }
  function checkCurrent() {
    var q = state.questions[state.index];
    if (!q || state.mode !== 'practice' || state.checked[q.id]) return;
    if (state.answers[q.id] === undefined) return;
    state.checked[q.id] = true;
    renderSession();
  }
  function goTo(index) {
    if (index < 0 || index >= state.questions.length) return;
    state.index = index;
    renderSession();
    scrollTop();
  }
  function next() {
    var q = state.questions[state.index];
    if (state.mode === 'practice' && state.checked[q.id] && state.index === state.questions.length - 1) {
      finish(); return;
    }
    if (state.mode === 'practice' && !state.checked[q.id] && state.index === state.questions.length - 1) {
      finish(); return;
    }
    if (state.index < state.questions.length - 1) goTo(state.index + 1);
  }
  function previous() { goTo(state.index - 1); }

  function submitExam() {
    var missing = state.questions.filter(function (q) {
      return state.answers[q.id] === undefined || state.answers[q.id] === '';
    }).length;
    if (missing && !window.confirm('ยังมี ' + missing + ' ข้อที่ไม่ได้ตอบ ต้องการส่งข้อสอบเลยหรือไม่?')) return;
    finish();
  }
  function finish() {
    var total = state.questions.length;
    var score = state.questions.filter(function (q) { return correct(q, state.answers[q.id]); }).length;
    var result = {
      mode: state.mode,
      topicTitle: state.mode === 'practice' ? (state.questions[0] ? state.questions[0].topicTitle : '') : 'ข้อสอบจำลอง',
      questions: state.questions.slice(),
      answers: Object.assign({}, state.answers),
      score: score,
      total: total,
      date: new Date().toISOString()
    };
    if (state.mode === 'exam') saveHistory({ score: score, total: total, date: result.date, mode: 'exam' });
    renderResult(result);
    scrollTop();
  }

  function message(percent) {
    if (percent >= 90) return ['แม่นมาก · พร้อมอธิบายเหตุผลได้แล้ว', 'รักษาวิธีคิดทีละขั้นไว้ แล้วลองสุ่มชุดใหม่'];
    if (percent >= 75) return ['พื้นฐานแน่นขึ้นมาก', 'ทบทวนข้อที่พลาด แล้วลองอีกครั้งให้คล่อง'];
    if (percent >= 50) return ['เริ่มเห็นรูปแบบแล้ว', 'เปิดเฉลยดูจุดที่ logic พลิก แล้วกลับไปฝึกหมวดนั้น'];
    return ['รอบนี้คือแผนที่สำหรับการทบทวน', 'ดูเหตุผลในแต่ละข้อ แล้วเลือกฝึกตามหมวดอีกครั้ง'];
  }
  function reviewMarkup(q, answer, index) {
    var ok = correct(q, answer);
    return '<details class="review-item" data-review-item data-correct="' + ok + '"' + (!ok && index < 3 ? ' open' : '') + '>' +
      '<summary><span class="review-status ' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓' : '×') + '</span>' +
      '<span class="review-title">' + esc(q.prompt) + '</span><span class="review-hint">' + esc(q.topicTitle) + '</span></summary>' +
      '<div class="review-body"><p class="review-prompt">' + esc(q.prompt) + '</p>' +
      (q.code ? '<pre class="review-code">' + codeMarkup(q.code) + '</pre>' : '') +
      '<div class="review-answer"><strong>คำตอบของคุณ:</strong> ' + esc(userAnswer(q, answer)) + '</div>' +
      (!ok ? '<div class="review-answer"><strong>คำตอบที่ถูก:</strong> ' + esc(rightAnswer(q)) + '</div>' : '') +
      '<div class="review-explanation">' + esc(q.explanation) + '</div></div></details>';
  }
  function renderResult(result) {
    state.view = 'result';
    var percent = result.total ? Math.round(result.score / result.total * 100) : 0;
    var text = message(percent);
    var cards = topics.map(function (topic) {
      var group = result.questions.filter(function (q) { return q.topicId === topic.id; });
      if (!group.length) return '';
      var score = group.filter(function (q) { return correct(q, result.answers[q.id]); }).length;
      return '<div class="breakdown-card"><span>' + esc(topic.title) + '</span><strong>' + score + '/' + group.length + '</strong></div>';
    }).join('');
    var reviews = result.questions.map(function (q, i) { return reviewMarkup(q, result.answers[q.id], i); }).join('');
    root.innerHTML = '<div class="page-wrap result-view"><section class="result-hero"><div>' +
      '<div class="result-eyebrow">' + (result.mode === 'exam' ? 'EXAM COMPLETE' : 'PRACTICE COMPLETE') + ' · ' + esc(result.topicTitle) + '</div>' +
      '<h1>' + esc(text[0]) + '</h1><p>' + esc(text[1]) + '</p></div>' +
      '<div class="score-ring" style="--score:' + percent + '%"><span>' + percent + '%<small>' + result.score + ' / ' + result.total + '</small></span></div></section>' +
      '<div class="result-summary"><span class="result-chip">ตอบถูก <strong>' + result.score + '</strong></span>' +
      '<span class="result-chip">ตอบผิดหรือเว้นว่าง <strong>' + (result.total - result.score) + '</strong></span>' +
      '<span class="result-chip">' + (result.mode === 'exam' ? 'ข้อสอบจำลอง' : 'แบบฝึกตามหมวด') + '</span></div>' +
      (result.mode === 'exam' ? '<div class="section-kicker">SCORE BY TOPIC</div><section class="breakdown">' + cards + '</section>' : '') +
      '<div class="review-tools"><h2>ทบทวนคำตอบ <span class="section-kicker">/ ' + result.total + ' QUESTIONS</span></h2>' +
      '<div class="filter-buttons" role="group" aria-label="กรองคำตอบ"><button class="filter-button active" data-filter="all">ทั้งหมด</button>' +
      '<button class="filter-button" data-filter="wrong">ข้อที่พลาด</button></div></div><div class="review-list">' + reviews + '</div>' +
      '<div class="hero-actions" style="margin-top:28px"><button class="button-primary" data-action="exam">สุ่มสอบอีก 50 ข้อ <span class="arrow">↗</span></button>' +
      '<button class="button-secondary" data-action="home">กลับหน้าหลัก</button></div></div>';
    state.resultFilter = 'all';
    applyFilter();
  }
  function applyFilter() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-review-item]'), function (item) {
      item.hidden = state.resultFilter === 'wrong' && item.dataset.correct === 'true';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-filter]'), function (button) {
      button.classList.toggle('active', button.dataset.filter === state.resultFilter);
    });
  }

  document.addEventListener('click', function (event) {
    var choice = event.target.closest('[data-choice]');
    if (choice) { choose(Number(choice.dataset.choice)); return; }
    var topic = event.target.closest('[data-topic]');
    if (topic) { beginPractice(topic.dataset.topic); return; }
    var filter = event.target.closest('[data-filter]');
    if (filter) {
      state.resultFilter = filter.dataset.filter;
      applyFilter();
      return;
    }
    var jump = event.target.closest('[data-jump]');
    if (jump) { goTo(Number(jump.dataset.jump)); return; }
    var action = event.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'home') {
      if (state.view === 'session' && state.mode === 'exam' && Object.keys(state.answers).length &&
          !window.confirm('ออกจากข้อสอบรอบนี้หรือไม่? คำตอบที่ยังไม่ส่งจะหายไป')) return;
      renderHome(); scrollTop();
    } else if (action.dataset.action === 'topics') {
      event.preventDefault();
      var section = document.getElementById('topics');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    } else if (action.dataset.action === 'exam') beginExam();
    else if (action.dataset.action === 'check') checkCurrent();
    else if (action.dataset.action === 'next') next();
    else if (action.dataset.action === 'previous') previous();
    else if (action.dataset.action === 'submit-exam') submitExam();
  });

  renderHome();
})();
