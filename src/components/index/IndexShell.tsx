import SpotifyIcon from "@/components/shared/SpotifyIcon";
import styles from "./index-shell.module.css";

export default function IndexShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Site">
        <span className={styles.logo}>Rewind</span>
        <SpotifyIcon />
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
