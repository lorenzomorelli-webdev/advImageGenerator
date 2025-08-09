import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Adv Image Generator</h1>
      <p className="text-muted-foreground mt-2">Tool locale per generare immagini in batch.</p>
      <div className="mt-6">
        <Link className="underline" href="/editor">Apri l&apos;editor</Link><br />
        <Link className="underline" href="/api/generate/batch-html">Batch HTML renderer</Link><br />
        <div className="mt-2 text-sm text-muted-foreground">Batch HTML renderer disponibile su <code>/api/generate/batch-html</code></div>
      </div>
    </div>
  );
}
