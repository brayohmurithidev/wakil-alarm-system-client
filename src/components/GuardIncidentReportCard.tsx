import clsx from "clsx";

import type { GuardIncidentReport } from "@/api/types";
import { Body } from "@/components/ui";

type GuardIncidentReportCardProps = {
  report: GuardIncidentReport;
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

export function GuardIncidentReportCard({ report }: GuardIncidentReportCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Body className="font-medium">{report.guard?.name ?? "Guard"}</Body>
        <span
          className={clsx(
            "px-2 py-1 rounded-sm text-xs font-semibold border inline-block",
            report.status === "submitted"
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-orange-100 text-orange-800 border-orange-300",
          )}
        >
          {report.status === "submitted" ? "Submitted" : "Draft"}
        </span>
      </div>

      <div>
        <Body size="sm" className="text-muted-foreground">
          Incident Type
        </Body>
        <Body size="sm">{report.incidentType}</Body>
      </div>

      {report.outcome && (
        <div>
          <Body size="sm" className="text-muted-foreground">
            Outcome
          </Body>
          <Body size="sm">{report.outcome}</Body>
        </div>
      )}

      {report.description && (
        <div>
          <Body size="sm" className="text-muted-foreground">
            Description
          </Body>
          <Body size="sm" className="whitespace-pre-wrap">
            {report.description}
          </Body>
        </div>
      )}

      {report.photoUrls.length > 0 && (
        <div>
          <Body size="sm" className="text-muted-foreground mb-1">
            Photos
          </Body>
          <div className="flex gap-2 flex-wrap">
            {report.photoUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-md border border-border"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {report.signatureUrl && (
        <div>
          <Body size="sm" className="text-muted-foreground mb-1">
            Client Signature
          </Body>
          <a href={report.signatureUrl} target="_blank" rel="noreferrer">
            <img
              src={report.signatureUrl}
              alt="Client signature"
              className="h-20 rounded-md border border-border bg-white"
            />
          </a>
        </div>
      )}

      <Body size="sm" className="text-muted-foreground">
        {report.status === "submitted" && report.submittedAt
          ? `Submitted ${formatDate(report.submittedAt)}`
          : `Last updated ${formatDate(report.updatedAt)}`}
      </Body>
    </div>
  );
}
