import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={`${styles.hero} container`}>
        <h1 className={styles.title}>Diário Digital</h1>
        <p className={styles.subtitle}>
          Tecnologia para tocar a alma e despertar a mente.
        </p>
      </div>
    </main>
  );
}
