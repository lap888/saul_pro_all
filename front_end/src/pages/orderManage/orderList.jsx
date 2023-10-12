import { useEffect, useRef } from 'react';
import { Bar } from '@antv/g2plot';
import { Gauge } from '@ant-design/plots';
let data = [
  { year: '1951 年', sales: 38 },
  { year: '1952 年', sales: 52 },
  { year: '1956 年', sales: 61 },
  { year: '1957 年', sales: 145 },
  { year: '1958 年', sales: 48 },
]
function OrderList() {
  useEffect(() => {
    let bar = new Bar('hihi', {
      data,
      xField: 'sales',
      yField: 'year',
      seriesField: 'year',
    });
    bar.render()
    let i = 1;
    let timer = setInterval(() => {
      if ((1958 + i) === 1968) {
        console.log('清除clear timer')
        clearInterval(timer)
      }
      data.push({ year: `${1958 + i} 年`, sales: Math.random() * 100 })
      bar.changeData(data)
      i++;
    }, 2000);

  }, [])

  return (
    <div>
      {/* <p>订单页面</p> */}
      <div style={{ height: window.innerHeight * 0.5 }} id="hihi">

      </div>
      <DemoGauge />
    </div>
  );
}

const DemoGauge = () => {
  const ticks = [0, 1 / 3, 2 / 3, 1];
  const color = ['#F4664A', '#FAAD14', '#30BF78'];
  const graphRef = useRef(null);
  useEffect(() => {
    if (graphRef.current) {
      let data = 0.7;
      const interval = setInterval(() => {
        if (data >= 1.5) {
          clearInterval(interval);
        }

        data += 0.005;
        graphRef.current.changeData(data > 1 ? data - 1 : data);
      }, 100);
    }
  }, [graphRef]);
  const config = {
    percent: 0,
    range: {
      ticks: [0, 1],
      color: ['l(0) 0:#F4664A 0.5:#FAAD14 1:#30BF78'],
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D0D0D0',
        },
      },
      pin: {
        style: {
          stroke: '#D0D0D0',
        },
      },
    },
    statistic: {
      title: {
        formatter: ({ percent }) => {
          if (percent < ticks[1]) {
            return '差';
          }

          if (percent < ticks[2]) {
            return '中';
          }

          return '优';
        },
        style: ({ percent }) => {
          return {
            fontSize: '36px',
            lineHeight: 1,
            color: percent < ticks[1] ? color[0] : percent < ticks[2] ? color[1] : color[2],
          };
        },
      },
      content: {
        offsetY: 36,
        style: {
          fontSize: '24px',
          color: '#4B535E',
        },
        formatter: () => '系统表现',
      },
    },
    onReady: (plot) => {
      graphRef.current = plot;
    },
  };

  return <Gauge {...config} />;
};

export default OrderList;
