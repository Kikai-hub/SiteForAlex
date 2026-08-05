import { getCustomerSession } from "@/lib/auth/customer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();

  return (
    <div className="flex min-h-screen flex-col">
      <Header isLoggedIn={!!session} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
