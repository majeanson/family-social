import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Famolo",
    short_name: "Famolo",
    description: "Visualize and manage your family and friend relationships",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    // Prefer opening links in the installed app
    // @ts-expect-error - handle_links is a valid manifest property but not in Next.js types
    handle_links: "preferred",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["lifestyle", "utilities"],
    // Handle JSON file imports
    file_handlers: [
      {
        action: "/",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
    // Launch handler for in-app navigation
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
  };
}
