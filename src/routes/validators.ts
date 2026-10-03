import { z } from 'zod';

export const cityQuerySchema = z.object({
  city: z.string().trim().min(1, 'city query param is required'),
});

export const hotelsQuerySchema = z
  .object({
    city: z.string().trim().min(1, 'city query param is required'),
    minPrice: z.coerce.number().nonnegative('minPrice must be a non-negative number').optional(),
    maxPrice: z.coerce.number().nonnegative('maxPrice must be a non-negative number').optional(),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['minPrice'],
    }
  );

export type CityQuery = z.infer<typeof cityQuerySchema>;
export type HotelsQuery = z.infer<typeof hotelsQuerySchema>;
