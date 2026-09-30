import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Aperçu affiché quand un lien MoriWords est partagé (Discord, réseaux…).
export const alt = "MoriWords : tes animes deviennent tes cours de japonais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const icon = await readFile(join(process.cwd(), "public/icons/icon-512.png"));
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 90px",
          background: "#f5f5f1",
          color: "#1f2328",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse n'accepte que <img>. */}
        <img src={iconSrc} width={220} height={220} alt="" style={{ borderRadius: 48 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800 }}>MoriWords</div>
          <div style={{ fontSize: 42, lineHeight: 1.3, maxWidth: 720 }}>Tes animes deviennent tes cours de japonais.</div>
          <div style={{ fontSize: 30, color: "#cd2d1c" }}>Expliqué en français · gratuit pour commencer</div>
        </div>
      </div>
    ),
    size,
  );
}
