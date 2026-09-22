import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rsvpsTable = pgTable("wedding_rsvps", {
  id: serial("id").primaryKey(),
  names: text("names").notNull(),
  email: text("email").notNull(),
  attendance: text("attendance").notNull(),
  partySize: integer("party_size").notNull(),
  dietaryNotes: text("dietary_notes").notNull().default(""),
  songRequest: text("song_request").notNull().default(""),
  message: text("message").notNull().default(""),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertRsvpSchema = createInsertSchema(rsvpsTable).omit({
  id: true,
  submittedAt: true,
});

export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Rsvp = typeof rsvpsTable.$inferSelect;