window.DashboardData = {
  kpiCards: [
    { type: 'index', label: '当月活跃度指数', value: '70.7', note: '较上月', delta: '-49.7', direction: 'down', trend: [210.2, 273.2, 120.4, 70.7] },
    { type: 'events', label: '协同事件', value: '158' },
    { type: 'subjects', label: '参与主体', value: '378' },
    { type: 'relations', label: '协同关系', value: '299' },
    { type: 'regions', label: '京津冀三地占比', regions: [['北京', '53.5%'], ['天津', '16.2%'], ['河北', '30.3%']] }
  ],
  kpi: [
    { label: '有效协同事件', value: '516', note: '真实评分事件库' },
    { label: '五维综合活跃度', value: '79.0', note: '三地平均值' },
    { label: '北京活跃度', value: '78.5', note: '五维综合得分' },
    { label: '天津活跃度', value: '79.3', note: '五维综合得分' },
    { label: '河北活跃度', value: '79.3', note: '五维综合得分' }
  ],
  activityMap: {
    dimensions: ['资源共享协同', '人才培养协同', '办学合作协同', '产教融合协同', '治理机制协同'],
    regions: {
      北京: { total: 78.5, values: [83.5, 83.0, 77.2, 82.0, 66.6] },
      天津: { total: 79.3, values: [83.5, 84.1, 78.5, 83.2, 67.1] },
      河北: { total: 79.3, values: [84.6, 83.8, 78.2, 83.0, 67.0] }
    }
  },
  topEvents: [
    { rank: 1, date: '2024-12-12', title: '京津冀国家技术创新中心雄安中心启动运行', category: '产教融合协同', score: '6/30' },
    { rank: 2, date: '2023-11-28', title: '首批疏解四所高校雄安校区全部开工建设', category: '资源共享协同', score: '16/30' },
    { rank: 3, date: '2024-02-21', title: '京津冀协同发展人工智能助力人才培养先行先试改革示范园区成立', category: '人才培养协同', score: '17/30' }
  ]
};
