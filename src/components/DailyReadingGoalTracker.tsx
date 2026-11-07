import React, { useMemo } from "react";
import * as d3 from "d3";

export interface DailyReadingGoalProps {
  foliosReadToday: string[];
  dailyGoalTarget: number;
  onChangeGoalTarget: (nextTarget: number) => void;
  onLogBonusFolio: () => void;
  onResetToday: () => void;
}

export const DailyReadingGoalTracker: React.FC<DailyReadingGoalProps> = ({
  foliosReadToday,
  dailyGoalTarget,
  onChangeGoalTarget,
  onLogBonusFolio,
  onResetToday,
}) => {
  const safeTarget = Math.max(1, Math.min(12, dailyGoalTarget || 3));
  const completedCount = foliosReadToday.length;
  const progressRatio = Math.max(0, Math.min(1, completedCount / safeTarget));
  const percentage = Math.round(progressRatio * 100);

  // D3 Arc Generator geometry (-128 deg to +128 deg horseshoe arc gauge)
  const { backgroundArcPath, foregroundArcPath, segmentArcs } = useMemo(() => {
    const startAngle = (-128 * Math.PI) / 180;
    const endAngle = (128 * Math.PI) / 180;
    const totalSpan = endAngle - startAngle;

    const bgArcGen = d3
      .arc<unknown>()
      .innerRadius(28)
      .outerRadius(36)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(2);

    const activeEndAngle = startAngle + totalSpan * progressRatio;
    const fgArcGen = d3
      .arc<unknown>()
      .innerRadius(28)
      .outerRadius(36)
      .startAngle(startAngle)
      .endAngle(activeEndAngle)
      .cornerRadius(2);

    // Individual folio step ticks along the outer ring using d3.arc
    const padAngle = 0.045;
    const stepSpan = (totalSpan - padAngle * (safeTarget - 1)) / safeTarget;
    const segGen = d3.arc<{ start: number; end: number }>()
      .innerRadius(39)
      .outerRadius(42);

    const segments = Array.from({ length: safeTarget }, (_, idx) => {
      const s = startAngle + idx * (stepSpan + padAngle);
      const e = s + stepSpan;
      return {
        idx,
        isFilled: idx < completedCount,
        d: segGen({ start: s, end: e }, { startAngle: () => s, endAngle: () => e } as any) ||
          d3
            .arc()
            .innerRadius(39)
            .outerRadius(42)
            .startAngle(s)
            .endAngle(e)({} as any) ||
          "",
      };
    });

    return {
      backgroundArcPath: bgArcGen({}) || "",
      foregroundArcPath: fgArcGen({}) || "",
      segmentArcs: segments,
    };
  }, [safeTarget, completedCount, progressRatio]);

  return (
    <div
      role="region"
      aria-label="Daily Reading Goal Tracker"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        padding: "8px 12px",
        marginTop: "8px",
        backgroundColor: "var(--folio-card)",
        border: "1px solid var(--folio-rule)",
      }}
    >
      {/* Left: D3-Rendered Radial Arc Chart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "84px",
            height: "74px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="84"
            height="74"
            viewBox="-46 -46 92 84"
            aria-label={`Daily reading goal progress: ${completedCount} of ${safeTarget} folios read (${percentage}%)`}
          >
            {/* Background Track Arc */}
            <path
              d={backgroundArcPath}
              fill="var(--folio-paper)"
              stroke="var(--folio-rule)"
              strokeWidth="0.8"
            />

            {/* Foreground Progress Arc */}
            {progressRatio > 0 && (
              <path
                d={foregroundArcPath}
                fill="var(--folio-accent)"
                style={{ transition: "d 240ms ease" }}
              />
            )}

            {/* Segmented Folio Goal Ticks */}
            {segmentArcs.map((seg) => (
              <path
                key={seg.idx}
                d={seg.d}
                fill={seg.isFilled ? "var(--folio-ink)" : "var(--folio-rule)"}
                opacity={seg.isFilled ? 0.88 : 0.55}
              />
            ))}

            {/* Center Readout */}
            <text
              x="0"
              y="-2"
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "19px",
                fontWeight: 600,
                fill: "var(--folio-ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {completedCount}/{safeTarget}
            </text>
            <text
              x="0"
              y="13"
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "7.5px",
                letterSpacing: "0.1em",
                fill: "var(--folio-muted)",
              }}
            >
              FOLIOS
            </text>
          </svg>
        </div>

        {/* Center Text Description */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "10.5px",
              letterSpacing: "0.12em",
              color: "var(--folio-accent)",
              textTransform: "uppercase",
            }}
          >
            DAILY READING GOAL &nbsp;·&nbsp; {percentage}% COMPLETE
          </div>
          <div
            style={{
              fontFamily: "var(--font-garamond)",
              fontSize: "16px",
              color: "var(--folio-ink)",
              lineHeight: 1.28,
              marginTop: "2px",
            }}
          >
            {completedCount >= safeTarget
              ? `Goal achieved! You have read ${completedCount} ${
                  completedCount === 1 ? "folio" : "folios"
                } today.`
              : `${safeTarget - completedCount} more ${
                  safeTarget - completedCount === 1 ? "folio" : "folios"
                } to complete today’s reading goal.`}
          </div>
          <div
            style={{
              fontFamily: "var(--font-garamond)",
              fontStyle: "italic",
              fontSize: "13.5px",
              color: "var(--folio-muted)",
              marginTop: "1px",
            }}
          >
            Automatically records each folio opened in the Reader
          </div>
        </div>
      </div>

      {/* Right: Goal Target Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            color: "var(--folio-muted)",
          }}
        >
          GOAL:
        </span>
        <button
          type="button"
          onClick={() => onChangeGoalTarget(Math.max(1, safeTarget - 1))}
          disabled={safeTarget <= 1}
          title="Decrease daily folio goal"
          className="austen-margin-link"
          style={{ padding: "2px 7px", fontSize: "11px" }}
        >
          &minus;
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11.5px",
            color: "var(--folio-ink)",
            minWidth: "24px",
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {safeTarget}
        </span>
        <button
          type="button"
          onClick={() => onChangeGoalTarget(Math.min(12, safeTarget + 1))}
          disabled={safeTarget >= 12}
          title="Increase daily folio goal"
          className="austen-margin-link"
          style={{ padding: "2px 7px", fontSize: "11px" }}
        >
          +
        </button>

        <button
          type="button"
          onClick={onLogBonusFolio}
          title="Mark a folio as read toward today's goal"
          className="austen-margin-link"
          style={{ padding: "2px 8px", fontSize: "10.5px" }}
        >
          +1 Folio
        </button>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={onResetToday}
            title="Reset today's folio count"
            className="austen-margin-link"
            style={{ padding: "2px 7px", fontSize: "10.5px" }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
