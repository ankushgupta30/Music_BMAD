import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchPostcardPublic } from "@/lib/postcard/fetchPostcardPublic";
import styles from "./postcard-view.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const admin = getAdminClient();
  if (!admin) {
    return { title: "Postcard — Rewind" };
  }

  const data = await fetchPostcardPublic(admin, id);
  if (!data) {
    return { title: "Postcard — Rewind" };
  }

  const title = `${data.artist_name} — for you · Rewind`;
  const description = data.note_text.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(data.artwork_url
        ? { images: [{ url: data.artwork_url, width: 640, height: 640 }] }
        : {}),
    },
    twitter: {
      card: data.artwork_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(data.artwork_url ? { images: [data.artwork_url] } : {}),
    },
  };
}

function ConfigMissing() {
  return (
    <main className={styles.center}>
      <p className="font-meta" style={{ color: "var(--color-text-meta)" }}>
        Postcards aren&apos;t available yet (server configuration).
      </p>
    </main>
  );
}

export default async function PostcardPage({ params }: Props) {
  const { id } = await params;
  const admin = getAdminClient();
  if (!admin) return <ConfigMissing />;

  const data = await fetchPostcardPublic(admin, id);
  if (!data) notFound();

  return (
    <main className={styles.main}>
      <p className={styles.kicker}>Someone sent you music</p>

      {data.artwork_url ? (
        <div className={styles.artWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.artwork_url}
            alt={`${data.album_name} cover`}
            className={styles.art}
            width={320}
            height={320}
          />
        </div>
      ) : null}

      <h1 className={`font-display ${styles.artist}`}>{data.artist_name}</h1>
      <p className={`font-meta ${styles.meta}`}>
        {data.album_name}
        {data.release_year > 0 ? ` · ${data.release_year}` : ""}
      </p>

      <div className={styles.noteBlock}>
        <p className={`font-hand ${styles.note}`}>{data.note_text}</p>
      </div>
    </main>
  );
}
