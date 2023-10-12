import { useState, useEffect } from 'react';
import { Button, message, notification, Modal, Space, Table, Tag, Divider } from "antd";
import { getConfig, coinDel, startOrStop, addOrUpdate, sellAll, sellOne, getPos, getOrders } from '@/http/api';
import { SearchForm } from '@/components/form/SearchForm';
import { antdPaginationAdapter, clamp } from "@/utils/utils";
import { PostForm } from './keyForm/postForm';
import { DetailForm } from './keyForm/detailForm';
const styles = {
  topbtn: {
    margin: 20
  }
}

function handleDelete(record, onSuccess) {
  Modal.confirm({
    title: '删除提示',
    content: <p>确定删除 {record.type === 'hy' ? '合约' : '现货'} {record.coin} 吗?</p>,
    onOk: () => {
      try {
        coinDel(record).then(res => {
          notification.open({
            message: `消息通知`,
            description: `删除成功=>${JSON.stringify(res.data)}`
          });
          onSuccess()
        })
      } catch (e) {
        notification.open({
          message: `消息通知`,
          description: `删除失败=>${e}`
        });
        onSuccess()
      }
    }
  })
}

function handleDetail(record) {
  getPos(record).then(res => {
    Modal.confirm({
      title: '持仓详情',
      content: <div>{res.data.list.map(v => <div key={v}>{v}<Divider /></div>)}</div>
    })
  }).catch(err => {
    notification.open({
      message: `消息通知`,
      description: `查看详情失败=>${err}`
    });
  })
}

function handleHyClose(type, onSuccess) {
  Modal.confirm({
    title: '清仓提示',
    content: <p>确定清仓 {type === 'hy' ? '合约' : '现货'} 吗?</p>,
    onOk: () => {
      try {
        sellAll({ type: type }).then(res => {
          notification.open({
            message: `消息通知`,
            description: `清仓成功=>${JSON.stringify(res.data)}`
          });
          onSuccess()
        })
      } catch (e) {
        notification.open({
          message: `消息通知`,
          description: `清仓失败=>${e}`
        });
        onSuccess()
      }
    }
  })
}
function handleOneCoinClose(type, coin, onSuccess) {
  Modal.confirm({
    title: '清仓提示',
    content: <p>确定平仓 {coin} {type === 'hy' ? '合约' : '现货'} 吗?</p>,
    onOk: () => {
      try {
        sellOne({ type: type, symbol: coin }).then(res => {
          notification.open({
            message: `消息通知`,
            description: `平仓成功=>${JSON.stringify(res.data)}`
          });
          onSuccess()
        })
      } catch (e) {
        notification.open({
          message: `消息通知`,
          description: `平仓失败=>${e}`
        });
        onSuccess()
      }
    }
  })
}
function handleStop(record, onSuccess) {
  Modal.confirm({
    title: '温馨提示',
    content: <p>确定{record.status === 1 ? '停止' : '启动'} {record.type === 'hy' ? '合约' : '现货'} {record.coin} 吗?</p>,
    onOk: () => {
      try {
        startOrStop(record).then(res => {
          notification.open({
            message: `消息通知`,
            description: `${record.status === 1 ? '停止' : '启动'}${res.data.code === 200 ? '成功' : '失败'}=>${JSON.stringify(res.data)}`
          });
          onSuccess()
        }).catch(err => {
          notification.open({
            message: `消息通知`,
            description: `${record.status === 1 ? '停止' : '启动'}失败=>${err}`
          });
        })
      } catch (e) {
        notification.open({
          message: `消息通知`,
          description: `${record.status === 1 ? '停止' : '启动'}失败=>${e}`
        });
      }
    }
  })
}
/**
 * 时间戳转换方法yyyy-MM-dd HH:mm:ss
 * @param {*} time 
 * @returns 
 */
function formatDate(time) {
  let date = new Date(time);
  let YY = date.getFullYear();
  let MM = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  let DD = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  let mm = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  let ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

  // 这里修改返回时间的格式
  return YY + "-" + MM + "-" + DD + " " + hh + ":" + mm + ":" + ss;
}

/**
 * 
 * @returns 
 */
function SettingCoin() {
  const [data, setData] = useState({
    list: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  })
  const [orderData, setOrderData] = useState({
    list: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  })
  const [query, setQuery] = useState({
    page: 1,
    pageSize: 10,
  })
  const [loading, setLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [modalActionType, setModalActionType] = useState("");
  const [modalActionLoading, setModalActionLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState({})
  const [open, setOpen] = useState(false);

  useEffect(() => {

  }, [orderData])

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    getConfig(query).then(res => {
      if (isCurrent) {
        let data = { pagination: {} }
        data.list = res.data.data;
        data.pagination.page = res.data.page;
        data.pagination.pageSize = res.data.pageSize;
        data.pagination.total = res.data.total;
        setData(data)
      }
    }).catch(err => {
      console.log(err)
    }).finally(() => isCurrent && setLoading(false))
    return () => {
      isCurrent = false
    }
  }, [query])
  const columns_order = [
    {
      dataIndex: 'key', title: '订单号', width: 80,
      display: 'none', fixed: 'left'
    },
    {
      dataIndex: 'symbol', title: '交易对', width: 80
    },
    {
      dataIndex: 'price', title: '价格', width: 80
    },
    {
      dataIndex: 'qty', title: '数量', width: 80
    },
    {
      dataIndex: 'realizedPnl', title: '收益', width: 80
    },
    {
      dataIndex: 'side', title: '动作', width: 80,
      render: (_, { side }) => (
        <>
          {side === 'BUY' ? '买入' : '卖出'}
        </>
      )
    },
    {
      dataIndex: 'positionSide', title: '方向', width: 80,
      render: (_, { positionSide }) => (
        <>
          {positionSide === 'SHORT' ? '空单' : positionSide === 'LONG' ? '多单' : ''}
        </>
      )
    },
    {
      dataIndex: 'time', title: '时间', width: 80,
      render: (_, { time }) => formatDate(time)
    }

  ]
  const columns_order_xh = [
    {
      dataIndex: 'key', title: '订单号', width: 80,
      display: 'none', fixed: 'left'
    },
    {
      dataIndex: 'symbol', title: '交易对', width: 80
    },
    {
      dataIndex: 'price', title: '价格', width: 80
    },
    {
      dataIndex: 'executedQty', title: '数量', width: 80
    },
    // {
    //   dataIndex: 'realizedPnl', title: '收益', width: 80
    // },
    {
      dataIndex: 'side', title: '动作', width: 80,
      render: (_, { side }) => (
        <>
          {side === 'BUY' ? '买入' : '卖出'}
        </>
      )
    },
    {
      dataIndex: 'time', title: '时间', width: 80,
      render: (_, { time }) => formatDate(time)
    }

  ]
  const columns = [
    {
      dataIndex: 'key', title: '编号',
      width: 80,
      fixed: 'left',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.key - b.key,
    },
    {
      dataIndex: 'type', title: '类型',
      width: 100,
      render: (_, { type }) => (
        <>
          <Tag>
            {type === 'hy' ? '合约' : '现货'}
          </Tag>
        </>
      )
    },
    {
      dataIndex: 'coin',
      title: '币种',
      width: 150
    },
    {
      dataIndex: 'status', title: '状态',
      width: 100,
      filters: [
        { text: "停止", value: 0 },
        { text: "运行", value: 1 },
      ],
      filterMultiple: false,
      render: (_, { status }) => (
        <>
          <Tag color={status === 1 ? '#32CD32' : '#FF6A6A'} key={status}>
            {status === 1 ? '运行' : '停止'}
          </Tag>
        </>
      )
    },
    {
      dataIndex: 'orderType', title: '下单类型', width: 100,
      render: (_, { orderType }) => (
        <>
          {orderType === 'limit' ? '限价' : orderType === 'maker' ? '只做Maker' : '市价'}
        </>
      )
    },
    {
      dataIndex: 'indicator', title: '指标', width: 200,
      render: (_, { indicator }) => (
        <>
          {indicator.map((tag) => {
            let colors = ["#FFC125", "#FF6A6A", "#9B30FF", "#3299cc", "#32CD32", "#8B658B", "#FF8247", "#698B22", "#53868B"]
            let _color = Math.floor(Math.random() * colors.length - 1)
            return (
              <Tag color={colors[_color]} key={tag}>
                {tag}
              </Tag>
            );
          })}
        </>
      )
    },
    {
      dataIndex: 'lever',
      title: '杠杆',
      width: 150
    },
    {
      dataIndex: 'margin',
      title: '保证金',
      width: 150
    },
    {
      dataIndex: 'minAmount',
      title: '最小下单U',
      width: 150
    },
    {
      dataIndex: 'orderRate',
      title: '下单仓位比',
      width: 150
    },
    {
      dataIndex: 'stopPft',
      title: '价格止盈百分比',
      width: 150
    },
    {
      dataIndex: 'sellRate',
      title: '卖出百分比',
      width: 150
    },
    {
      dataIndex: 'stopLoss',
      title: '价格止损百分比',
      width: 150
    },
    {
      dataIndex: 'cancelTime',
      title: '挂单撤销时间',
      width: 150
    },
    { dataIndex: 'startTime', title: '开始时间', width: 100, },
    { dataIndex: 'endTime', title: '停止时间', width: 100, },

    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleOneCoinClose(record.type, record.coin, () => {
                console.log('平仓ok')
              })
            }}
          >平仓</span>|
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleDetail(record)
            }}
          >详情</span>|
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedRecord(record);
              setModalActionType("update");
            }}
          >修改</span>|
          <span
            style={{ cursor: 'pointer', color: record.status === 1 ? '#FF6A6A' : '#32CD32' }}
            onClick={() =>
              handleStop(record, () =>
                setQuery((prev) => {
                  const prevPage = prev.page || 1
                  return {
                    ...prev,
                    page: data.list.length === 1 ? clamp(prevPage - 1, 1, prevPage) : prevPage,
                  }
                })
              )
            }
          >{record.status === 1 ? '停止' : '启动'}</span>|
          <span
            style={{ cursor: 'pointer' }}
            onClick={() =>
              handleDelete(record, () =>
                setQuery((prev) => {
                  const prevPage = prev.page || 1
                  return {
                    ...prev,
                    page: data.list.length === 1 ? clamp(prevPage - 1, 1, prevPage) : prevPage,
                  }
                })
              )
            }
          >删除</span>|
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setOpen(true)
              setSelectedRecord({ ...record, flag: 1 })
              let isCurrent = true
              setOrderLoading(true)
              getOrders({ ...record, flag: 1 }).then(res => {
                if (isCurrent) {
                  let data = { pagination: {} }
                  data.list = res.data.list;
                  data.pagination.total = res.data.total;
                  data.pagination.page = orderData.pagination.page;
                  data.pagination.pageSize = orderData.pagination.pageSize;
                  setOrderData(data)
                }
              }).finally(() => {
                if (isCurrent) {
                  setOrderLoading(false)
                  isCurrent = false
                }
              })
            }
            }>未成交</span>|
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setOpen(true)
              setSelectedRecord({ ...record, flag: 2 })
              let isCurrent = true
              setOrderLoading(true)
              getOrders({ ...record, flag: 2 }).then(res => {
                if (isCurrent) {
                  let data = { pagination: {} }
                  data.list = res.data.list;
                  data.pagination.total = res.data.total;
                  data.pagination.page = orderData.pagination.page;
                  data.pagination.pageSize = orderData.pagination.pageSize;
                  setOrderData(data)
                }
              }).finally(() => {
                if (isCurrent) {
                  setOrderLoading(false)
                  isCurrent = false
                }
              })
            }
            }>订单</span>

        </Space>
      ),
    },
  ]
  return (
    < div style={{ height: '1000px' }}>
      <Divider>币种配置页面</Divider>
      <SearchForm
        onSubmit={(values) => {
          if (values.coin === undefined) {
            message.success('搜索内容不能为空');
            return
          }
          setQuery((prev) => ({
            ...prev,
            ...values,
            page: 1, // 重置分页
          }))
        }
        }
        onReset={(values) =>
          setQuery((prev) => ({
            ...prev,
            ...values,
            page: 1, // 重置分页
          }))
        }
      />
      <Divider></Divider>
      <div style={{ margin: "15px 0" }}>
        <Space style={styles.topbtn}>
          <Button type="primary" onClick={() => setModalActionType("create")}>
            添加币种
          </Button>
        </Space>
        <Space style={styles.topbtn}>
          <Button type="primary" onClick={() => handleHyClose('hy', () =>
            setQuery((prev) => {
              const prevPage = prev.page || 1
              return {
                ...prev,
                page: data.list.length === 1 ? clamp(prevPage - 1, 1, prevPage) : prevPage,
              }
            })
          )}>
            一键清仓&合约
          </Button>
        </Space>
        <Space style={styles.topbtn}>
          <Button type="primary" onClick={() => handleHyClose('xh', () =>
            setQuery((prev) => {
              const prevPage = prev.page || 1
              return {
                ...prev,
                page: data.list.length === 1 ? clamp(prevPage - 1, 1, prevPage) : prevPage,
              }
            })
          )}>
            一键清仓&现货
          </Button>
        </Space>
        <Space style={styles.topbtn}>
          <Button type="primary" onClick={() => setModalActionType("detail")}>
            账户详情
          </Button>
        </Space>
      </div>
      <Divider></Divider>
      <Table
        scroll={{
          x: window.innerWidth * 2 / 3,
          y: window.innerHeight * 2 / 3,
        }}
        rowSelection={{
          onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
          }
        }}
        pagination={{ ...antdPaginationAdapter(data.pagination) }}
        onChange={(pagination, filters, sorter) => {
          setQuery((prev) => ({
            ...prev,
            page: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
            status:
              filters.status && filters.status.length > 0
                ? Number(filters.status[0])
                : undefined,
            order:
              !Array.isArray(sorter) && !!sorter.order && sorter.field === 'key'
                ? ({ ascend: 0, descend: 1 })[sorter.order]
                : undefined
          }));
        }}
        loading={loading}
        rowkey={(record) => record.primaryKey}
        dataSource={data.list}
        columns={columns} />
      {/*  */}
      {modalActionType === "detail" && <DetailForm
        title="账户详情"
        visible={modalActionType === "detail"}
        loading={modalActionLoading}
        onCancel={() => setModalActionType("")}
      >
      </DetailForm>}
      <PostForm
        title="添加币种"
        visible={modalActionType === "create"}
        onCreate={(values) => {
          setModalActionLoading(true)
          try {
            addOrUpdate(values).then(res => {
              if (res.data.code === 200) {
                notification.open({
                  message: `消息通知`,
                  description: `修改成功${JSON.stringify(res.data)}`
                });
              } else {
                notification.open({
                  message: `消息通知`,
                  description: `修改失败${JSON.stringify(res.data)}`
                });
              }
              // 刷新列表
              setQuery((prev) => ({
                ...prev,
              }))
              setModalActionType("")
            })
          } catch (e) {
            message.error('创建失败')
          } finally {
            setModalActionLoading(false)
          }
        }}
        onCancel={() => setModalActionType("")}
        loading={modalActionLoading}
      />
      {modalActionType === "update" && <PostForm
        title="修改币种"
        visible={modalActionType === "update"}
        record={selectedRecord}
        onUpdate={(values) => {
          setModalActionLoading(true)
          try {
            addOrUpdate(values).then(res => {
              if (res.data.code === 200) {
                notification.open({
                  message: `消息通知`,
                  description: `修改成功${JSON.stringify(res.data)}`
                });
              } else {
                notification.open({
                  message: `消息通知`,
                  description: `修改失败${JSON.stringify(res.data)}`
                });
              }
              // 刷新列表
              setQuery((prev) => ({
                ...prev,
              }))
              setModalActionType("")
            })
          } catch (e) {
            message.error('修改失败')
          } finally {
            setModalActionLoading(false)
          }
        }}
        onCancel={() => setModalActionType("")}
        loading={modalActionLoading}
      />}

      <Modal
        visible={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width='80%'
        bodyStyle={{ height: window.innerHeight * 2 / 3, overflowY: 'auto' }}
        title={`${selectedRecord.coin}-${selectedRecord.type === 'hy' ? '合约' : '现货'}-${selectedRecord.flag === 1 ? '未成交订单' : '历史订单'}`}
      >
        <Table
          scroll={{
            x: window.innerWidth * 2 / 3,
            y: window.innerHeight * 2 / 3,
          }}
          loading={orderLoading}
          rowkey={(record) => record.primaryKey}
          dataSource={orderData.list}
          columns={selectedRecord.type === 'hy' ? columns_order : columns_order_xh} />
      </Modal>
    </div >
  );
}

export default SettingCoin;
