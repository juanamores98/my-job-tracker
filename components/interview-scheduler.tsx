"use client"

import type React from "react"

import { useState } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface InterviewSchedulerProps {
  onSchedule: (date: string) => void
  onClose: () => void
}

export function InterviewScheduler({ onSchedule, onClose }: InterviewSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 3))
  const [time, setTime] = useState("10:00")
  const [interviewType, setInterviewType] = useState("phone")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    const formattedDate = format(date, "PPP")
    const interviewDetails = `${formattedDate} at ${time} - ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview${notes ? `: ${notes}` : ""}`

    onSchedule(interviewDetails)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>Set up an interview date and time for this job application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Interview Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border mx-auto"
              disabled={(date) => date < new Date()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="09:30">9:30 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="10:30">10:30 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="11:30">11:30 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="13:30">1:30 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="14:30">2:30 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="15:30">3:30 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="16:30">4:30 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Interview Type</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any details about the interview"
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {date ? format(date, "PPP") : "Select a date"} at {time} -{" "}
                {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!date}>
              Schedule Interview
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
