import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  parseTimeToMinutes,
  parseDuration,
  minutesToTime,
  isTimeSlotAvailable,
  type TimeBlock,
} from "@/utils/timeCalculations";

interface BookingTimelineProps {
  selectedDuration: string;
  selectedTime: string;
  bookedBlocks: TimeBlock[];
  onTimeSelect: (time: string) => void;
}

export const BookingTimeline = ({
  selectedDuration,
  selectedTime,
  bookedBlocks,
  onTimeSelect,
}: BookingTimelineProps) => {
  const durationMinutes = selectedDuration ? parseDuration(selectedDuration) : 60;
  
  // Generate time slots (every 30 minutes from 9 AM to 7 PM)
  const timeSlots = useMemo(() => {
    const slots: { time: string; minutes: number; available: boolean }[] = [];
    
    // 9 AM to 7 PM = 600 minutes total
    for (let minutes = 0; minutes <= 600 - durationMinutes; minutes += 30) {
      const time = minutesToTime(minutes);
      const available = isTimeSlotAvailable(minutes, durationMinutes, bookedBlocks);
      
      slots.push({ time, minutes, available });
    }
    
    return slots;
  }, [durationMinutes, bookedBlocks]);

  // Calculate timeline grid (15-minute cells for visualization)
  const timelineCells = useMemo(() => {
    const cells: { minutes: number; isBooked: boolean; bookingLabel?: string }[] = [];
    
    for (let minutes = 0; minutes < 600; minutes += 15) {
      let isBooked = false;
      let bookingLabel: string | undefined;
      
      // Check if this cell is part of a booked block
      for (const block of bookedBlocks) {
        if (minutes >= block.start && minutes < block.end) {
          isBooked = true;
          bookingLabel = block.label;
          break;
        }
      }
      
      cells.push({ minutes, isBooked, bookingLabel });
    }
    
    return cells;
  }, [bookedBlocks]);

  // Group timeline cells by hour for display
  const hourGroups = useMemo(() => {
    const groups: { hour: string; cells: typeof timelineCells }[] = [];
    
    for (let hour = 9; hour < 19; hour++) {
      const hourMinutes = (hour - 9) * 60;
      const hourCells = timelineCells.filter(
        cell => cell.minutes >= hourMinutes && cell.minutes < hourMinutes + 60
      );
      
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const period = isPM ? 'م' : 'ص';
      
      groups.push({
        hour: `${displayHour} ${period}`,
        cells: hourCells,
      });
    }
    
    return groups;
  }, [timelineCells]);

  const selectedMinutes = selectedTime ? parseTimeToMinutes(selectedTime) : -1;
  const selectedEndMinutes = selectedMinutes >= 0 ? selectedMinutes + durationMinutes : -1;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border border-primary rounded" />
          <span className="text-muted-foreground">محجوز</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success/20 border border-success rounded" />
          <span className="text-muted-foreground">متاح</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted border border-border rounded" />
          <span className="text-muted-foreground">غير متاح (مدة قصيرة)</span>
        </div>
        {selectedTime && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/30 border-2 border-blue-500 rounded" />
            <span className="text-muted-foreground">اختيارك</span>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="space-y-2">
          {hourGroups.map((group) => (
            <div key={group.hour} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                {group.hour}
              </span>
              <div className="flex-1 flex gap-0.5">
                {group.cells.map((cell, idx) => {
                  const isInSelection = 
                    selectedMinutes >= 0 &&
                    cell.minutes >= selectedMinutes &&
                    cell.minutes < selectedEndMinutes;
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "h-8 flex-1 rounded-sm border transition-all",
                        cell.isBooked
                          ? "bg-primary/20 border-primary"
                          : isInSelection
                          ? "bg-blue-500/30 border-blue-500 border-2"
                          : "bg-background border-border"
                      )}
                      title={cell.bookingLabel || minutesToTime(cell.minutes)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">اختر الوقت</Label>
          <Badge variant="outline">
            المدة: {selectedDuration}
          </Badge>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {timeSlots.map((slot) => {
            const isSelected = slot.time === selectedTime;
            
            return (
              <Button
                key={slot.time}
                type="button"
                variant={isSelected ? "default" : slot.available ? "outline" : "ghost"}
                className={cn(
                  "h-auto py-2 text-sm",
                  !slot.available && "opacity-40 cursor-not-allowed",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => slot.available && onTimeSelect(slot.time)}
                disabled={!slot.available}
              >
                {slot.time}
              </Button>
            );
          })}
        </div>
        {timeSlots.filter(s => s.available).length === 0 && (
          <p className="text-sm text-destructive mt-2">
            لا توجد مواعيد متاحة لهذه المدة في هذا اليوم
          </p>
        )}
      </div>

      {/* Selection Summary */}
      {selectedTime && (
        <div className="bg-muted/50 rounded-lg p-3 border">
          <p className="text-sm font-medium mb-1">الحجز المحدد:</p>
          <p className="text-sm text-muted-foreground">
            من {selectedTime} إلى {minutesToTime(selectedMinutes + durationMinutes)} ({selectedDuration})
          </p>
        </div>
      )}
    </div>
  );
};
