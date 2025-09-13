import { z } from "zod"

export const menuItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  action_type: z.enum(["screen", "url", "action", "section"]),
  action_value: z.string().min(1),
  parent_id: z.string().optional(),
  section_id: z.string().min(1),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  is_premium: z.boolean(),
  requires_auth: z.boolean(),
  meta_data: z.record(z.string(), z.any()).optional(),
})

export const menuSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  layout: z.enum(["grid", "list", "horizontal"]),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  meta_data: z.record(z.string(), z.any()).optional(),
})

export type MenuItem = z.infer<typeof menuItemSchema>
export type MenuSection = z.infer<typeof menuSectionSchema>