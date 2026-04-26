import { z } from "zod";

export const SolutionCopySchema = z.object({
  meta: z.object({
    title: z.string().min(30).max(70),
    description: z.string().min(80).max(170),
  }),
  hero: z.object({
    h1: z.string().min(10),
    subtitle: z.string().min(20),
    cta: z.string().min(4),
  }),
  pain: z.object({
    title: z.string().min(4),
    bullets: z.array(z.string().min(10)).length(3),
  }),
  benefits: z
    .array(
      z.object({
        title: z.string().min(3),
        desc: z.string().min(20),
      }),
    )
    .length(3),
  scope: z.object({
    title: z.string().min(4),
    bullets: z.array(z.string().min(5)).min(6).max(10),
  }),
  useCases: z
    .array(
      z.object({
        title: z.string().min(3),
        desc: z.string().min(15),
      }),
    )
    .min(4)
    .max(6),
  stack: z.object({
    title: z.string().min(4),
    options: z
      .array(
        z.object({
          name: z.string().min(2),
          note: z.string().min(10),
        }),
      )
      .min(4)
      .max(6),
  }),
  howItWorks: z.object({
    steps: z
      .array(
        z.object({
          title: z.string().min(3),
          desc: z.string().min(10),
        }),
      )
      .length(3),
  }),
  faq: z
    .array(
      z.object({
        q: z.string().min(8),
        a: z.string().min(20),
      }),
    )
    .min(4)
    .max(6),
  ctaFinal: z.object({
    title: z.string().min(8),
    desc: z.string().min(15),
    button: z.string().min(4),
  }),
});

export type SolutionCopy = z.infer<typeof SolutionCopySchema>;
