/** UTC calendar date — immutable; safe for indexes and WHERE comparisons. */
export const MEAL_UTC_DAY_DATE_SQL = `(created_at AT TIME ZONE 'UTC')::date`;

export const MEAL_UTC_DAY_DATE_COLUMN_SQL = `(m.created_at AT TIME ZONE 'UTC')::date`;

export const UTC_TODAY_DATE_SQL = `(NOW() AT TIME ZONE 'UTC')::date`;

/** Text YYYY-MM-DD for streak keys, GROUP BY labels, and API responses. */
export const MEAL_UTC_DAY_SQL = `${MEAL_UTC_DAY_DATE_SQL}::text`;

export const MEAL_UTC_DAY_COLUMN_SQL = `${MEAL_UTC_DAY_DATE_COLUMN_SQL}::text`;

export const UTC_TODAY_SQL = `${UTC_TODAY_DATE_SQL}::text`;
