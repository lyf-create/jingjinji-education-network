(function () {
  'use strict';
  const source = window.EMBEDDED_ACTIVITY_DATA;
  const chartDom = document.getElementById('activity-timeline-chart');
  if (!source || !window.echarts || !chartDom) return;

  const categories = ['资源共享', '人才培养', '办学合作', '产教科教融合', '治理机制'];
  const colors = { 资源共享: '#44d5ff', 人才培养: '#8b8cff', 办学合作: '#f7b84b', 产教科教融合: '#4ee6ad', 治理机制: '#f477b8' };
  const monthly = source.monthly;
  let index = 0;
  let timer;
  const chart = echarts.init(chartDom);

  const visible = (value, itemIndex) => itemIndex <= index ? value : '-';
  const formatMonth = month => `${month.slice(0, 4)}年${month.slice(5)}月`;
  const barColor = itemIndex => itemIndex === index
    ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#56d8ff' }, { offset: 1, color: '#0874d4' }])
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(43,138,255,.76)' }, { offset: 1, color: 'rgba(10,71,158,.62)' }]);

  function render() {
    const current = monthly[index];
    const series = [{
      name: '月度总活跃度', type: 'bar', barMaxWidth: 22, z: 1, animation: false,
      data: monthly.map((item, itemIndex) => ({ value: visible(item.total, itemIndex), itemStyle: { color: barColor(itemIndex) } })),
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#63ddff', width: 2 }, label: { formatter: formatMonth(current.month), color: '#c8f4ff', backgroundColor: 'rgba(3,38,78,.9)', padding: [4, 6] }, data: [{ xAxis: current.month }] }
    }];
    categories.forEach(category => series.push({
      name: category, type: 'line', yAxisIndex: 1, smooth: .28, symbol: 'circle', symbolSize: 4, z: 4,
      data: monthly.map((item, itemIndex) => visible(item.categories[category] || 0, itemIndex)),
      lineStyle: { width: 2, color: colors[category], shadowBlur: 7, shadowColor: colors[category] }, itemStyle: { color: colors[category] }
    }));
    chart.setOption({
      animationDuration: 100, animationEasing: 'linear',
      grid: { left: 50, right: 58, top: 35, bottom: 37 },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,20,48,.96)', borderColor: '#2a6b96', textStyle: { color: '#eaf4ff' }, formatter: rows => `<b>${formatMonth(rows[0].axisValue)}</b><br/>${rows.map(row => `${row.marker}${row.seriesName}：<b>${Number(row.value).toFixed(1)}</b>`).join('<br/>')}` },
      xAxis: { type: 'category', data: monthly.map(item => item.month), axisLine: { lineStyle: { color: '#70849c' } }, axisLabel: { color: '#d0d8e4', fontSize: 12, interval: 3, formatter: value => value.slice(0, 4) + '-' + value.slice(5) }, axisTick: { show: true, lineStyle: { color: '#70849c' } } },
      yAxis: [{ type: 'value', name: '总活跃度', nameTextStyle: { color: '#c1ccdb', fontWeight: 'bold' }, splitLine: { lineStyle: { color: 'rgba(32,108,185,.2)' } }, axisLabel: { color: '#c4d2e1', fontSize: 14 } }, { type: 'value', name: '分类得分', nameTextStyle: { color: '#91a8bd' }, splitLine: { show: false }, axisLabel: { color: '#91a8bd' } }],
      series
    }, { notMerge: true });
  }

  function start() { clearInterval(timer); timer = setInterval(() => { index = (index + 1) % monthly.length; render(); }, 300); }
  chart.on('mouseover', () => clearInterval(timer));
  chart.on('mouseout', start);
  chart.on('click', params => { if (params.dataIndex != null) { index = params.dataIndex; render(); start(); } });
  new ResizeObserver(() => chart.resize()).observe(chartDom);
  window.DashboardCharts = window.DashboardCharts || {};
  window.DashboardCharts.activityTimeline = chart;
  render();
  start();
}());
