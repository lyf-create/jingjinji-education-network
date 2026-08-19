(function () {
  'use strict';

  const moduleData = window.DashboardData.activityMap;
  const chartDom = document.getElementById('activity-map-chart');
  const dimensionsDom = document.getElementById('activity-map-dimensions');
  const nameMap = { Beijing: '北京', Tianjin: '天津', Hebei: '河北' };
  const mapName = 'jjj-activity-map';
  const colors = { 北京: '#18c8f5', 天津: '#8a6be0', 河北: '#3fbe7c' };
  let chart;
  let observer;

  function renderDimensions() {
    const dimensionColors = ['#20d8f1', '#45d990', '#f2a53a', '#b177f5', '#b7d649'];
    dimensionsDom.innerHTML = moduleData.dimensions.map((dimension, index) => `
      <div class="jjj-activity-map__dimension-grid">
        <div class="jjj-activity-map__dimension-cell jjj-activity-map__dimension-cell--name"><i style="background:${dimensionColors[index]}"></i><span>${dimension.replace('协同', '')}</span></div>
        ${['北京', '天津', '河北'].map(region => `<div class="jjj-activity-map__dimension-cell jjj-activity-map__dimension-cell--score">${moduleData.regions[region].values[index].toFixed(1)}</div>`).join('')}
      </div>`).join('');
  }

  function option() {
    const data = Object.entries(nameMap).map(([geoName, region]) => ({
      name: geoName,
      value: [geoName === 'Beijing' ? 116.42 : geoName === 'Tianjin' ? 117.2 : 114.7, geoName === 'Beijing' ? 39.9 : geoName === 'Tianjin' ? 39.12 : 38.25, moduleData.regions[region].total],
      itemStyle: { color: colors[region] }
    }));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(4, 19, 40, .96)',
        borderColor: 'rgba(24, 200, 245, .45)',
        textStyle: { color: '#eaf7ff' },
        formatter: params => {
          const region = nameMap[params.name];
          if (!region) return '';
          const current = moduleData.regions[region];
          return `<strong>${region}</strong><br/>综合活跃度：<b>${current.total.toFixed(1)}</b><br/>${moduleData.dimensions.map((d, i) => `${d}：${current.values[i].toFixed(1)}`).join('<br/>')}`;
        }
      },
      geo: {
        map: mapName,
        roam: false,
        center: [116.7, 39.45],
        zoom: 1.18,
        itemStyle: { areaColor: 'rgba(20, 87, 157, .48)', borderColor: 'rgba(117, 223, 255, .55)', borderWidth: 1.2 },
        emphasis: { itemStyle: { areaColor: 'rgba(25, 201, 245, .34)', borderColor: '#59e2ff', borderWidth: 2, shadowBlur: 16, shadowColor: 'rgba(24, 200, 245, .5)' } },
        regions: Object.entries(nameMap).map(([geoName, region]) => ({ name: geoName, itemStyle: { areaColor: colors[region] + '99' } }))
      },
      series: [{
        type: 'scatter', coordinateSystem: 'geo', symbolSize: 1,
        label: { show: true, formatter: p => `{name|${nameMap[p.name]}}\n{score|${p.value[2].toFixed(1)}}`, rich: { name: { color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 22 }, score: { color: '#dffaff', fontSize: 22, fontWeight: 700, lineHeight: 28 } } },
        data
      }, {
        type: 'effectScatter', coordinateSystem: 'geo', symbolSize: 8,
        rippleEffect: { brushType: 'stroke', period: 4, scale: 4 },
        itemStyle: { color: '#00d4ff', shadowBlur: 8, shadowColor: 'rgba(0, 212, 255, .5)' },
        data: data.map(item => ({ name: nameMap[item.name], value: item.value }))
      }, {
        type: 'lines', coordinateSystem: 'geo', lineStyle: { color: '#00d4ff', width: 1.2, opacity: .3, curveness: .2 },
        effect: { show: true, period: 5, trailLength: .4, symbol: 'circle', symbolSize: 4, color: '#00d4ff' },
        data: [{ coords: [data[0].value, data[1].value] }, { coords: [data[0].value, data[2].value] }, { coords: [data[1].value, data[2].value] }]
      }]
    };
  }

  function initActivityMap() {
    if (!window.echarts || !window.JJJ_GEOJSON) return;
    const existing = window.echarts.getInstanceByDom(chartDom);
    if (existing) existing.dispose();
    window.echarts.registerMap(mapName, window.JJJ_GEOJSON);
    chart = window.echarts.init(chartDom);
    window.DashboardCharts.activityMap = chart;
    chart.setOption(option());
    observer = new ResizeObserver(() => chart && chart.resize());
    observer.observe(chartDom);
    renderDimensions();
  }

  window.DashboardModules = window.DashboardModules || {};
  window.DashboardModules.initActivityMap = initActivityMap;
  window.DashboardCharts = window.DashboardCharts || {};
  initActivityMap();
}());
