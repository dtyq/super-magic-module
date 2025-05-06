export const test_string = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECharts 简单图表示例</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .container {
      width: 100%;
      max-width: 900px;
      margin: 20px auto;
      padding: 20px;
      box-sizing: border-box;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    .chart-container {
      width: 100%;
      height: 400px;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #333;
      text-align: center;
    }
    .controls {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      border: none;
      background-color: #1890ff;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #40a9ff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="title">数据可视化示例</h2>
    <div class="controls">
      <button id="barChart">柱状图</button>
      <button id="lineChart">折线图</button>
      <button id="pieChart">饼图</button>
    </div>
    <div id="chartContainer" class="chart-container"></div>
  </div>

  <!-- 加载 ECharts CDN -->
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  
  <!-- 自定义脚本 -->
  <script>
    // 初始化 ECharts 实例
    const chartDom = document.getElementById('chartContainer');
    const myChart = echarts.init(chartDom);
    
    // 示例数据
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const values = [120, 200, 150, 80, 170, 220];
    
    // 柱状图配置
    function renderBarChart() {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: months,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '销售额',
            type: 'bar',
            barWidth: '60%',
            data: values,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      };
      
      myChart.setOption(option);
    }
    
    // 折线图配置
    function renderLineChart() {
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '销售额',
            type: 'line',
            stack: '总量',
            data: values,
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#5470c6'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(84,112,198,0.5)' },
                { offset: 1, color: 'rgba(84,112,198,0.1)' }
              ])
            }
          }
        ]
      };
      
      myChart.setOption(option);
    }
    
    // 饼图配置
    function renderPieChart() {
      const pieData = months.map((month, index) => {
        return { value: values[index], name: month };
      });
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: months
        },
        series: [
          {
            name: '销售额',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData
          }
        ]
      };
      
      myChart.setOption(option);
    }
    
    // 默认显示柱状图
    renderBarChart();
    
    // 添加按钮事件监听
    document.getElementById('barChart').addEventListener('click', renderBarChart);
    document.getElementById('lineChart').addEventListener('click', renderLineChart);
    document.getElementById('pieChart').addEventListener('click', renderPieChart);
    
    // 响应窗口大小变化
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  </script>
</body>
</html>
`
