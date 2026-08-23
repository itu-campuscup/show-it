import Link from "next/link";
import styles from "./page.module.css";

export default function Home() { return <main className={styles.main}><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · SPECTATOR VIEW</p><h1>Follow the heat</h1><p className={styles.description}>Pick an activity. Results are served from the static CampusCup stats feed, protecting Judge IT from spectator traffic.</p></div></header><section className={styles.cards}><Link className={styles.card} href="/drink"><span>🍺</span><h2>Drink</h2><p>Beer-chug results</p></Link><Link className={styles.card} href="/spin"><span>🌪️</span><h2>Spin</h2><p>RPM leaderboard</p></Link><Link className={styles.card} href="/sail"><span>⛵</span><h2>Sail</h2><p>Sailing results</p></Link></section></main>; }
