
'use client';

import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface EditableTextareaProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  canEdit?: boolean;
  className?: string;
}

export function EditableTextarea({
  label,
  value,
  onSave,
  placeholder,
  canEdit = true,
  className
}: EditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  return (
    <div className={cn("grid gap-2 w-full", className)}>
      <Label htmlFor={`editable-${label}`}>{label}</Label>
      {isEditing ? (
        <Textarea
          id={`editable-${label}`}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          autoFocus
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <div
          onClick={() => canEdit && setIsEditing(true)}
          className={`flex w-full rounded-md border border-transparent bg-background px-3 py-2 text-sm min-h-[80px] whitespace-pre-wrap ${canEdit ? 'cursor-pointer hover:border-input' : 'text-muted-foreground'}`}
        >
          {value || <span className="text-muted-foreground italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}
