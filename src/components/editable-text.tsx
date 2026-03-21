
'use client';

import { useState, useEffect, useRef, FocusEvent } from 'react';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  children: React.ReactNode;
  storageKey: string;
}

export function EditableText({ children, storageKey }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(children?.toString() || '');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('userRole') as UserRole | null;
    setUserRole(role);

    if (role === 'admin') {
      const savedText = localStorage.getItem(storageKey);
      if (savedText) {
        setText(savedText);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (isEditing && spanRef.current) {
      spanRef.current.focus();
    }
  }, [isEditing]);
  
  const handleTripleClick = () => {
    if (userRole !== 'admin') return;

    clickCount.current += 1;

    if (clickCount.current === 1) {
      clickTimeout.current = setTimeout(() => {
        clickCount.current = 0;
      }, 500); // 500ms window for triple click
    } else if (clickCount.current === 3) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
      clickCount.current = 0;
      setIsEditing(true);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.innerText;
    setText(newText);
    localStorage.setItem(storageKey, newText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }

  if (!isMounted) {
    return <>{children}</>;
  }

  if (userRole === 'admin') {
    return (
      <span
        ref={spanRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onClick={handleTripleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
            isEditing && 'outline-none ring-2 ring-primary ring-offset-2 rounded-sm p-1 bg-background text-foreground'
        )}
        dangerouslySetInnerHTML={{ __html: text.toString() }}
      />
    );
  }

  return <>{text}</>;
}

    