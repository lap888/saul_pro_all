import { Button, Form, Input } from "antd";

export function SearchForm(props) {
    const { onSubmit, onReset } = props
    const [form] = Form.useForm()
    const handleReset = () => {
        form.resetFields()
        onReset({ coin: '' })
    }
    return (
        <Form form={form} layout='inline' onFinish={onSubmit}>
            <Form.Item name='coin'>
                <Input style={{ margin: 10 }} addonBefore="币种" placeholder='输入搜索币种' />
            </Form.Item>
            <Button style={{ margin: 10 }} htmlType='submit' type='primary'>
                搜索
            </Button>
            <Button style={{ margin: 10 }} htmlType='button' onClick={handleReset}>
                重置
            </Button>
        </Form>
    )
}