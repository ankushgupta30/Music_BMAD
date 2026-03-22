import IndexLayout from "@/components/index/IndexLayout";
import IndexShell from "@/components/index/IndexShell";
import { SEED_ENTRIES } from "@/lib/utils/seedData";

export default function Home() {
  return (
    <IndexShell>
      <IndexLayout entries={SEED_ENTRIES} />
    </IndexShell>
  );
}
