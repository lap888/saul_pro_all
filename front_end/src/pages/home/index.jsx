import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { getConfig } from '@/http/api';
const styles = {
  textAlign: 'center',
  title: {
    margin: '30px 30px',
    fontSize: '55px',
    fontWeight: '900',
    color: '#253445',
    whiteSpace: 'wrap',
    lineHeight: '1.25',
  },
  fontC: {
    backgroundImage: '-webkit-linear-gradient(315deg,#42d392 25%,#647eff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    // fontStyle: 'italic'
  },
  desc: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#aaa',
    marginTop: `${window.innerHeight / 2}px`
  },
};
function Home() {
  useEffect(() => {
    getConfig({}).then(res => {
      // console.log(res.data.data)
    }).catch(err => {
      console.log(err)
    })
  }, []);
  return (
    <div style={styles}>
      <h1 style={styles.title}>
        <span style={styles.fontC}>欢迎来到量化交易系统</span>
      </h1>
      {/* <p style={styles.desc}>{(new Date().getFullYear())}@Author & WeChat  QQ </p> */}
    </div>
  );
}

export default observer(Home);
