import { z } from 'zod';

export const timeframeSchema = z.enum(['Today', 'T7', 'T30', 'T90', 'T365', 'Ytd']);
export type Timeframe = z.infer<typeof timeframeSchema>;

export const financialSearchSchema = z.object({
  timeframe: timeframeSchema.optional(),
  tenantId: z.string().optional(),
});

export const fleetSearchSchema = z.object({
  timeframe: timeframeSchema.optional(),
  tenantId: z.string().uuid().optional(),
  monitorId: z.coerce.number().int().optional(),
});
