(function () {
  'use strict';

  const data = window.EMBEDDED_ACTIVITY_DATA;
  if (!data) return;

  // 逐项录入用户提供的“协同领域分类结果”Excel（Sheet1）统计值。
  // 2026 年 1—7 月五维月度平均得分占比（来自月度活跃度数据）。
  const totals = [
    ['资源共享', 20.214, '#18baf3'], ['人才培养', 13.914, '#9068dd'],
    ['办学合作', 13.914, '#3eb576'], ['产教科教融合', 48.586, '#ff9410'],
    ['治理机制', 30.029, '#ffd51a']
  ];
  const totalEvents = totals.reduce((sum, [, value]) => sum + value, 0);
  const chartData = totals.map(([name, value, color]) => ({
    name, value, percent: value / totalEvents * 100, itemStyle: { color },
    labelLine: { lineStyle: { color, width: 1.5 } }
  }));

  const pieRoot = document.getElementById('jjj-category-pie');
  if (pieRoot && window.echarts) {
    const chart = window.echarts.init(pieRoot, null, { renderer: 'canvas' });
    chart.setOption({
      tooltip: { trigger: 'item', formatter: params => `${params.name}<br/>2026 年月度平均得分：${params.data.value.toFixed(2)}<br/>占比：${params.data.percent.toFixed(2)}%` },
      title: {
        text: '五维占比', left: '47%', top: '42%', textAlign: 'center',
        textStyle: { color: '#eff8ff', fontSize: 17, fontWeight: 700, lineHeight: 25 }
      },
      series: [{
        type: 'pie', radius: ['40%', '58%'], center: ['47%', '52%'], avoidLabelOverlap: false,
        itemStyle: { borderColor: '#0a203e', borderWidth: 3 },
        label: { show: true, color: '#d9ebf8', fontSize: 9, formatter: params => `${params.name} ${params.percent.toFixed(2)}%` },
        labelLine: { show: true, length: 6, length2: 10, lineStyle: { width: 1.5 } },
        labelLayout: params => params.labelRect.x < params.rect.x
          ? { x: 12, align: 'left', moveOverlap: 'shiftY' }
          : { moveOverlap: 'shiftY' },
        data: chartData
      }]
    });
    new ResizeObserver(() => chart.resize()).observe(pieRoot);
  }

  const newsRoot = document.getElementById('jjj-news-ticker');
  if (newsRoot) {
    const recentNews = window.JJJ_NEWS_DATA;
    if (!Array.isArray(recentNews)) {
      newsRoot.textContent = '新闻数据加载失败';
      console.error('近期新闻数据未加载：window.JJJ_NEWS_DATA 不存在或格式无效。');
    } else {
      const latest = recentNews.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
      const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
      const itemHtml = news => {
        const url = String(news.url || '').trim();
        const validUrl = /^https?:\/\//i.test(url);
        const content = `<span class="jjj-news-item__tag">近期动态</span><div><strong>${escapeHtml(news.title)}</strong><small>${escapeHtml(news.date)}${news.source ? ` · ${escapeHtml(news.source)}` : ''}</small></div>`;
        return validUrl
          ? `<a class="jjj-news-item" title="${escapeHtml(news.title)}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
          : `<article class="jjj-news-item jjj-news-item--disabled" title="${escapeHtml(news.title)}">${content}</article>`;
      };
      newsRoot.innerHTML = `<div class="jjj-news-ticker__track">${latest.map(itemHtml).join('')}${latest.map(itemHtml).join('')}</div>`;
      const track = newsRoot.firstElementChild;
      const itemHeight = 64;
      let itemIndex = 0;
      let paused = false;
      const move = () => {
        if (paused || !track) return;
        itemIndex += 1;
        track.style.transition = 'transform .55s ease';
        track.style.transform = `translateY(-${itemIndex * itemHeight}px)`;
        if (itemIndex === latest.length) {
          window.setTimeout(() => {
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            itemIndex = 0;
          }, 580);
        }
      };
      const timer = window.setInterval(move, 1000);
      newsRoot.addEventListener('mouseenter', () => { paused = true; });
      newsRoot.addEventListener('mouseleave', () => { paused = false; });
      window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
    }
  }

  const cloudRoot = document.getElementById('jjj-keyword-cloud');
  if (cloudRoot) {
    // 在 Excel 的全部“新闻正文”中复核词频后保留的业务语义词；数值为正文出现次数。
    const words = [['创新',6912],['协同',5230],['科技',5187],['技术',3811],['教育',3776],['合作',3011],['人才',2912],['大学',2576],['协同发展',2252],['高校',1541],['学院',1313],['科技创新',1032],['科研',1008],['科技成果',941],['共建',868],['成果转化',847],['研发',800],['产业链',766],['创新中心',673],['研究院',590]];
    const palette = ['#21b3ed','#916ad8','#40b977','#ff9912','#ffd428','#ff694e','#50cdd3','#75a7c7'];
    const canvas = document.createElement('canvas');
    cloudRoot.replaceChildren(canvas);
    const drawCloud = () => {
      const rect = cloudRoot.getBoundingClientRect();
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio)); canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, rect.width, rect.height);
      const max = words[0][1], min = words[words.length - 1][1], placed = [];
      words.forEach(([word, count], index) => {
        const size = 7 + 24 * Math.sqrt((count - min) / (max - min));
        ctx.font = `700 ${size}px Microsoft YaHei, PingFang SC, sans-serif`;
        const width = ctx.measureText(word).width, height = size * 1.05;
        let candidate = null;
        for (let attempt = 0; attempt < 8000 && !candidate; attempt += 1) {
          const angle = attempt * 0.51 + index * 0.7, radius = 1 + 1.15 * Math.sqrt(attempt);
          const x = rect.width / 2 + Math.cos(angle) * radius, y = rect.height / 2 + Math.sin(angle) * radius * .72;
          const box = { left: x - width / 2 - 1, right: x + width / 2 + 1, top: y - height / 2 - 1, bottom: y + height / 2 + 1 };
          const inside = box.left >= 2 && box.right <= rect.width - 2 && box.top >= 2 && box.bottom <= rect.height - 2;
          if (inside && !placed.some(other => !(box.right < other.box.left || box.left > other.box.right || box.bottom < other.box.top || box.top > other.box.bottom))) candidate = { x, y, box };
        }
        if (!candidate) return;
        placed.push({ ...candidate, word, size, color: palette[index % palette.length] });
      });
      if (placed.length) {
        const bounds = placed.reduce((result, item) => ({
          left: Math.min(result.left, item.box.left), right: Math.max(result.right, item.box.right),
          top: Math.min(result.top, item.box.top), bottom: Math.max(result.bottom, item.box.bottom)
        }), { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
        const scale = Math.min(1.3, (rect.width - 8) / (bounds.right - bounds.left), (rect.height - 8) / (bounds.bottom - bounds.top));
        const offsetX = (rect.width - (bounds.right - bounds.left) * scale) / 2 - bounds.left * scale;
        const offsetY = (rect.height - (bounds.bottom - bounds.top) * scale) / 2 - bounds.top * scale;
        placed.forEach(item => {
          ctx.font = `700 ${item.size * scale}px Microsoft YaHei, PingFang SC, sans-serif`;
          ctx.fillStyle = item.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.word, item.x * scale + offsetX, item.y * scale + offsetY);
        });
      }
      cloudRoot.dataset.renderedWords = String(placed.length);
    };
    new ResizeObserver(drawCloud).observe(cloudRoot); drawCloud();
  }
}());
