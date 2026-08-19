(function () {
  'use strict';
  const host = document.getElementById('collab-index-host');
  try {
    const source = window.CollaborationIndexSource;
    if (!source) throw new Error('协同指数资源未加载');
    const documentSource = new DOMParser().parseFromString(`<body>${source.body}</body>`, 'text/html');
    const style = source.style.replaceAll('.jjj-', '.collab-index-');
    const root = documentSource.getElementById('jjj-education-dashboard');
    root.id = 'collab-index-dashboard';
    root.className = root.className.replaceAll('jjj-', 'collab-index-');
    root.querySelectorAll('[class]').forEach(element => { element.setAttribute('class', element.getAttribute('class').replaceAll('jjj-', 'collab-index-')); });
    root.querySelectorAll('[id]').forEach(element => { element.id = element.id.replaceAll('jjj-', 'collab-index-'); });
    root.querySelectorAll('[aria-labelledby]').forEach(element => { element.setAttribute('aria-labelledby', element.getAttribute('aria-labelledby').replaceAll('jjj-', 'collab-index-')); });
    const trendPanel = root.querySelector('.collab-index-trend-panel');
    const tooltip = root.querySelector('.collab-index-tooltip');
    const modal = root.querySelector('.collab-index-modal');
    trendPanel.querySelector('.collab-index-section-head h2').textContent = '京津冀教育协同度指数';
    trendPanel.querySelector('.collab-index-hint')?.remove();
    const legendLabels = ['京津冀总体', '北京', '天津', '河北'];
    trendPanel.querySelectorAll('.collab-index-legend span').forEach((item, index) => {
      const marker = item.querySelector('i');
      item.replaceChildren(marker, document.createTextNode(legendLabels[index] || ''));
    });
    root.replaceChildren(trendPanel, tooltip, modal);
    trendPanel.querySelector('.collab-index-note')?.remove();
    host.innerHTML = `<style>${style}
      #collab-index-host .collab-index-dashboard { display:flex; flex-direction:column; height:100%; min-height:0; max-width:none; padding:6px; background:transparent; isolation:auto; }
      #collab-index-host .collab-index-trend-panel { display:flex; flex:1; flex-direction:column; min-height:0; margin:0; padding:7px 1px 3px; }
      #collab-index-host .collab-index-section-head { gap:8px; padding:0 5px; }
      #collab-index-host .collab-index-section-head h2 { font-size:20px; }
      #collab-index-host .collab-index-kicker { margin:0 0 3px; }
      #collab-index-host .collab-index-hint { margin:3px 0; }
      #collab-index-host .collab-index-legend { gap:14px; margin:6px 0 0; font-size:12px; }
      #collab-index-host .collab-index-legend span { gap:5px; }
      #collab-index-host .collab-index-chart-wrap { flex:1 1 0; min-height:0; height:0; width:calc(100% + 14px); max-width:none; margin:0 -7px; }
      #collab-index-host .collab-index-trend-svg { display:block; width:100%; height:100%; }
      #collab-index-host .collab-index-bar-label { font-size:18px !important; }
      #collab-index-host .collab-index-year { font-size:15px !important; }
      #collab-index-host .collab-index-axis { font-size:13px !important; }
      #collab-index-host .collab-index-modal { z-index:1100; }
    </style>${root.outerHTML}`;
    const code = source.code
      .replace('const root =', `DATA.regions.forEach(region => {
        const base = DATA.annual[region][0];
        DATA.annual[region] = DATA.annual[region].map(value => value / base * 100);
      });
      const root =`)
      .replace(
        /const W = 960, H = 430, L = 58, R = 24, T = 38, B = 54, pw = W - L - R, ph = H - T - B, n = DATA\.years\.length, x = i => L \+ \(i \+ \.5\) \* pw \/ n, y = v => T \+ ph - v \/ 100 \* ph;/,
        'const W = 960, H = 430, L = 58, R = 50, T = 38, B = 54, pw = W - L - R, ph = H - T - B, n = DATA.years.length, chartMax = Math.max(100, Math.ceil(Math.max(...Object.values(DATA.annual).flat()) / 20) * 20), tickStep = chartMax / 5, x = i => L + (i + .5) * pw / n, y = v => T + ph - v / chartMax * ph;'
      )
      .replace(
        /\[0, 20, 40, 60, 80, 100\]\.forEach\(v => \{[\s\S]*?\}\);/,
        '[0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(v => {const sv = v * 100; svg.append(S("line", {x1: L, x2: W - R, y1: y(sv), y2: y(sv), class: "jjj-grid"}), S("text", {x: L - 12, y: y(sv) + 5, "text-anchor": "end", class: "jjj-axis"}, v.toFixed(1)))});'
      )
      .replace('const avg = DATA.years.map((_, i) => DATA.regions.reduce((s, r) => s + DATA.annual[r][i], 0) / 3);', `const _raw = DATA.years.map((_, i) => DATA.regions.map(r => DATA.annual[r][i]));
      const cjt = _raw.map(v => { const m = v.reduce((s,x)=>s+x,0)/v.length; const sd = Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length); return 1/(1+sd/m); });
      const avg = cjt.map(v => v * 100);`)
      .replace(
        'avg.forEach((v, i) => {svg.append(S("rect", {x: x(i) - 16, y: y(v), width: 32, height: y(0) - y(v), rx: 3, fill: "url(#jjjBarGradient)", opacity: .84}), S("text", {x: x(i), y: y(v) - 8, "text-anchor": "middle", class: "jjj-bar-label"}, f(v)), S("text", {x: x(i), y: H - 22, "text-anchor": "middle", class: "jjj-year"}, DATA.years[i]))}',
        'avg.forEach((v, i) => {svg.append(S("rect", {x: x(i) - 16, y: y(v), width: 32, height: y(0) - y(v), rx: 3, fill: "url(#jjjBarGradient)", opacity: .84}), S("text", {x: x(i), y: y(v) - 8, "text-anchor": "middle", class: "jjj-bar-label"}, (v/100).toFixed(2)), S("text", {x: x(i), y: H - 22, "text-anchor": "middle", class: "jjj-year"}, DATA.years[i]))};[0,20,40,60,80,100].forEach(v => {svg.append(S("text", {x: W - R + 8, y: y(v) + 5, "text-anchor": "start", fill: "#22c7c9", "font-size": "12px"}, v + "%"))})'
      )
      .replaceAll('jjj-', 'collab-index-')
      .replaceAll('collab-index-education-dashboard', 'collab-index-dashboard');
    new Function(code)();
  } catch (error) {
    host.textContent = '协同指数模块加载失败。';
    console.error(error);
  }
}());
