import { useEffect, useState } from "react";
import { getBlob } from "@/lib/media";

export function LibraryThumb({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let u = "";
    getBlob(id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img src={url} alt="" className="aspect-[4/3] w-full bg-muted object-cover" /> : <div className="aspect-[4/3] w-full bg-muted" />;
}
