/** Longest side of a stored photo: sharp on big screens, light enough for phones. */
const MAX_SIDE = 1600;

/**
 * Turns a photo picked on a phone or computer into a resized JPEG, base64-encoded for the API.
 * Camera photos are often 4-12 MB; after this they are usually 200-500 KB.
 */
export async function preparePhoto(file: File): Promise<{ type: string; data: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha uma fotografia (JPG, PNG, HEIC ou WebP).");
  // Very old browsers (and test runners) cannot resize: send the file as it is when the API accepts it.
  if (typeof createImageBitmap !== "function") {
    if (!SENDABLE.includes(file.type)) throw new Error("Este navegador não consegue preparar a fotografia. Use JPG ou PNG.");
    return { type: file.type, data: toBase64(await readBytes(file)) };
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Não foi possível abrir esta fotografia. Experimente outra ou tire uma nova.");
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Não foi possível preparar a fotografia.");
  return { type: "image/jpeg", data: toBase64(await readBytes(blob)) };
}

const SENDABLE = ["image/jpeg", "image/png", "image/webp"];

/** FileReader rather than Blob.arrayBuffer(), which some older phones lack. */
function readBytes(file: Blob) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("Não foi possível ler a fotografia."));
    reader.readAsArrayBuffer(file);
  });
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

/** Demo photos live on the public site (e.g. /demo/gato.svg); uploaded ones are full URLs. */
export function photoSrc(url: string) {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}
