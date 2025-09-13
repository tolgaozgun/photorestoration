import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MenuItem, MenuSection } from "@/lib/schemas"
import { api } from "@/lib/api"
import { Loader2, X } from "lucide-react"

const menuItemFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  action_type: z.enum(["screen", "url", "action", "section"]),
  action_value: z.string().min(1, "Action value is required"),
  parent_id: z.string().optional(),
  section_id: z.string().min(1, "Section is required"),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  is_premium: z.boolean(),
  requires_auth: z.boolean(),
  meta_data: z.record(z.string(), z.any()).optional(),
})

type MenuItemFormData = z.infer<typeof menuItemFormSchema>

interface MenuItemFormProps {
  item?: MenuItem
  sections: MenuSection[]
  onSave: (item: MenuItem) => void
  onCancel: () => void
}

export function MenuItemForm({ item, sections, onSave, onCancel }: MenuItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(item?.icon || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: item ? {
      title: item.title,
      description: item.description || "",
      action_type: item.action_type,
      action_value: item.action_value,
      parent_id: item.parent_id || "",
      section_id: item.section_id,
      sort_order: item.sort_order,
      is_active: item.is_active,
      is_premium: item.is_premium,
      requires_auth: item.requires_auth,
      meta_data: item.meta_data || {},
    } : {
      title: "",
      description: "",
      action_type: "screen",
      action_value: "",
      parent_id: "",
      section_id: sections[0]?.id || "",
      sort_order: 0,
      is_active: true,
      is_premium: false,
      requires_auth: false,
      meta_data: {},
    },
  })

  watch("section_id")

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an animated image
      const validTypes = ['image/gif', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert("Please upload a GIF, PNG, or WebP file")
        return
      }

      setIconFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeIcon = () => {
    setIconFile(null)
    setIconPreview(null)
    // Icon URL will be set after upload
  }

  const uploadIcon = async (file: File): Promise<string> => {
    try {
      const result = await api.uploadIcon(file)
      return result.url
    } catch (error) {
      console.error("Error uploading icon:", error)
      throw error
    }
  }

  const onSubmit = async (data: MenuItemFormData) => {
    setIsSubmitting(true)
    try {
      let iconUrl = item?.icon

      // Upload new icon if provided
      if (iconFile) {
        iconUrl = await uploadIcon(iconFile)
      }

      const itemData = {
        ...data,
        icon: iconUrl,
      }

      let savedItem: MenuItem
      if (item) {
        savedItem = await api.updateItem(item.id, itemData)
      } else {
        savedItem = await api.createItem(itemData)
      }

      onSave(savedItem)
    } catch (error) {
      console.error("Error saving menu item:", error)
      alert("Error saving menu item. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{item ? "Edit Menu Item" : "Create Menu Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                {...register("title")}
                placeholder="Enter title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <select
                {...register("action_type")}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="screen">Screen</option>
                <option value="url">URL</option>
                <option value="action">Action</option>
                <option value="section">Section</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              {...register("description")}
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Action Value</label>
            <Input
              {...register("action_value")}
              placeholder="Enter action value"
              className={errors.action_value ? "border-red-500" : ""}
            />
            {errors.action_value && (
              <p className="text-red-500 text-sm mt-1">{errors.action_value.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select
              {...register("section_id")}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <Input
                type="number"
                min="0"
                {...register("sort_order", { valueAsNumber: true })}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("is_premium")}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm font-medium">Premium</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("requires_auth")}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm font-medium">Requires Auth</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/gif,image/png,image/webp"
                  onChange={handleIconChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports GIF, PNG, WebP (including animated)
                </p>
              </div>
              {iconPreview && (
                <div className="relative">
                  <img
                    src={iconPreview}
                    alt="Icon preview"
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeIcon}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {item ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}