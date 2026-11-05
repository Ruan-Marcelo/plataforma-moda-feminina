// RUAN MARCELO RAMACIOTI LUZ
import { prisma } from "@/lib/db/prisma";

export type AdminAnalyticsSummary = {
  days: number;
  since: string;
  totalEvents: number;
  pageViews: number;
  uniqueVisitors: number;
  productViews: number;
  whatsappClicks: number;
  tryOnStarted: number;
  tryOnCompleted: number;
  topProducts: Array<{ productId: string; views: number }>;
};

export async function getAdminAnalyticsSummary(days: 7 | 30 | 90 = 7): Promise<AdminAnalyticsSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };
  const [eventCounts, visitors, productViews] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ["name"], where, _count: { _all: true } }),
    prisma.analyticsEvent.findMany({ where, distinct: ["anonymousId"], select: { anonymousId: true } }),
    prisma.analyticsEvent.groupBy({ by: ["productId"], where: { ...where, name: "product_view", productId: { not: null } }, _count: { _all: true }, orderBy: { _count: { productId: "desc" } }, take: 5 }),
  ]);

  const counts = new Map(eventCounts.map((item) => [item.name, item._count._all]));
  const get = (name: string) => counts.get(name) ?? 0;
  return {
    days,
    since: since.toISOString(),
    totalEvents: eventCounts.reduce((total, item) => total + item._count._all, 0),
    pageViews: get("page_view"),
    uniqueVisitors: visitors.length,
    productViews: get("product_view"),
    whatsappClicks: get("whatsapp_click"),
    tryOnStarted: get("virtual_try_on_started"),
    tryOnCompleted: get("virtual_try_on_completed"),
    topProducts: productViews.flatMap((item) => item.productId ? [{ productId: item.productId, views: item._count._all }] : []),
  };
}
