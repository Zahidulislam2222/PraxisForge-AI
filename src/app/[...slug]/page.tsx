import { notFound } from "next/navigation";
import { EditorialPage } from "@/components/editorial-page";
import { pageKeys } from "@/lib/site-pages";
import { settings } from "@/lib/content";
import { pageForSegments, pageMetadata } from "@/lib/site-routing";

export const dynamicParams = false;
export function generateStaticParams() {
  return pageKeys.map((key) => ({
    slug: settings.routes[key].split("/").filter(Boolean),
  }));
}
type Props = { params: Promise<{ slug: string[] }> };
export async function generateMetadata({ params }: Props) {
  const key = pageForSegments((await params).slug);
  if (!key) notFound();
  return pageMetadata(key);
}
export default async function SitePage({ params }: Props) {
  const key = pageForSegments((await params).slug);
  if (!key) notFound();
  return <EditorialPage pageKey={key} />;
}
