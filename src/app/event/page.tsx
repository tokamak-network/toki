"use client";

import EventFlow from "@/components/event/EventFlow";

/**
 * Full-screen kiosk page for offline bar events.
 * No Header/Footer — standalone experience.
 */
export default function EventPage() {
  return (
    <main className="min-h-screen bg-background">
      <EventFlow />
    </main>
  );
}
