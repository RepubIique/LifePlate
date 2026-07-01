/** Canonical calendar day column on meals (user's log day). */
export const MEAL_LOG_DATE_SQL = `log_date`;
export const MEAL_LOG_DATE_COLUMN_SQL = `m.log_date`;
export const MEAL_LOG_DATE_KEY_SQL = `log_date::text`;
export const MEAL_LOG_DATE_KEY_COLUMN_SQL = `m.log_date::text`;

/** Only meals that count toward stats and streaks. */
export const LOGGED_MEALS_WHERE_SQL = `(m.status IS NULL OR m.status = 'logged')`;
