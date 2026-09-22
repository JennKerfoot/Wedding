import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type RequestHandler } from "express";
import { desc } from "drizzle-orm";
import { db, rsvpsTable } from "@workspace/db";
import {
  CreateRsvpAdminSessionBody,
  CreateRsvpBody,
  CreateRsvpResponse,
  ListRsvpsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const COOKIE_NAME = "wedding_rsvp_admin";

function matchesSecret(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.signedCookies?.[COOKIE_NAME] !== "authorized") {
    res.status(401).json({ error: "Private couple access required" });
    return;
  }
  next();
};

router.post("/rsvps", async (req, res): Promise<void> => {
  const parsed = CreateRsvpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted RSVP details." });
    return;
  }

  const data = parsed.data;
  if (
    (data.attendance === "attending" && data.partySize < 1) ||
    (data.attendance === "declining" && data.partySize !== 0)
  ) {
    res.status(400).json({
      error:
        data.attendance === "attending"
          ? "Party size must be at least one when attending."
          : "Party size must be zero when declining.",
    });
    return;
  }

  const [created] = await db
    .insert(rsvpsTable)
    .values({
      ...data,
      names: data.names.trim(),
      email: data.email.trim().toLowerCase(),
      dietaryNotes: data.dietaryNotes?.trim() ?? "",
      songRequest: data.songRequest?.trim() ?? "",
      message: data.message?.trim() ?? "",
    })
    .returning();

  res.status(201).json(CreateRsvpResponse.parse(created));
});

router.post("/rsvps/admin/session", (req, res): void => {
  const parsed = CreateRsvpAdminSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter the private passphrase." });
    return;
  }

  const expected = process.env.RSVP_ADMIN_PASSPHRASE;
  if (!expected) {
    req.log.error("RSVP_ADMIN_PASSPHRASE is not configured");
    res.status(503).json({ error: "Private responses are not configured yet." });
    return;
  }

  if (!matchesSecret(parsed.data.passphrase, expected)) {
    res.status(401).json({ error: "That passphrase is not correct." });
    return;
  }

  res.cookie(COOKIE_NAME, "authorized", {
    signed: true,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8,
  });
  res.sendStatus(204);
});

router.delete("/rsvps/admin/session", (_req, res): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.sendStatus(204);
});

router.get("/rsvps/admin", requireAdmin, async (_req, res): Promise<void> => {
  const responses = await db
    .select()
    .from(rsvpsTable)
    .orderBy(desc(rsvpsTable.submittedAt));

  const attending = responses.filter(
    (response) => response.attendance === "attending",
  );
  const payload = {
    totals: {
      responses: responses.length,
      attendingParties: attending.length,
      attendingGuests: attending.reduce(
        (total, response) => total + response.partySize,
        0,
      ),
      decliningParties: responses.length - attending.length,
    },
    responses,
  };

  res.json(ListRsvpsResponse.parse(payload));
});

function csvCell(value: string | number | Date): string {
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

router.get(
  "/rsvps/admin/export",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const responses = await db
      .select()
      .from(rsvpsTable)
      .orderBy(desc(rsvpsTable.submittedAt));
    const header = [
      "Names",
      "Email",
      "Attendance",
      "Party size",
      "Dietary notes",
      "Song request",
      "Message",
      "Submitted at",
    ];
    const rows = responses.map((response) =>
      [
        response.names,
        response.email,
        response.attendance,
        response.partySize,
        response.dietaryNotes,
        response.songRequest,
        response.message,
        response.submittedAt,
      ]
        .map(csvCell)
        .join(","),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="jenn-and-anna-rsvps.csv"',
    );
    res.send([header.map(csvCell).join(","), ...rows].join("\r\n"));
  },
);

export default router;