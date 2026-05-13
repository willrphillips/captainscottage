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
      draft: z.boolean().default(false),
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
