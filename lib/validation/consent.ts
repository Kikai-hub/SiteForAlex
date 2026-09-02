import { z } from "zod";

/** Required wherever a form collects personal data (name, phone, address) —
 *  registration and checkout — per 152-ФЗ. */
export const personalDataConsentSchema = z
  .boolean()
  .refine((v) => v === true, { message: "Нужно согласие на обработку персональных данных" });
