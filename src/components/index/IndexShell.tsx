import SpotifySidebarSlot from "@/components/shared/SpotifySidebarSlot";
import styles from "./index-shell.module.css";

export default function IndexShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Site">
        <span className={styles.logo}>Rewind</span>
        <SpotifySidebarSlot />
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
