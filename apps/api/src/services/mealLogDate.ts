/** UTC calendar date for a meal timestamp — matches shared `dateKeyFromIso`. */
export const MEAL_UTC_DAY_SQL = `to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

export const MEAL_UTC_DAY_COLUMN_SQL = `to_char(m.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

export const UTC_TODAY_SQL = `to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
