import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface MultiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MultiKeyInput({ value, onChange, placeholder }: MultiKeyInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Split values by newline or comma
  const keys = value.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newKeys = [...keys, inputValue.trim()];
    onChange(newKeys.join('\n'));
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const newKeys = keys.filter((_, index) => index !== indexToRemove);
    onChange(newKeys.join('\n'));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow placeholder:text-slate-400"
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          className="h-11 w-11 shrink-0 rounded-xl border-slate-200 hover:bg-brand-yellow hover:text-slate-900"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {keys.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[85px] overflow-y-auto pr-1">
          {keys.map((key, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 shrink-0"
            >
              <span className="truncate mr-2 font-mono text-[9px]">{key}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
