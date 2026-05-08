import CollectionsLayout from "@/app/(store)/collections/layout";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CollectionsLayout>{children}</CollectionsLayout>;
}
