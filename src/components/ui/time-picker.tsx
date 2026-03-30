
'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from './scroll-area';

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const [hour, setHour] = React.useState<number>(date?.getHours() ?? new Date().getHours());
  const [minute, setMinute] = React.useState<number>(date?.getMinutes() ?? new Date().getMinutes());

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (date) {
      setHour(date.getHours());
      setMinute(date.getMinutes());
    }
  }, [date]);
  
  React.useEffect(() => {
    if (hour !== undefined && minute !== undefined) {
      const base = date ? new Date(date) : new Date();
      base.setHours(hour);
      base.setMinutes(minute);
      base.setSeconds(0);
      base.setMilliseconds(0);
      setDate(base);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute]);
  
  React.useEffect(() => {
    if (hourRef.current && hour) {
        const selectedHourElement = hourRef.current.querySelector(`[data-hour="${hour}"]`);
        if (selectedHourElement) {
            selectedHourElement.scrollIntoView({ block: 'center' });
        }
    }
    if (minuteRef.current && minute) {
        const selectedMinuteElement = minuteRef.current.querySelector(`[data-minute="${minute}"]`);
        if (selectedMinuteElement) {
            selectedMinuteElement.scrollIntoView({ block: 'center' });
        }
    }
  }, [hour, minute]);


  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? format(date, 'HH:mm') : <span>--:--</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex items-center">
            <ScrollArea className="h-48" ref={hourRef}>
                <div className="p-2">
                {hours.map((h) => (
                    <div
                    key={h}
                    data-hour={h}
                    onClick={() => setHour(h)}
                    className={cn(
                        'w-full text-center rounded-md p-2 cursor-pointer hover:bg-accent',
                        hour === h && 'bg-primary text-primary-foreground hover:bg-primary'
                    )}
                    >
                    {String(h).padStart(2, '0')}
                    </div>
                ))}
                </div>
            </ScrollArea>
             <ScrollArea className="h-48" ref={minuteRef}>
                <div className="p-2">
                {minutes.map((m) => (
                    <div
                    key={m}
                    data-minute={m}
                    onClick={() => setMinute(m)}
                    className={cn(
                        'w-full text-center rounded-md p-2 cursor-pointer hover:bg-accent',
                        minute === m && 'bg-primary text-primary-foreground hover:bg-primary'
                    )}
                    >
                    {String(m).padStart(2, '0')}
                    </div>
                ))}
                </div>
            </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
