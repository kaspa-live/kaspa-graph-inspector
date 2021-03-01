import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Canvas from '../components/Canvas'

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>kaspa-dag-visualizer</title>
                <link rel="icon" type="image/png" href="./favicon.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png" />
                <link rel="mask-icon" href="./kaspa_mask_icon.svg" color="#F05A28" />
            </Head>
            <Canvas/>
            <div className={styles.header}>
                <div className={styles.logo}/>
                <div className={styles.title}>kaspa-dag-visualizer</div>
            </div>
        </div>
    )
}
