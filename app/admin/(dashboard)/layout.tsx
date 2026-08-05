import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-flatbread">
      <aside className="flex w-60 shrink-0 flex-col justify-between bg-charcoal p-5">
        <div>
          <div className="mb-8 px-1">
            <p className="font-display text-lg font-semibold text-flatbread">Adana Pizza</p>
            <p className="text-xs text-flatbread-2/50">Админ-панель</p>
          </div>
          <Sidebar />
        </div>
        <div className="flex items-center justify-between px-1 text-flatbread-2">
          <span className="text-sm">{admin.name ?? admin.username}</span>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
