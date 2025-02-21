import { z } from "zod";
import { addDays } from "date-fns";
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Database schema
export const voiceNotes = pgTable('voice_notes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  audioData: text('audio_data').notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  confirmed: boolean('confirmed').default(false).notNull(),
  sent: boolean('sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schema for request validation
export const voiceNoteSchema = z.object({
  email: z.string().email("Invalid email format"),
  audioData: z.string().min(1, "Audio data is required"),
  deliveryDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate > addDays(new Date(), 1);
    },
    "Delivery date must be at least one day in the future"
  ),
});

// Types
export const insertVoiceNoteSchema = createInsertSchema(voiceNotes).omit({ 
  id: true,
  confirmed: true,
  sent: true,
  createdAt: true,
});

export type VoiceNote = typeof voiceNotes.$inferSelect;
export type InsertVoiceNote = z.infer<typeof insertVoiceNoteSchema>;