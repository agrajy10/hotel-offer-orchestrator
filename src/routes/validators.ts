import { z } from 'zod';

export const cityQuerySchema = z.object({
  city: z.string().trim().min(1, 'city query param is required'),
});

export type CityQuery = z.infer<typeof cityQuerySchema>;
