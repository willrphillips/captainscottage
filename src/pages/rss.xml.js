import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { PROPERTY, SITE, absoluteUrl } from "~/lib/site";

export async function GET(context) {
  let posts = [];
  try {
    posts = await getCollection("blog", ({ data }) => !data.draft);
  } catch {
    posts = [];
  }

  return rss({
    title: `${PROPERTY.name} — Journal`,
    description: "Lifestyle, travel, and real estate notes from Virginia's Northern Neck.",
    site: context.site ?? `${SITE.origin}${SITE.base}`,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      link: absoluteUrl(`/journal/${p.id}`),
      categories: [p.data.category],
    })),
    customData: `<language>en-us</language>`,
  });
}
