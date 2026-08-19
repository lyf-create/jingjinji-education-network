(function () {
  'use strict';

  const STAGE_COLORS = {
    '基础教育': '#1368e8',
    '高等教育': '#16b8e8',
    '职业教育': '#68a84f'
  };

  let panel;
  let chart;
  let data;
  let select;
  let resizeObserver;
  let selectedYear = '2026';

  function summarise(year) {
    const years = year === '全部' ? Object.keys(data.byYear) : [year];
    return data.order.map((name) => ({
      name,
      value: years.reduce((sum, current) => sum + (data.byYear[current]?.[name] || 0), 0)
    }));
  }

  function render() {
    if (!chart || !data) return;
    const items = summarise(selectedYear);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const shares = items.map((item) => total ? Number((item.value / total * 100).toFixed(1)) : 0);
    chart.setOption({
      animationDurationUpdate: 350,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(3, 18, 36, .96)',
        borderColor: 'rgba(0, 145, 255, .7)',
        textStyle: { color: '#f2f7ff' },
        formatter(params) {
          const item = params[0];
          return `${item.name}<br/>${item.marker}${item.value.toFixed(1)}%`;
        }
      },
      grid: { left: 20, right: 94, top: 18, bottom: 18, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#b8c7d9', fontSize: 12, formatter: '{value}%' },
        axisLine: { lineStyle: { color: 'rgba(160,190,220,.28)' } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(80,130,170,.18)' } }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: items.map((item) => item.name),
        axisLabel: { color: '#d9e6f2', fontSize: 15, fontWeight: 600, margin: 16 },
        axisLine: { lineStyle: { color: 'rgba(160,190,220,.28)' } },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: items.map((item, index) => ({ value: shares[index], itemStyle: { color: STAGE_COLORS[item.name] } })),
        barWidth: 30,
        showBackground: true,
        backgroundStyle: { color: 'rgba(67, 116, 156, .12)' },
        label: {
          show: true,
          position: 'right',
          distance: 12,
          color: '#f2f7ff',
          fontSize: 14,
          fontWeight: 600,
          formatter: '{c}%'
        },
        emphasis: { focus: 'series' }
      }]
    }, true);
  }

  const StageShareModule = {
    init(root, sourceData) {
      panel = root;
      data = sourceData;
      const actions = panel.querySelector('.panel-actions');
      const chartDom = panel.querySelector('.chart-container');
      if (!actions || !chartDom || !window.echarts || !data) return;
      actions.innerHTML = '<select class="stage-share__year-select" aria-label="筛选年份"><option value="2023">2023 年</option><option value="2024">2024 年</option><option value="2025">2025 年</option><option value="2026" selected>2026 年</option><option value="全部">全部</option></select>';
      select = actions.querySelector('.stage-share__year-select');
      select.addEventListener('change', () => { selectedYear = select.value; render(); });
      chartDom.innerHTML = '';
      chart = window.echarts.init(chartDom, null, { renderer: 'canvas' });
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => chart?.resize());
      resizeObserver.observe(chartDom);
      render();
    },
    update(sourceData) { data = sourceData; render(); },
    resize() { chart?.resize(); },
    destroy() {
      chart?.dispose();
      resizeObserver?.disconnect();
      chart = null;
      select = null;
      resizeObserver = null;
      panel = null;
    }
  };

  window.DashboardModules?.register('stage-share', StageShareModule);
}());
