import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SODViolation } from "@/types/team";

interface SODViolationsPanelProps {
  violations: SODViolation[];
  dealId: string;
}

export function SODViolationsPanel({ violations, dealId }: SODViolationsPanelProps) {
  if (violations.length === 0) {
    return (
      <Card>
        <CardHeader title="Segregation of Duties" subtitle="No violations detected" />
        <CardBody>
          <Badge color="emerald">✓ Compliant</Badge>
        </CardBody>
      </Card>
    );
  }

  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  return (
    <Card>
      <CardHeader
        title="Segregation of Duties"
        subtitle={`${errors.length} error(s), ${warnings.length} warning(s)`}
      />
      <CardBody className="space-y-3">
        {errors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-rose-700">🚫 Blocking Issues</p>
            <div className="space-y-2">
              {errors.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-md border border-rose-200 bg-rose-50 p-3"
                >
                  <p className="text-sm font-medium text-rose-900">{violation.ruleId}</p>
                  <p className="mt-1 text-xs text-rose-700">{violation.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-amber-700">⚠️ Warnings</p>
            <div className="space-y-2">
              {warnings.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-md border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="text-sm font-medium text-amber-900">{violation.ruleId}</p>
                  <p className="mt-1 text-xs text-amber-700">{violation.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
