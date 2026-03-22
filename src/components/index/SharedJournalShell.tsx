import shellStyles from "./index-shell.module.css";
import sharedStyles from "./shared-journal-shell.module.css";

export default function SharedJournalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={shellStyles.shell}>
      <aside className={shellStyles.sidebar} aria-label="Rewind">
        <span className={shellStyles.logo}>Rewind</span>
      </aside>
      <div className={shellStyles.main}>
        <p className={sharedStyles.banner}>Shared with you</p>
        {children}
      </div>
    </div>
  );
}
