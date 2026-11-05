// RUAN MARCELO RAMACIOTI LUZ
import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";

export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }, sitemap: storeConfig.appUrl + "/sitemap.xml" }; }
