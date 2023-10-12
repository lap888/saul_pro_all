import { useState, useEffect } from 'react';
import { Table, Modal, Space, Divider, Radio } from "antd";
import { getAccount } from '@/http/api';
import { DateFormat } from '@/utils/utils'
export function DetailForm(props) {
  const {
    visible,
    loading,
    onCancel,
    title,
  } = props
  const columns = [
    {
      dataIndex: 'asset', title: '交易对', width: 100
    },
    {
      dataIndex: 'free', title: '可用余额', width: 180
    },
    {
      dataIndex: 'locked', title: '锁定资金', width: 180
    }

  ];

  const columns_hya = [
    {
      dataIndex: 'asset', title: '资产', width: 100
    },
    {
      dataIndex: 'walletBalance', title: '余额', width: 100
    },
    {
      dataIndex: 'unrealizedProfit', title: '未实现盈亏', width: 100
    },
    // {
    //   dataIndex: 'totalCrossUnPnl', title: '全仓持仓未实现盈亏', width: 100
    // },
    {
      dataIndex: 'marginBalance', title: '保证金余额', width: 100
    },
    {
      dataIndex: 'maintMargin', title: '维持保证金', width: 100
    },
    {
      dataIndex: 'initialMargin', title: '当前所需起始保证金', width: 100
    },
    {
      dataIndex: 'updateTime', title: '更新时间', width: 180,
      render: (_, { updateTime }) => (
        <>
          {DateFormat(updateTime)}
        </>
      )
    }
  ]

  const columns_hyp = [
    {
      dataIndex: 'symbol', title: '交易对', width: 100
    },
    {
      dataIndex: 'initialMargin', title: '当前所需起始保证金', width: 100
    },
    {
      dataIndex: 'maintMargin', title: '维持保证金', width: 100
    },
    {
      dataIndex: 'unrealizedProfit', title: '持仓未实现盈亏', width: 100
    },
    {
      dataIndex: 'leverage', title: '杠杆倍率', width: 100
    },
    {
      dataIndex: 'entryPrice', title: '持仓成本价', width: 100
    },
    {
      dataIndex: 'positionSide', title: '持仓方向', width: 100,
      render: (_, { positionSide }) => (
        <>
          {positionSide === 'SHORT' ? '空单' : positionSide === 'LONG' ? '多单' : ''}
        </>
      )
    },
    {
      dataIndex: 'positionAmt', title: '持仓数量', width: 100,
      render: (_, { positionAmt }) => (
        <>
          {Math.abs(positionAmt)}
        </>
      )
    },
    {
      dataIndex: 'updateTime', title: '更新时间', width: 180,
      render: (_, { updateTime }) => (
        <>
          {DateFormat(updateTime)}
        </>
      )
    }
  ]
  const [data, setData] = useState([])
  const [info, setInfo] = useState({})
  const [loading1, setLoading1] = useState(false)
  const [tabPosition, setTabPosition] = useState('hy');
  const changeTabPosition = (e) => {
    setTabPosition(e.target.value);
  };
  const [tabPosition1, setTabPosition1] = useState('a');
  const changeTabPosition1 = (e) => {
    setTabPosition1(e.target.value);
  };
  useEffect(() => {
    setLoading1(true)
    getAccount({ type: tabPosition, type1: tabPosition1 }).then(res => {
      let _l = res.data.list || {};
      let list = []
      if (tabPosition === 'hy') setInfo(_l)
      tabPosition === 'hy' ? tabPosition1 === 'a' ?
        _l.assets.map(v => {
          if (Number(v.walletBalance) !== 0 || Number(v.crossUnPnl) !== 0) list.push(v)
          return v;
        }) : (_l.positions.map(v => {
          if (Number(v.positionAmt) !== 0 || Number(v.unrealizedProfit) !== 0) list.push(v)
          return v;
        })) : (_l.balances.map(v => {
          if (Number(v.free) !== 0 || Number(v.locked) !== 0) list.push(v)
          return v;
        }))
      setData(list)
      setLoading1(false)
    })
  }, [tabPosition, tabPosition1])
  return (
    <>
      <Modal
        forceRender={true}
        title={title}
        visible={visible}
        onCancel={onCancel}
        onOk={onCancel}
        maskClosable={false}
        okButtonProps={{ loading }}
        width='80%'
        bodyStyle={{ height: window.innerHeight * 2 / 3, overflowY: 'auto' }}
      >
        <div>
          <Space
            style={{
              marginBottom: 5,
              marginRight: 30
            }}
          >
            账户类型:
            <Radio.Group value={tabPosition} onChange={changeTabPosition}>
              <Radio.Button value="hy">合约</Radio.Button>
              <Radio.Button value="xh">现货</Radio.Button>
            </Radio.Group>
          </Space>
          {tabPosition === 'hy' && <>

            <Space
              style={{
                marginBottom: 5,
              }}
            >
              资产类型:
              <Radio.Group value={tabPosition1} onChange={changeTabPosition1}>
                <Radio.Button value="a">资产</Radio.Button>
                <Radio.Button value="p">持仓</Radio.Button>
              </Radio.Group>
            </Space>
          </>}


          <Divider></Divider>
          {
            tabPosition === 'hy' && <Space style={{color:'red'}}>以USD计价的全仓未实现盈亏总额:{info?.totalCrossUnPnl}</Space>
          }
          <Divider></Divider>
          <Table
            scroll={{
              x: window.innerWidth * 2 / 3,
              y: window.innerHeight * 2 / 3,
            }}
            loading={loading1}
            rowkey={(record, index) => index}
            dataSource={data}
            columns={tabPosition === 'hy' ? tabPosition1 === 'a' ? columns_hya : columns_hyp : columns} />
        </div>
      </Modal>
    </>

  );
}
