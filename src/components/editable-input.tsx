
'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditableInputProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  canEdit?: boolean;
  type?: string;
}

export function EditableInput({
  label,
  value,
  onSave,
  placeholder,
  canEdit = true,
  type = 'text',
}: EditableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`editable-${label}`}>{label}</Label>
      {isEditing ? (
        <Input
          id={`editable-${label}`}
          type={type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={placeholder}
        />
      ) : (
        <div
          onClick={() => canEdit && setIsEditing(true)}
          className={`flex items-center h-10 w-full rounded-md border border-transparent bg-background px-3 py-2 text-sm ${canEdit ? 'cursor-pointer hover:border-input' : 'text-muted-foreground'}`}
        >
          {value || <span className="text-muted-foreground italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}
