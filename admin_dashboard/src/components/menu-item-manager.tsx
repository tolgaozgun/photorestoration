import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus, Trash2, Edit } from "lucide-react"
import type { MenuItem, MenuSection } from "@/lib/schemas"
import { cn } from "@/lib/utils"

interface SortableItemProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2 cursor-move transition-all duration-200",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Type:</span> {item.action_type}
          </div>
          <div>
            <span className="font-medium">Value:</span> {item.action_value}
          </div>
          <div>
            <span className="font-medium">Premium:</span> {item.is_premium ? "Yes" : "No"}
          </div>
          <div>
            <span className="font-medium">Auth Required:</span> {item.requires_auth ? "Yes" : "No"}
          </div>
        </div>
        {item.description && (
          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        {item.icon && (
          <div className="mt-2">
            <img
              src={item.icon}
              alt={item.title}
              className="h-12 w-12 rounded-md object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MenuItemManagerProps {
  section: MenuSection
  items: MenuItem[]
  onItemsReorder: (items: MenuItem[]) => void
  onItemEdit: (item: MenuItem) => void
  onItemDelete: (id: string) => void
  onItemCreate: () => void
}

export function MenuItemManager({
  section,
  items,
  onItemsReorder,
  onItemEdit,
  onItemDelete,
  onItemCreate,
}: MenuItemManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over?.id)

      const reorderedItems = arrayMove(items, oldIndex, newIndex)
      onItemsReorder(reorderedItems)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <Button onClick={onItemCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No items in this section</p>
                  <Button onClick={onItemCreate} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              items.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={onItemEdit}
                  onDelete={onItemDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}