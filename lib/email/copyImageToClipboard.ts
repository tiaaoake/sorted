/**
 * Copy an image from a same-origin URL (e.g. /data/runs/.../file.png) to the system clipboard.
 */
export async function copyImageToClipboard(imageSrc: string): Promise<void> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = imageSrc.startsWith("http") ? imageSrc : `${origin}${imageSrc}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  const blob = await res.blob();
  const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";

  const item = new ClipboardItem({ [type]: blob });
  await navigator.clipboard.write([item]);
}
