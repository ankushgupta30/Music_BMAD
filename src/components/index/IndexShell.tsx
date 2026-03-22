import IndexShellClient from "./IndexShellClient";

export default function IndexShell({ children }: { children: React.ReactNode }) {
  return <IndexShellClient>{children}</IndexShellClient>;
}
