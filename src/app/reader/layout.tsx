// Build sırasında değil, kullanıcı girdiği anda (runtime) oluşturulmasını sağlar.
export const dynamic = "force-dynamic";

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
