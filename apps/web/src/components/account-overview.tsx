import type { ChangeEvent } from "react";
import { useId, useMemo, useState } from "react";

import { positions } from "../data/mock";
import { cn, formatDecimal } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

type AnalyticsFormState = {
  equity: string;
  marginUsed: string;
  unrealized: string;
  funding: string;
  notional: string;
};

type OutlookFormState = {
  currentRate: string;
  nextImpact: string;
  basis: string;
};

const DEFAULT_ANALYTICS = (() => {
  const equity = 125_000;
  const marginUsed = 42_000;
  const funding = positions.reduce((acc, item) => acc + item.funding, 0);
  const unrealized = positions.reduce((acc, item) => acc + item.pnl, 0);
  const notional = positions.reduce((acc, position) => {
    const directional = position.side?.toLowerCase() === "long" ? 1 : -1;
    const value = position.size * position.markPrice;
    return acc + directional * value;
  }, 0);

  return {
    equity,
    marginUsed,
    funding,
    unrealized,
    notional
  };
})();

const DEFAULT_OUTLOOK = {
  currentRate: 0.015,
  nextImpact: 12.84,
  basis: -0.12
};

function parseNumeric(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function AccountOverview() {
  const baseId = useId();
  const [priceDelta, setPriceDelta] = useState(1.5);
  const [analyticsForm, setAnalyticsForm] = useState<AnalyticsFormState>(() => ({
    equity: DEFAULT_ANALYTICS.equity.toString(),
    marginUsed: DEFAULT_ANALYTICS.marginUsed.toString(),
    unrealized: DEFAULT_ANALYTICS.unrealized.toFixed(2),
    funding: DEFAULT_ANALYTICS.funding.toFixed(2),
    notional: DEFAULT_ANALYTICS.notional.toFixed(2)
  }));
  const [outlookForm, setOutlookForm] = useState<OutlookFormState>(() => ({
    currentRate: DEFAULT_OUTLOOK.currentRate.toString(),
    nextImpact: DEFAULT_OUTLOOK.nextImpact.toFixed(2),
    basis: DEFAULT_OUTLOOK.basis.toString()
  }));

  const analyticsValues = useMemo(
    () => ({
      equity: parseNumeric(analyticsForm.equity),
      marginUsed: parseNumeric(analyticsForm.marginUsed),
      unrealized: parseNumeric(analyticsForm.unrealized),
      funding: parseNumeric(analyticsForm.funding),
      notional: parseNumeric(analyticsForm.notional)
    }),
    [analyticsForm]
  );

  const outlookValues = useMemo(
    () => ({
      currentRate: parseNumeric(outlookForm.currentRate),
      nextImpact: parseNumeric(outlookForm.nextImpact),
      basis: parseNumeric(outlookForm.basis)
    }),
    [outlookForm]
  );

  const projectedPnl = analyticsValues.notional * (priceDelta / 100);

  const equityDisplay = `$${formatDecimal(analyticsValues.equity, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
  const marginDisplay = `$${formatDecimal(analyticsValues.marginUsed, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
  const unrealizedDisplay = `$${formatDecimal(analyticsValues.unrealized, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  const fundingDisplay = `$${formatDecimal(analyticsValues.funding, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  const projectedPnlDisplay = formatDecimal(projectedPnl, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const priceDeltaDisplay = formatDecimal(priceDelta, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const fundingRateDisplay = `${outlookValues.currentRate >= 0 ? "+" : "-"}${formatDecimal(
    Math.abs(outlookValues.currentRate),
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }
  )}%`;
  const nextImpactDisplay = `${outlookValues.nextImpact >= 0 ? "+" : "-"}$${formatDecimal(
    Math.abs(outlookValues.nextImpact),
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )} ${outlookValues.nextImpact >= 0 ? "credit" : "debit"}`;
  const basisDisplay = `${outlookValues.basis >= 0 ? "+" : "-"}${formatDecimal(
    Math.abs(outlookValues.basis),
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}%`;

  const equityRaw = parseNumeric(analyticsForm.equity);
  const marginRaw = parseNumeric(analyticsForm.marginUsed);
  const unrealizedRaw = parseNumeric(analyticsForm.unrealized);
  const fundingRaw = parseNumeric(analyticsForm.funding);
  const exposureRaw = parseNumeric(analyticsForm.notional);
  const fundingRateRaw = parseNumeric(outlookForm.currentRate);
  const nextImpactRaw = parseNumeric(outlookForm.nextImpact);
  const basisRaw = parseNumeric(outlookForm.basis);

  const equityHint = analyticsForm.equity.trim()
    ? `$${formatDecimal(equityRaw, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    : "—";
  const marginHint = analyticsForm.marginUsed.trim()
    ? `$${formatDecimal(marginRaw, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    : "—";
  const unrealizedHint = analyticsForm.unrealized.trim()
    ? `${unrealizedRaw >= 0 ? "+" : "-"}$${formatDecimal(
        Math.abs(unrealizedRaw),
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`
    : "—";
  const fundingHint = analyticsForm.funding.trim()
    ? `${fundingRaw >= 0 ? "+" : "-"}$${formatDecimal(
        Math.abs(fundingRaw),
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`
    : "—";
  const exposureHint = analyticsForm.notional.trim()
    ? `$${formatDecimal(exposureRaw, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    : "—";
  const fundingRateHint = outlookForm.currentRate.trim()
    ? `${fundingRateRaw >= 0 ? "+" : "-"}${formatDecimal(
        Math.abs(fundingRateRaw),
        {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        }
      )}%`
    : "—";
  const nextImpactHint = outlookForm.nextImpact.trim()
    ? `${nextImpactRaw >= 0 ? "+" : "-"}$${formatDecimal(
        Math.abs(nextImpactRaw),
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`
    : "—";
  const basisHint = outlookForm.basis.trim()
    ? `${basisRaw >= 0 ? "+" : "-"}${formatDecimal(
        Math.abs(basisRaw),
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}%`
    : "—";

  const handleAnalyticsChange = (field: keyof AnalyticsFormState) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setAnalyticsForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOutlookChange = (field: keyof OutlookFormState) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setOutlookForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Account Analytics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cross-margin account summary plus funding impact snapshot.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <header className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>Manual Inputs</span>
            <span className="text-[11px] text-muted-foreground/75">
              Adjust figures to mirror your portfolio.
            </span>
          </header>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={`${baseId}-equity`}
              label="Equity"
              prefix="$"
              value={analyticsForm.equity}
              onChange={handleAnalyticsChange("equity")}
              step="100"
              hint={equityHint}
            />
            <Field
              id={`${baseId}-margin`}
              label="Margin Used"
              prefix="$"
              value={analyticsForm.marginUsed}
              onChange={handleAnalyticsChange("marginUsed")}
              step="100"
              hint={marginHint}
            />
            <Field
              id={`${baseId}-unrealized`}
              label="Unrealized PnL"
              prefix="$"
              value={analyticsForm.unrealized}
              onChange={handleAnalyticsChange("unrealized")}
              step="0.01"
              hint={unrealizedHint}
            />
            <Field
              id={`${baseId}-funding`}
              label="Funding (24h)"
              prefix="$"
              value={analyticsForm.funding}
              onChange={handleAnalyticsChange("funding")}
              step="0.01"
              hint={fundingHint}
            />
            <Field
              id={`${baseId}-notional`}
              label="Net Exposure (Notional)"
              prefix="$"
              value={analyticsForm.notional}
              onChange={handleAnalyticsChange("notional")}
              step="100"
              hint={exposureHint}
            />
            <Field
              id={`${baseId}-funding-rate`}
              label="Current Funding Rate"
              suffix="%"
              value={outlookForm.currentRate}
              onChange={handleOutlookChange("currentRate")}
              step="0.001"
              hint={fundingRateHint}
            />
            <Field
              id={`${baseId}-impact`}
              label="Next Cycle Impact"
              prefix="$"
              value={outlookForm.nextImpact}
              onChange={handleOutlookChange("nextImpact")}
              step="0.01"
              hint={nextImpactHint}
            />
            <Field
              id={`${baseId}-basis`}
              label="Fair Price Basis"
              suffix="%"
              value={outlookForm.basis}
              onChange={handleOutlookChange("basis")}
              step="0.01"
              hint={basisHint}
            />
          </div>
        </section>
        <div className="grid gap-5 sm:grid-cols-2">
          <Metric label="Equity" value={equityDisplay} />
          <Metric label="Margin Used" value={marginDisplay} />
          <Metric
            label="Unrealized PnL"
            value={unrealizedDisplay}
            trend={analyticsValues.unrealized >= 0 ? "bull" : "bear"}
          />
          <Metric
            label="Funding (24h)"
            value={fundingDisplay}
            trend={analyticsValues.funding >= 0 ? "bull" : "bear"}
          />
        </div>
        <Separator />
        <div className="space-y-3">
          <header className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>Scenario Simulator</span>
            <span>{priceDeltaDisplay}% move</span>
          </header>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={priceDelta}
            onChange={(event) => setPriceDelta(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Expected PnL if mark price shifts {priceDeltaDisplay}%:{" "}
            <span className={projectedPnl >= 0 ? "text-bull" : "text-bear"}>
              ${projectedPnlDisplay}
            </span>
          </p>
        </div>
        <Separator />
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Funding Outlook
          </p>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-md border border-border/30 bg-background/80 px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Current Rate
              </span>
              <Badge variant={outlookValues.currentRate >= 0 ? "bull" : "bear"} className="w-fit">
                {fundingRateDisplay}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 rounded-md border border-border/30 bg-background/80 px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Next Cycle Impact
              </span>
              <span
                className={cn(
                  "text-base font-semibold",
                  outlookValues.nextImpact >= 0 ? "text-bull" : "text-bear"
                )}
              >
                {nextImpactDisplay}
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-md border border-border/30 bg-background/80 px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Fair Price Basis
              </span>
              <span
                className={cn(
                  "text-base font-semibold",
                  outlookValues.basis >= 0 ? "text-bull" : "text-bear"
                )}
              >
                {basisDisplay}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  trend
}: {
  label: string;
  value: string;
  trend?: "bull" | "bear";
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {trend && (
        <span className={`text-xs ${trend === "bull" ? "text-bull" : "text-bear"}`}>
          {trend === "bull" ? "Positive momentum" : "Monitor drawdown"}
        </span>
      )}
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  hint?: string;
};

function Field({ id, label, value, onChange, prefix, suffix, step, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          step={step}
          className={cn(prefix ? "pl-7" : undefined, suffix ? "pr-10" : undefined)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}
