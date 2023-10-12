import { useState, useEffect,useRef } from 'react';
import { Table, Modal, Button, notification, Space, Divider } from "antd";
import { getLogs, delLogs } from '@/http/api';

function handleDelete(onSuccess) {
  Modal.confirm({
    title: '清空日志提示',
    content: <p>确定清空日志 吗?</p>,
    onOk: () => {
      try {
        delLogs().then(res => {
          notification.open({
            message: `消息通知`,
            description: `清空日志=>${JSON.stringify(res.data)}`
          });
          onSuccess()
        })
      } catch (e) {
        notification.open({
          message: `消息通知`,
          description: `清空日志=>${e}`
        });
      }
    }
  })
}
function ShowLogs() {
  const columns = [
    {
      dataIndex: 'key', title: '编号', width: 80,
      display: 'none'
    },
    {
      dataIndex: 'logs', title: '日志内容', width: 500
    },
    {
      dataIndex: 'time', title: '时间', width: 180
    }

  ]  
  const [data, setData] = useState([])
  const timerRef = useRef();
  useEffect(() => {
    getLogs().then(res => {
      setData(res.data.data)
      timerRef.current = setInterval(() => {
        getLogs().then(res1 => {
          setData(res1.data.data)
        })
      }, 2500);
    })
    return () => {
      timerRef.current && clearInterval(timerRef.current)
    }
  }, [])
  return (
    <div>
      <Divider>日志面板</Divider>
      <div style={{ margin: "15px 0" }}>
        <Space style={{ margin: 20 }}>
          <Button type="primary" onClick={() => {
            handleDelete(() => {
              getLogs().then(res => {
                setData(res.data.data)
              })
            })
          }}>
            清空日志
          </Button>
        </Space>
      </div>
      <Divider></Divider>
      <Table
        scroll={{
          x: window.innerWidth * 2 / 3,
          y: window.innerHeight * 2 / 3,
        }}
        rowkey={(record) => record.primaryKey}
        dataSource={data}
        columns={columns} />
    </div>
  );
}

export default ShowLogs;