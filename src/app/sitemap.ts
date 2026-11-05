// RUAN MARCELO RAMACIOTI LUZ
import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";

export default function sitemap(): MetadataRoute.Sitemap { return [{ url: storeConfig.appUrl, changeFrequency: "weekly", priority: 1 }, { url: storeConfig.appUrl + "/catalogo", changeFrequency: "daily", priority: 0.8 }]; }
