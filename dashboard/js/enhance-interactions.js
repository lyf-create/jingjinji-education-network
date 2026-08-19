/* ============================================================
   jjJ-dashboard Enhancements – interaction & motion JS layer
   ADDITIVE ONLY — reads/observes existing DOM, never modifies
   ============================================================ */
(function () {
  'use strict';

  /* ---- A. KPI Count-up Animation ---- */
  function animateValue(element, targetText, duration) {
    const cleaned = targetText.replace(/[,\s]/g, '');
    if (!/\d/.test(cleaned)) return;
    const rawNum = parseFloat(cleaned.replace('%', ''));
    if (isNaN(rawNum)) return;
    const isInteger = !cleaned.includes('.') && !cleaned.includes('%');
    const decimalPlaces = (() => {
      const match = cleaned.match(/\.(\d+)/);
      return match ? match[1].length : 0;
    })();
    const prefix = cleaned.match(/^[^\d\-]*/)?.[0] || '';
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = rawNum * ease;
      if (isInteger) {
        element.textContent = prefix + Math.round(current).toLocaleString('en-US');
      } else {
        element.textContent = prefix + current.toFixed(decimalPlaces);
      }
      if (t < 1) requestAnimationFrame(tick);
      else element.textContent = targetText;
    }
    element.textContent = isInteger ? prefix + '0' : prefix + (0).toFixed(decimalPlaces);
    element.classList.add('jjj-enhance-counting');
    requestAnimationFrame(tick);
  }

  function initCountUp() {
    const kpiCards = document.querySelectorAll('.jjj-kpi-card__value');
    if (!kpiCards.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const targetText = entry.target.textContent;
        setTimeout(() => animateValue(entry.target, targetText, 1200), 100);
      });
    }, { threshold: 0.3 });
    kpiCards.forEach(card => observer.observe(card));
  }

  /* ---- B. Region bar fill animation (if region bars exist in timeline bottom) ---- */
  function initRegionBars() {
    const bars = document.querySelectorAll('.jjj-activity-timeline__bar b');
    if (!bars.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const w = entry.target.style.width;
        entry.target.style.width = '0';
        entry.target.style.transition = 'width 0.8s cubic-bezier(.22,1,.36,1)';
        requestAnimationFrame(() => { entry.target.style.width = w; });
      });
    }, { threshold: 0.2 });
    bars.forEach(bar => observer.observe(bar));
  }

  /* ---- C. Tooltip for dimension rows (native title attribute) ---- */
  function initDimensionTooltips() {
    const dims = document.querySelectorAll('.jjj-activity-map__dimension-grid');
    if (!dims.length) return;
    dims.forEach(row => {
      const cells = row.querySelectorAll('.jjj-activity-map__dimension-cell');
      if (cells.length < 4) return;
      const name = cells[0]?.textContent?.trim() || '';
      const bj = cells[1]?.textContent?.trim() || '';
      const tj = cells[2]?.textContent?.trim() || '';
      const hb = cells[3]?.textContent?.trim() || '';
      row.title = name + '  北京:' + bj + '  天津:' + tj + '  河北:' + hb;
    });
  }

  /* ---- Init ---- */
  function init() {
    initCountUp();
    initRegionBars();
    initDimensionTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
