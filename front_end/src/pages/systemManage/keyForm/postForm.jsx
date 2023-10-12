import React, { useState, useRef } from 'react';
import { Form, Input, InputNumber, Divider, Checkbox, Modal, Select, Space, Button, notification } from "antd";
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

export function PostForm(props) {
    const {
        visible,
        onCancel,
        onCreate,
        onUpdate,
        loading,
        record,
        title,
    } = props
    const [form] = Form.useForm()
    const [form2] = Form.useForm()

    const handleSubmit2 = () => {
        form2.validateFields().then((values) => {
            let _indicator = ''
            if (values.indicator === 'MA') {
                _indicator = `${values.ktime}&${values.indicator}|${values.ii1}&${values.indicator}|${values.ii2}`
            }
            if (values.indicator === 'SAR') {
                _indicator = `${values.ktime}&${values.indicator}|${values.ii3}|${values.ii1}|${values.ii2}`
            }
            if (values.indicator === 'BOLL') {
                _indicator = `${values.ktime}&${values.indicator}|${values.ii1}|${values.ii2}`
            }
            if (values.indicator === 'KDJ') {
                _indicator = `${values.ktime}&${values.indicator}|${values.ii1}|${values.ii2}|${values.ii3}`
            }
            if (values.indicator === 'MACD') {
                _indicator = `${values.ktime}&${values.indicator}|${values.ii1}|${values.ii2}|${values.ii3}`
            }
            addItem(_indicator)
            setIsModalVisible(false);

        })
    }
    const handleSubmit = () => {
        form.validateFields().then((values) => {
            if (record) {
                onUpdate &&
                    onUpdate({
                        ...values,
                        key: record.key,
                        status: record.status
                    })
            } else {
                onCreate && onCreate(values)
            }
        })
    }
    //内部modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const showModal = () => {
        setIsModalVisible(true);
    };
    const handleCancel = () => {
        setIsModalVisible(false);
    };
    // 初始化表单
    React.useEffect(() => {
        if (!visible) {
            return;
        }
        form.setFieldsValue({
            cancelTime: record?.cancelTime,
            coin: record?.coin,
            endTime: record?.endTime,
            indicator: record?.indicator,
            lever: record?.lever,
            isNowDo: record?.isNowDo === "true" ? true : false,
            startNowDo: record?.startNowDo === "true" ? true : false,
            margin: record?.margin,
            minAmount: record?.minAmount,
            orderRate: record?.orderRate,
            orderType: record?.orderType,
            sellRate: record?.sellRate,
            startTime: record?.startTime,
            stopLoss: record?.stopLoss,
            stopPft: record?.stopPft,
            type: record?.type,
            fOrderRate: record?.fOrderRate,
            stopLossRate: record?.stopLossRate
        })
    }, [record, form, visible])

    const [items, setItems] = useState([]);

    const [indicts, setIndicts] = useState('');

    const [type, setType] = useState('hy');

    const inputRef = useRef(null);
    let _iRate = 0;
    let _level = 0;
    if (title === "修改币种") {
        _iRate = record?.stopPft
        _level = record?.lever
        // console.log(_iRate, _level)
    }
    const [iRate, setIRate] = useState(_iRate);
    const [level, setLevel] = useState(_level);
    const addItem = (indict) => {
        if (indict !== '' && indict !== undefined) {
            setItems([...items, indict]);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        } else {
            notification.open({
                message: `消息通知`,
                description: `指标不能为空`
            });
        }
    };
    return (
        <>
            <Modal
                forceRender={true}
                title={title}
                visible={visible}
                onCancel={onCancel}
                onOk={handleSubmit}
                maskClosable={false}
                okButtonProps={{ loading }}
                width='80%'
                bodyStyle={{ height: window.innerHeight * 2 / 3, overflowY: 'auto' }}
            >
                <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                    <Form.Item
                        name='coin'
                        label='币种'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}>
                        <Input placeholder='ETHUSDT'></Input>
                    </Form.Item>
                    <Form.Item
                        name='type'
                        label='币种类型'
                        rules={[
                            {
                                required: true,
                                message: '类型 必须选择',
                            }
                        ]}>
                        <Select onChange={(value) => setType(value)}>
                            <Option value="hy">合约</Option>
                            <Option value="xh">现货</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='orderType'
                        label='订单类型'
                        rules={[
                            {
                                required: true,
                                message: '类型 必须选择',
                            }
                        ]}>
                        {/* <Tooltip title="无特殊情况请选限价"> */}
                        <Select>
                            {type === 'hy' && <Option value="maker">只做Maker</Option>}
                            <Option value="limit">限价</Option>
                            <Option value="market">市价</Option>
                        </Select>
                        {/* </Tooltip> */}

                    </Form.Item>
                    <Form.Item
                        name='orderRate'
                        label='下单占比'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='1=1%'></Input>
                    </Form.Item>
                    <Form.Item
                        name='fOrderRate'
                        label='首次开单百分比'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='1=1%'></Input>
                    </Form.Item>
                    <Form.Item
                        name='minAmount'
                        label='最小下单金额'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='50=50U'></Input>
                    </Form.Item>
                    <Form.Item
                        name='lever'
                        label='杠杆'
                        onChange={(v) => {
                            setLevel(v.target.value)
                        }}
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}>
                        <InputNumber min={1} placeholder='20=20倍杠杆'></InputNumber>
                    </Form.Item>
                    <Form.Item
                        name='margin'
                        label='保证金'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}>
                        <InputNumber min={1} placeholder='100=100U'></InputNumber>
                    </Form.Item>
                    <Form.Item
                        name='indicator'
                        label='指标'
                        rules={[
                            {
                                required: true,
                                message: '类型 必须选择',
                            }
                        ]}>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{
                                width: '100%',
                            }}
                            placeholder="选择指标"
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider
                                        style={{
                                            margin: '8px 0',
                                        }}
                                    />
                                    <Space
                                        style={{
                                            padding: '0 8px 4px',
                                        }}>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                                            添加
                                        </Button>
                                    </Space>
                                </>
                            )}
                        >
                            {items.map((item) => (
                                <Option key={item}>{item}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label='价格止盈百分比'>
                        <Form.Item
                            name='stopPft'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}
                            onChange={(v) => {
                                setIRate(v.target.value)
                            }}
                        >
                            <Input type='number' placeholder='1=1% 价格波动的百分之一'></Input>
                        </Form.Item>
                        <b>杠杆*价格止盈百分比=ROE:{1 * iRate * level}%</b>
                    </Form.Item>

                    <Form.Item
                        name='sellRate'
                        label='卖出百分比'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='1=1% 百分之一'></Input>
                    </Form.Item>
                    <Form.Item
                        name='stopLoss'
                        label='价格止损百分比'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='1=1%'></Input>
                    </Form.Item>
                    <Form.Item
                        name='stopLossRate'
                        label='止损卖出百分比'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='1=当前持仓的1%'></Input>
                    </Form.Item>
                    <Form.Item
                        name='startTime'
                        label='运行开始时间'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='0'></Input>
                    </Form.Item>
                    <Form.Item
                        name='endTime'
                        label='运行截止时间'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='24'></Input>
                    </Form.Item>
                    <Form.Item
                        name='cancelTime'
                        label='挂单撤销时间'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            },
                        ]}
                    >
                        <Input type='number' placeholder='单位秒 挂单x秒不成交撤销重新挂单'></Input>
                    </Form.Item>

                    <Form.Item
                        name='startNowDo'
                        label='启动立即开单:'
                        valuePropName="checked"
                    >
                        <Checkbox></Checkbox>
                    </Form.Item>
                    <Form.Item
                        name='isNowDo'
                        label='反向立即开单:'
                        valuePropName="checked"
                    >
                        <Checkbox></Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal width='70%' maskClosable={false} title="添加指标" visible={isModalVisible} onOk={() => handleSubmit2()} onCancel={handleCancel}>
                <Form form={form2} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                    <Form.Item
                        name='indicator'
                        label='指标'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            }
                        ]}>
                        <Select onChange={(value) => setIndicts(value)}>
                            <Option value="SAR">SAR</Option>
                            <Option value="MA">MA</Option>
                            <Option value="KDJ">KDJ</Option>
                            <Option value="BOLL">BOLL</Option>
                            <Option value="MACD">MACD</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='ktime'
                        label='K周期'
                        rules={[
                            {
                                required: true,
                                message: '不能为空',
                            }
                        ]}>
                        <Select>
                            <Option value="1m">1分</Option>
                            <Option value="3m">3分</Option>
                            <Option value="5m">5分</Option>
                            <Option value="15m">15分</Option>
                            <Option value="30m">30分</Option>
                            <Option value="1h">1小时</Option>
                            <Option value="2h">2小时</Option>
                            <Option value="4h">4小时</Option>
                            <Option value="6h">6小时</Option>
                            <Option value="8h">8小时</Option>
                            <Option value="12h">12小时</Option>
                            <Option value="1d">1日</Option>
                            <Option value="3d">3日</Option>
                            <Option value="1w">1周</Option>
                            <Option value="1M">1月</Option>
                        </Select>
                    </Form.Item>
                    {indicts === 'MA' && <>
                        <Form.Item
                            name='ii1'
                            label='MA参数1'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='输入7=MA7'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii2'
                            label='MA参数2'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='输入21=MA21'></Input>
                        </Form.Item>
                    </>}
                    {indicts === 'SAR' && <>
                        <Form.Item
                            name='ii3'
                            label='开始'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入0.02'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii1'
                            label='增量'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入0.02'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii2'
                            label='最大'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入0.2'></Input>
                        </Form.Item>

                    </>}
                    {indicts === 'KDJ' && <>
                        <Form.Item
                            name='ii1'
                            label='计算周期'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入9'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii2'
                            label='移动平均周期1'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入3'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii3'
                            label='移动平均周期2'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入3'></Input>
                        </Form.Item>
                    </>}
                    {indicts === 'BOLL' && <>
                        <Form.Item
                            name='ii1'
                            label='周期'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入21'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii2'
                            label='带宽'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入2'></Input>
                        </Form.Item>
                    </>}
                    {indicts === 'MACD' && <>
                        <Form.Item
                            name='ii1'
                            label='快线周期'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入12'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii2'
                            label='慢线周期'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入26'></Input>
                        </Form.Item>
                        <Form.Item
                            name='ii3'
                            label='信号周期'
                            rules={[
                                {
                                    required: true,
                                    message: '不能为空',
                                },
                            ]}>
                            <Input placeholder='默认输入9'></Input>
                        </Form.Item>
                    </>}
                </Form>
            </Modal>
        </>
    )
}