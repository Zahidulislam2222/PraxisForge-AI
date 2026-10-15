import type { Metadata } from "next";
import { Operations } from "@/components/operations";
import { content, operationsContent } from "@/lib/content";
import { routeMetadata } from "@/lib/site-routing";
export const metadata: Metadata = {
  ...routeMetadata(
    `${content.metadata.operationsTitle} — ${content.brand} ${content.brandSuffix}`,
    operationsContent.loginDescription,
    "operations",
  ),
  robots: { index: false, follow: false },
};
export default function OperationsPage() {
  return <Operations />;
}
