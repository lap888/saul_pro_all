import { useEffect } from 'react';
import { Card, Input, Button, Form, Checkbox, notification, Divider, Modal } from "antd";
import { getConfigKey, setConfigKey } from '@/http/api';

const styles = {
  bg: {
    padding: 30,
    background: '#ececec'
  }
}

function SettingKey() {
  const [form] = Form.useForm()
  const [formProxy] = Form.useForm()
  useEffect(() => {
    //获取配置
    getConfigKey().then(res => {
      let record = res.data;
      form.setFieldsValue({
        apiKey: record?.apiKey,
        apiSecret: record?.apiSecret
      })
      formProxy.setFieldsValue({
        proxy: record?.proxy,
        proxyIp: record?.proxyIp,
        env: record?.env
      })
    })
  }, [formProxy, form])
  const handleSubmit = () => {


    form.validateFields().then((values) => {
      Modal.confirm({
        title: '提示',
        content: <p>您当前未成交的挂单不会被自动取消; 请确认当前api中的持仓情况,更换api后将不会再进行买入卖出操作</p>,
        onOk: () => {
          try {
            setConfigKey({ apiKey: values.apiKey, apiSecret: values.apiSecret }).then(res => {
              notification.open({
                message: `消息通知`,
                description: `保存成功${JSON.stringify(res.data)}`
              });
            })
          } catch (e) {
            notification.open({
              message: `消息通知`,
              description: `${e}`
            });
          }
        }
      })
    })
  }
  const handleSubmitProxy = () => {
    formProxy.validateFields().then((values) => {
      console.log(values)
      setConfigKey({ proxy: values.proxy, proxyIp: values.proxyIp, env: values.env }).then(res => {
        notification.open({
          message: `消息通知`,
          description: `保存成功${JSON.stringify(res.data)}`
        });
      })
    })
  }
  return (
    <div style={styles.bg}>
      <Divider>账户API配置</Divider>
      <Card
        title="币交易所配置参数"
        bordered={false}
        style={{
          width: '100%',
        }}
      >
        <Form form={form}>
          <Form.Item
            name='apiKey'
            rules={[
              {
                required: true,
                message: 'apiKey is required',
              },
            ]}
          >
            <Input addonBefore="Access Key" placeholder="Access Key" allowClear={true} />
          </Form.Item>

          <Divider />
          <Form.Item
            name='apiSecret'
            rules={[
              {
                required: true,
                message: 'apiSecret is required',
              },
            ]}
          >
            <Input.Password addonBefore="Secret Key" placeholder="Secret Key" allowClear={true} autoComplete="off" />
          </Form.Item>
          <Divider />
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Form>
      </Card>
      <Divider>代理VPN配置</Divider>
      <Card
        title="代理VPN配置参数"
        bordered={false}
        style={{
          width: '100%',
        }}
      >
        <Form form={formProxy}>
          <Form.Item
            name='proxyIp'
          >
            <Input addonBefore="proxyIp" placeholder="proxyIp" allowClear={true} />
          </Form.Item>
          <Divider />
          <Form.Item
            name='proxy'
          >
            <Input addonBefore="proxy" placeholder="proxy" allowClear={true} />
          </Form.Item>
          <Form.Item
            name='env'
            valuePropName="checked"
          >
            <Checkbox>启动</Checkbox>
          </Form.Item>

          <Divider />

          <Button type="primary" onClick={handleSubmitProxy}>保存</Button>
        </Form>
      </Card>
    </div>
  );
}

export default SettingKey;