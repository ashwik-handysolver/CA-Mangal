-- Cumulative report: one row per financial year and month of service.
--
-- The report query as supplied, wrapped in a view. Two extra columns are added
-- for the app (fy_start, year_month: sorting and month labels); the final
-- ORDER BY is left out because the app orders the rows itself.
-- Entries outside every financial year (or without a date of service) are
-- included, in a group whose label is null.
--
-- security_invoker: the view runs with the caller's rights, so the tables' RLS applies.

drop view if exists public.mii_report_cumulative;

create view public.mii_report_cumulative
with (security_invoker = true) as
WITH
-- ── 1. Base: join once, derive all derived columns here ──────────────────────
base AS (
    SELECT
        mss.id,
        mss.fees,
        mss.created_at,
        mss.date_of_service,
        mf.label                                                    AS fy_label,
        mf.start_date                                               AS fy_start,
        mf.end_date                                                 AS fy_end,
        TO_CHAR(mss.date_of_service, 'YYYY')                       AS year,
        TO_CHAR(mss.date_of_service, 'FMMonth')                    AS month,
        TO_CHAR(mss.date_of_service, 'YYYY-MM')                    AS year_month,
        TO_CHAR(mss.date_of_service - INTERVAL '1 year', 'YYYY-MM') AS prev_year_month,
        EXTRACT(MONTH  FROM mss.date_of_service)::int               AS month_num,
        EXTRACT(QUARTER FROM mss.date_of_service)::int              AS quarter_num
    FROM public.mii_service_status mss
    LEFT JOIN public.mii_financial_years mf
        ON mss.date_of_service BETWEEN mf.start_date AND mf.end_date
),

-- ── 2. Monthly aggregates (one row per FY + month) ───────────────────────────
monthly AS (
    SELECT
        fy_label,
        fy_start,
        fy_end,
        year_month,
        prev_year_month,
        year,
        month,
        month_num,
        quarter_num,
        MIN(id)         AS id,
        MIN(created_at) AS created_at,
        COUNT(*)        AS monthly_fees_count,
        SUM(fees)       AS monthly_fees_total
    FROM base
    GROUP BY
        fy_label, fy_start, fy_end,
        year_month, prev_year_month,
        year, month, month_num, quarter_num
),

-- ── 3. Previous-year monthly totals (looked up by year_month key) ────────────
prev_year AS (
    SELECT
        TO_CHAR(date_of_service, 'YYYY-MM') AS year_month,
        SUM(fees)                            AS fees_total
    FROM public.mii_service_status
    GROUP BY TO_CHAR(date_of_service, 'YYYY-MM')
),

-- ── 4. Quarterly counts per FY (looked up by fy_label + quarter) ─────────────
quarterly AS (
    SELECT
        fy_label,
        quarter_num,
        COUNT(*) AS qcount
    FROM base
    GROUP BY fy_label, quarter_num
),

-- ── 5. Yearly totals per FY ───────────────────────────────────────────────────
yearly AS (
    SELECT
        fy_label,
        COUNT(*) AS yearly_count,
        SUM(fees) AS yearly_fees_total
    FROM base
    GROUP BY fy_label
)

SELECT
    m.id,
    m.fy_label                                                      AS label,
    m.created_at,
    m.year,
    m.month,

    -- Cumulative monthly count within financial year
    SUM(m.monthly_fees_count) OVER (
        PARTITION BY m.fy_label
        ORDER BY m.year_month
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                                               AS cumulative_monthly_count,

    m.monthly_fees_count,

    ROUND(m.monthly_fees_total::NUMERIC, 2)                        AS monthly_fees_total,

    COALESCE(py.fees_total, 0)                                     AS prev_year_monthly_fees_total,

    -- Cumulative fees within financial year
    ROUND(
        SUM(m.monthly_fees_total) OVER (
            PARTITION BY m.fy_label
            ORDER BY m.year_month
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )::NUMERIC,
        2
    )                                                               AS cumulative_monthly_fees_total,

    -- YoY net profit percentage
    CASE
        WHEN COALESCE(py.fees_total, 0) = 0
            THEN 100
        ELSE ROUND(
            ((m.monthly_fees_total - COALESCE(py.fees_total, 0))
             / COALESCE(py.fees_total, 0)) * 100,
            2
        )
    END                                                             AS net_profit_percentage,

    y.yearly_count                                                  AS cumulative_yearly_count,

    -- Quarterly count only for quarter-end months (Mar=3, Jun=6, Sep=9, Dec=12)
    CASE
        WHEN m.month_num IN (3, 6, 9, 12) THEN q.qcount
        ELSE NULL
    END                                                             AS quarterly_count,

    ROUND(y.yearly_fees_total::NUMERIC, 2)                        AS yearly_fees_total,

    -- Added for the app: ordering and month labels
    m.fy_start,
    m.year_month

FROM monthly m
LEFT JOIN prev_year  py ON py.year_month = m.prev_year_month
LEFT JOIN quarterly   q ON q.fy_label    = m.fy_label
                       AND q.quarter_num = m.quarter_num
LEFT JOIN yearly      y ON y.fy_label    = m.fy_label;

revoke all on public.mii_report_cumulative from anon;
grant select on public.mii_report_cumulative to authenticated;

-- Make the API see the new view straight away
notify pgrst, 'reload schema';
