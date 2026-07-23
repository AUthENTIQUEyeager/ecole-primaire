import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { OfflineBanner } from '@/components/layout/OfflineBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <OfflineBanner />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
