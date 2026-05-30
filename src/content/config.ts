import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(["Lifestyle", "Travel", "Real Estate"]),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      author: z.string().default("Will Phillips"),
      hero: image().optional(),
      heroAlt: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      // Audience tags per brief: family / romantic / outdoor / food / seasonal / remote-work.
      // Optional — posts can carry zero, one, or several. Used by future filtering UI
      // and by the Editor agent when selecting the next calendar slot.
      audience: z
        .array(z.enum(["family", "romantic", "outdoor", "food", "seasonal", "remote-work"]))
        .default([]),
      draft: z.boolean().default(false),
      // Set by the ReviewPanel when Will hits "Approve" — the post is
      // batch-approved and removed from the review queue, but still
      // gated by `draft: true` until Will manually flips it. Cleared
      // by the panel's "Re-open" action.
      approvedAt: z.coerce.date().optional(),
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/guides" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      kind: z.enum(["area", "activity"]),
      hero: image().optional(),
      heroAlt: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      order: z.number().default(0),
    }),
});

export const collections = { blog, guides };
