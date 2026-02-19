import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Create New Event
        </h1>
        <p className="text-gray-600 mt-1">
          Fill in the details below to create a new event
        </p>
      </div>

      <EventForm />
    </div>
  );
}
