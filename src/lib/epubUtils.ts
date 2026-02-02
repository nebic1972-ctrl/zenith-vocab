import JSZip from "jszip";

/**
 * EPUB dosyasından metin çıkarır.
 * string (URL), File veya Blob kabul eder. Kelime dizisi döner (RSVP reader için).
 */
export async function extractTextFromEPUB(
  input: string | File | Blob
): Promise<string[]> {
  let zip: JSZip;
  if (typeof input === "string") {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`EPUB indirilemedi: ${res.statusText}`);
    const buf = await res.arrayBuffer();
    zip = await JSZip.loadAsync(buf);
  } else {
    zip = await JSZip.loadAsync(input);
  }

  // 1. Container.xml'den asıl içerik dosyasının (OPF) yerini bul
  const container = await zip.file("META-INF/container.xml")?.async("string");
  if (!container) throw new Error("EPUB yapısı bozuk (container.xml yok).");

  const opfPathMatch = container.match(/full-path="([^"]+)"/);
  const opfPath = opfPathMatch ? opfPathMatch[1] : null;
  if (!opfPath) throw new Error("OPF dosyası bulunamadı.");

  // 2. OPF dosyasını oku
  const rootDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/")) + "/"
    : "";
  const opfContent = await zip.file(opfPath)?.async("string");
  if (!opfContent) throw new Error("OPF içeriği okunamadı.");

  // 3. Okuma sırasını (spine) ve dosya listesini (manifest) çıkar
  const spineRegex = /<itemref idref="([^"]+)"/g;
  const manifestRegex = /<item id="([^"]+)" href="([^"]+)"/g;

  const spineIds: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = spineRegex.exec(opfContent)) !== null) {
    spineIds.push(match[1]);
  }

  const manifest: Record<string, string> = {};
  while ((match = manifestRegex.exec(opfContent)) !== null) {
    manifest[match[1]] = match[2];
  }

  // 4. HTML dosyalarını sırayla gez ve metni çek
  let fullText = "";

  for (const id of spineIds) {
    const href = manifest[id];
    if (href) {
      const filePath = rootDir + decodeURIComponent(href);
      const htmlContent = await zip.file(filePath)?.async("string");

      if (htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        const textContent = doc.body?.textContent ?? "";
        fullText += textContent + " ";
      }
    }
  }

  // 5. Temizle ve kelimelere böl
  return fullText
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}
