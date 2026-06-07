import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kimi — The Interactive 3D Periodic Table",
    short_name: "Kimi",
    description: "Explore the elements visually and balance chemical equations instantly. Designed for chemistry students.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b", // zinc-950
    theme_color: "#f59e0b", // amber-500
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
