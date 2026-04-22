import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quản lý Thi công",
    short_name: "QL Thi công",
    description: "Hệ thống quản lý thi công xây dựng: tiến độ, dòng tiền, nhân sự.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
