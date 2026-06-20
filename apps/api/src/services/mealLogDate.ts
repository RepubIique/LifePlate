/** Canonical calendar day column on meals (user's log day). */
export const MEAL_LOG_DATE_SQL = `log_date`;
export const MEAL_LOG_DATE_COLUMN_SQL = `m.log_date`;
export const MEAL_LOG_DATE_KEY_SQL = `log_date::text`;
export const MEAL_LOG_DATE_KEY_COLUMN_SQL = `m.log_date::text`;

/** @deprecated Use MEAL_LOG_DATE_* — kept for transitional imports. */
export const MEAL_UTC_DAY_DATE_SQL = MEAL_LOG_DATE_SQL;
export const MEAL_UTC_DAY_DATE_COLUMN_SQL = MEAL_LOG_DATE_COLUMN_SQL;
export const MEAL_UTC_DAY_SQL = MEAL_LOG_DATE_KEY_SQL;
export const MEAL_UTC_DAY_COLUMN_SQL = MEAL_LOG_DATE_KEY_COLUMN_SQL;

export const UTC_TODAY_DATE_SQL = `(NOW() AT TIME ZONE 'UTC')::date`;
export const UTC_TODAY_SQL = `${UTC_TODAY_DATE_SQL}::text`;
