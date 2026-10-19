import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { userForm } from "@/lib/db/schema";

/** Construit le filtre des formulaires ouverts avec des paramètres typés Drizzle. */
export function buildActiveFormsFilter(now: Date) {
  return and(
    eq(userForm.isActive, true),
    lte(userForm.startDate, now),
    or(isNull(userForm.endDate), gte(userForm.endDate, now))
  );
}
