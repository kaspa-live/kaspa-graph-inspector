import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Canvas from '../components/Canvas'

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>kaspa-dag-visualizer</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Canvas/>
            <div className={styles.header}>
                <div className={styles.logo}/>
                <div className={styles.title}>kaspa-dag-visualizer</div>
            </div>
        </div>
    )
}
