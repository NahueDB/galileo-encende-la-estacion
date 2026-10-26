import { z } from 'zod';
export const codeSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const sessionSchema = z
  .object({ activity: codeSchema, pair: z.tuple([codeSchema, codeSchema]) })
  .refine((v) => v.pair[0] !== v.pair[1], { message: 'Los códigos deben ser distintos.' });
export const eventSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  level: z.number().int().min(1).max(6),
  version: z.literal('1.0.0'),
  type: z.enum(['start', 'enter', 'run', 'hint', 'complete', 'finish']),
  at: z.iso.datetime(),
  attempt: z.number().int().min(0).max(10000),
  hint: z.number().int().min(1).max(3).optional(),
  code: z.string().max(12000).optional(),
  result: z
    .object({
      pass: z.boolean(),
      checks: z
        .array(
          z.object({
            label: z.string().max(200),
            pass: z.boolean(),
            detail: z.string().max(1000).optional(),
          }),
        )
        .max(30),
      error: z.string().max(1000).optional(),
    })
    .optional(),
});
export const eventsSchema = z.object({ events: z.array(eventSchema).min(1).max(20) });
export async function readBody(request: Request, limit = 100000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Solicitud vacía.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error('Solicitud demasiado grande.');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
