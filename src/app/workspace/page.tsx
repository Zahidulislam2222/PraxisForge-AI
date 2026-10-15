import { Workspace } from "@/components/workspace";
import { content, settings } from "@/lib/content";
import { routeMetadata } from "@/lib/site-routing";
export const metadata = {
  ...routeMetadata(
    `${content.metadata.workspaceTitle} — ${content.brand} ${content.brandSuffix}`,
    settings.demo.disclaimer,
    "workspace",
  ),
  robots: { index: false, follow: false },
};
export default function WorkspacePage() {
  return <Workspace />;
}
