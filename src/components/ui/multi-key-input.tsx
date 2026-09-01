import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { validateApiKey } from '@/app/actions/api-validation';

interface MultiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  provider?: string;
}

export function MultiKeyInput({ value, onChange, placeholder, provider }: MultiKeyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [keyStatuses, setKeyStatuses] = useState<Record<string, { isValid: boolean; isTesting: boolean }>>({});

  // Split values by newline or comma
  const keys = value.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);

  // Validate a single key
  const testKey = async (key: string) => {
    if (!provider) return;
    
    // Set to testing state
    setKeyStatuses((prev) => ({
      ...prev,
      [key]: { isValid: true, isTesting: true }
    }));

    const isValid = await validateApiKey(provider, key);
    
    setKeyStatuses((prev) => ({
      ...prev,
      [key]: { isValid, isTesting: false }
    }));
  };

  // Test all untagged keys on load or when keys change
  useEffect(() => {
    if (!provider) return;
    keys.forEach((key) => {
      if (keyStatuses[key] === undefined) {
        testKey(key);
      }
    });
  }, [keys, provider, keyStatuses]);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newKey = inputValue.trim();
    const newKeys = [...keys, newKey];
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
          {keys.map((key, index) => {
            const status = keyStatuses[key];
            const isTesting = status?.isTesting;
            const isInvalid = status?.isValid === false;
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between rounded-lg px-3 py-0.5 text-sm shrink-0 transition-colors ${
                  isInvalid 
                    ? 'bg-red-50 border border-red-200 text-red-600' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center truncate mr-2">
                  <span className={`truncate font-mono text-[9px] ${isInvalid ? 'text-red-600' : 'text-slate-700'}`}>
                    {key}
                  </span>
                  {isTesting && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin text-slate-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className={`shrink-0 transition-colors ${isInvalid ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
