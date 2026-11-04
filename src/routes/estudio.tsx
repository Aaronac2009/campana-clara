import { createFileRoute } from "@tanstack/react-router";
import { ImageStudio } from "@/components/app/ImageStudio";

export const Route = createFileRoute("/estudio")({
  head: () => ({ meta: [
    { title: "Estudio de imágenes · Campaña Clara" },
    { name: "description", content: "Edición privada y local de imágenes para campañas institucionales." },
    { property: "og:title", content: "Estudio de imágenes · Campaña Clara" },
    { property: "og:description", content: "Importá, editá y exportá imágenes sin enviarlas a servidores." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ImageStudio,
});