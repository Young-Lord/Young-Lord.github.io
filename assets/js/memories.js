/* memories.md 的筛选器：别名标签、二级类别、剧透、NSFW、名字搜索。
   配置来自 _data/memories.yml（由 _includes/memories/head.html 注入 window.MEMORIES_CONFIG）。 */
(function () {
  'use strict';

  var PREFS_KEY = 'memories:prefs:v1';
  var CONFIG = window.MEMORIES_CONFIG || {};
  var root = document.documentElement;
  var table = document.getElementById('memories-table');
  var panel = document.getElementById('memories-controls');
  if (!table || !panel || !table.tHead || !table.tBodies.length) { return; }

  var knownLabels = [];
  var groups = CONFIG.alt_name_labels || {};
  Object.keys(groups).forEach(function (name) {
    knownLabels = knownLabels.concat(groups[name] || []);
  });
  var defaults = CONFIG.defaults || {};

  // ---------- 偏好 ----------

  var prefs = {
    // hidden_labels 写 all = 一开始就隐藏全部标签（整列隐藏，见 applyLabels）
    hiddenLabels: defaults.hidden_labels === 'all'
      ? knownLabels.slice()
      : (defaults.hidden_labels || []).slice(),
    hideSubCategory: defaults.hide_sub_category !== false,
    hideSpoiler: defaults.hide_spoiler !== false,
    hideNsfw: !!defaults.hide_nsfw
  };

  try {
    var stored = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}');
    if (Array.isArray(stored.hiddenLabels)) {
      prefs.hiddenLabels = stored.hiddenLabels.filter(function (l) { return knownLabels.indexOf(l) >= 0; });
    }
    ['hideSubCategory', 'hideSpoiler', 'hideNsfw'].forEach(function (key) {
      if (typeof stored[key] === 'boolean') { prefs[key] = stored[key]; }
    });
  } catch (e) { /* 读不出就用默认值 */ }

  function savePrefs() {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) { /* 隐身模式之类，忽略 */ }
  }

  // ---------- 工具 ----------

  var PUNCT = /[\s\u3000*_`~^=+\-—–/\\|&!?.,:;'"“”‘’()（）【】[\]{}<>《》、，。：；！？…·]/g;

  function toHalfWidth(text) {
    return text.replace(/[\uFF01-\uFF5E]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });
  }

  function normalize(text) {
    return toHalfWidth(text).toLowerCase().replace(PUNCT, '');
  }

  // 按分隔符切分 HTML，跳过标签内部的字符
  function splitOutsideTags(html, separator) {
    var parts = [];
    var depth = 0;
    var start = 0;
    for (var i = 0; i < html.length; i++) {
      var ch = html.charAt(i);
      if (ch === '<') { depth++; } else if (ch === '>') { depth = Math.max(0, depth - 1); } else if (ch === separator && depth === 0) {
        parts.push(html.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(html.slice(start));
    return parts;
  }

  var LABEL_RE = /^(?:<[^>]+>\s*)*([^：<>*\s]{1,8})：/;

  function labelOf(segmentHtml) {
    var match = LABEL_RE.exec(segmentHtml.trim());
    return match && knownLabels.indexOf(match[1]) >= 0 ? match[1] : '';
  }

  // ---------- 解析表格 ----------

  var headers = Array.prototype.map.call(table.tHead.rows[0].cells, function (th) {
    return th.textContent.trim();
  });
  var colName = headers.indexOf('名字');
  var colAlt = headers.indexOf('原名字/备注');
  var colCategory = headers.indexOf('类别');

  // 把「日语：**X**；英语：**Y**」拆成带标签的分段，分隔符交给 CSS 生成
  function wrapAltNames(cell) {
    var parts = splitOutsideTags(cell.innerHTML, '；');
    cell.innerHTML = parts.map(function (part) {
      return '<span class="memories-alt" data-label="' + labelOf(part) + '">' + part.trim() + '</span>';
    }).join('');
    return Array.prototype.map.call(cell.querySelectorAll('.memories-alt'), function (el) {
      return { label: el.getAttribute('data-label'), el: el };
    });
  }

  // 把「游戏.FPS」的「.FPS」包起来
  function wrapSubCategories(cell) {
    Array.prototype.slice.call(cell.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) { return; } // 只动文本节点，保留 <nsfw> 等标记
      var fragment = document.createDocumentFragment();
      node.nodeValue.split('/').forEach(function (group, index) {
        if (index) { fragment.appendChild(document.createTextNode('/')); }
        var dot = group.indexOf('.');
        if (dot < 0) {
          fragment.appendChild(document.createTextNode(group));
          return;
        }
        fragment.appendChild(document.createTextNode(group.slice(0, dot)));
        var span = document.createElement('span');
        span.className = 'memories-subcat';
        span.textContent = group.slice(dot);
        fragment.appendChild(span);
      });
      cell.replaceChild(fragment, node);
    });
  }

  var rows = [];
  var labelCounts = {};

  Array.prototype.forEach.call(table.tBodies[0].rows, function (tr) {
    var nameCell = tr.cells[colName];
    var altCell = colAlt >= 0 ? tr.cells[colAlt] : null;
    var categoryCell = colCategory >= 0 ? tr.cells[colCategory] : null;
    if (!nameCell) { return; }

    var segments = altCell ? wrapAltNames(altCell) : [];
    segments.forEach(function (segment) {
      if (segment.label) { labelCounts[segment.label] = (labelCounts[segment.label] || 0) + 1; }
    });

    if (categoryCell) {
      categoryCell.classList.add('memories-cat');
      wrapSubCategories(categoryCell);
    }

    rows.push({
      tr: tr,
      altSegments: segments,
      // 空的 <nsfw></nsfw>（含作者写的 <nsfw />）= 整行 NSFW，CSS 负责隐藏，这里只用来算计数
      nsfwRow: !!tr.querySelector('nsfw:empty'),
      nameText: nameCell.textContent.trim(),
      searchText: normalize(nameCell.textContent + (altCell ? altCell.textContent : '')),
      pinyinFull: '',
      pinyinInitials: ''
    });
  });

  // ---------- 应用偏好 ----------

  var dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);

  function applyLabels() {
    var hidden = prefs.hiddenLabels;
    var css = [];
    if (knownLabels.length && hidden.length >= knownLabels.length && colAlt >= 0) {
      // 所有标签都被隐藏 = 整列隐藏
      var nth = ':nth-child(' + (colAlt + 1) + ')';
      css.push('#memories-table th' + nth + ',#memories-table td' + nth + '{display:none}');
    } else {
      hidden.forEach(function (label) {
        css.push('#memories-table .memories-alt[data-label="' + label + '"]{display:none}');
      });
    }
    dynamicStyle.textContent = css.join('\n');

    // 标记每个单元格里第一个可见分段，避免开头出现多余的「；」
    rows.forEach(function (row) {
      var lead = true;
      row.altSegments.forEach(function (segment) {
        var visible = hidden.indexOf(segment.label) < 0;
        segment.el.classList.toggle('memories-alt--lead', visible && lead);
        if (visible) { lead = false; }
      });
    });
  }

  function applyToggles() {
    root.classList.toggle('memories-show-spoiler', !prefs.hideSpoiler);
    root.classList.toggle('memories-hide-nsfw', prefs.hideNsfw);
    // 「二级类别」的 CSS 默认是 display:none（和剧透一样，没 JS 也不漏内容），
    // 所以这里是 show 类，语义为「不隐藏」
    root.classList.toggle('memories-show-subcat', !prefs.hideSubCategory);
    if (prefs.hideSpoiler) {
      Array.prototype.forEach.call(document.querySelectorAll('spoiler.memories-revealed'), function (el) {
        el.classList.remove('memories-revealed');
      });
    }
    updateCount();
  }

  // ---------- 标签框 ----------

  var tagbox = document.getElementById('memories-tagbox');
  var chipsBox = tagbox.querySelector('.memories-tagbox__chips');
  var allButton = tagbox.querySelector('[data-action="all"]');
  var noneButton = tagbox.querySelector('[data-action="none"]');
  var chips = {};

  function renderTagbox() {
    chipsBox.innerHTML = '';
    knownLabels.forEach(function (label) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'memories-pill';
      chip.setAttribute('data-label', label);
      chip.textContent = label;
      chips[label] = chip;
      chipsBox.appendChild(chip);
    });
    syncTagbox();
  }

  // 只改属性不重建 DOM，否则用键盘按空格切换时焦点会丢
  function syncTagbox() {
    knownLabels.forEach(function (label) {
      var visible = prefs.hiddenLabels.indexOf(label) < 0;
      chips[label].setAttribute('aria-pressed', visible ? 'true' : 'false');
      chips[label].title = (visible ? '隐藏' : '显示') + label + '（' + (labelCounts[label] || 0) + ' 条）';
    });
    // 两个按钮兼当状态指示：已经全开/全关时给个背景色
    var hidden = prefs.hiddenLabels.length;
    allButton.setAttribute('aria-pressed', hidden === 0 ? 'true' : 'false');
    noneButton.setAttribute('aria-pressed', knownLabels.length && hidden >= knownLabels.length ? 'true' : 'false');
  }

  tagbox.addEventListener('click', function (event) {
    var target = event.target.closest('[data-label],[data-action]');
    if (!target) { return; }
    var label = target.getAttribute('data-label');
    var action = target.getAttribute('data-action');
    if (label) {
      var at = prefs.hiddenLabels.indexOf(label);
      if (at < 0) { prefs.hiddenLabels.push(label); } else { prefs.hiddenLabels.splice(at, 1); }
    } else if (action === 'all') {
      prefs.hiddenLabels = [];
    } else if (action === 'none') {
      prefs.hiddenLabels = knownLabels.slice();
    }
    savePrefs();
    applyLabels();
    syncTagbox();
  });

  // ---------- 开关 ----------

  Array.prototype.forEach.call(panel.querySelectorAll('button[data-pref]'), function (button) {
    var key = button.getAttribute('data-pref');
    var sync = function () {
      button.setAttribute('aria-pressed', prefs[key] ? 'true' : 'false');
    };
    sync();
    button.addEventListener('click', function () {
      prefs[key] = !prefs[key];
      sync();
      savePrefs();
      applyToggles();
    });
  });

  // ---------- 剧透 ----------

  function reveal(element) {
    if (element && !root.classList.contains('memories-show-spoiler')) {
      element.classList.add('memories-revealed');
    }
  }

  Array.prototype.forEach.call(document.getElementsByTagName('spoiler'), function (el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', '剧透内容，点击显示');
  });

  document.addEventListener('click', function (event) {
    if (event.target.closest) { reveal(event.target.closest('spoiler')); }
  });

  document.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.tagName === 'SPOILER') {
      event.preventDefault();
      reveal(event.target);
    }
  });

  // ---------- 搜索 ----------

  var input = document.getElementById('memories-search');
  var countBox = document.getElementById('memories-count');
  var searchTimer = null;

  function updateCount() {
    var shown = 0;
    rows.forEach(function (row) {
      if (row.tr.classList.contains('memories-filtered')) { return; }
      if (prefs.hideNsfw && row.nsfwRow) { return; }
      shown++;
    });
    countBox.textContent = shown + ' 条';
  }

  function applySearch() {
    var raw = input.value.trim();
    var tokens = raw ? raw.split(/\s+/).map(normalize).filter(Boolean) : [];
    rows.forEach(function (row) {
      var hit = tokens.every(function (token) {
        return row.searchText.indexOf(token) >= 0 ||
          (row.pinyinFull && row.pinyinFull.indexOf(token) >= 0) ||
          (row.pinyinInitials && row.pinyinInitials.indexOf(token) >= 0);
      });
      row.tr.classList.toggle('memories-filtered', !hit);
    });
    updateCount();
  }

  input.addEventListener('input', function () {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(applySearch, 80);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      input.value = '';
      applySearch();
    }
  });

  // 拼音索引：pinyin-pro 由站点 head 异步加载，好了再补上（不影响普通搜索）
  function buildPinyinIndex() {
    var pinyin = window.pinyinPro && window.pinyinPro.pinyin;
    if (!pinyin) { return false; }
    rows.forEach(function (row) {
      row.pinyinFull = normalize(pinyin(row.nameText, { toneType: 'none', type: 'string' }));
      row.pinyinInitials = normalize(pinyin(row.nameText, { pattern: 'first', toneType: 'none', type: 'string' }));
    });
    return true;
  }

  (function waitForPinyin(tries) {
    if (buildPinyinIndex()) {
      if (input.value.trim()) { applySearch(); }
      return;
    }
    if (tries < 60) {
      window.setTimeout(function () { waitForPinyin(tries + 1); }, 150);
    }
  })(0);

  // ---------- 启动 ----------

  applyLabels();
  renderTagbox();
  applyToggles();

  var query = /[?&]q=([^&]*)/.exec(window.location.search);
  if (query) { input.value = decodeURIComponent(query[1].replace(/\+/g, ' ')); }
  applySearch();
})();
