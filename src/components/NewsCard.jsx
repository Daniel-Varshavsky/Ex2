import styles from "./NewsCard.module.css";

function formatStars(n) {
  if (typeof n !== "number") return "";
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function NewsCard({ repo }) {
  const title = repo?.full_name || repo?.name || "Untitled";
  const desc = repo?.description || "No description provided.";
  const url = repo?.html_url || "#";
  const stars = repo?.stargazers_count ?? 0;
  const lang = repo?.language || "";
  const owner = repo?.owner?.login || "";
  const avatar = repo?.owner?.avatar_url || "";

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.identity}>
          {avatar ? <img className={styles.avatar} src={avatar} alt="" /> : null}
          <div className={styles.titles}>
            <a className={styles.title} href={url} target="_blank" rel="noreferrer">
              {title}
            </a>
            <div className={styles.meta}>
              <span className={styles.owner}>{owner}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.stars}>★ {formatStars(stars)}</span>
              {lang ? (
                <>
                  <span className={styles.dot}>•</span>
                  <span className={styles.lang}>{lang}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <a className={styles.openBtn} href={url} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>

      <p className={styles.desc}>{desc}</p>
    </article>
  );
}
