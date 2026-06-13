export async function imageUrlToBuffer(
  imageUrl: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (imageUrl.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
    if (!match) throw new Error("Invalid data URL");
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }

  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Could not load meal image");
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}
