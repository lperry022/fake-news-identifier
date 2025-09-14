// backend/middleware/validate.js
import { z } from "zod";

export const analyzeSchema = z.object({
  input: z.string().min(1, "Input is required")
});

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join("; ");
      return res.status(400).json({ error: msg });
    }
    req.body = parsed.data;
    next();
  };
}
