import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PenTool, ArrowRight, CheckCircle2, LayoutPanelLeft } from 'lucide-react'
import RealTimeListener from '@/components/RealTimeListener'

export const dynamic = 'force-dynamic'

export default async function SignatureQueue({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  const queue = await prisma.workOrder.findMany({
    where: {
      isWaitingForSignature: true,
      signatureData: null
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <RealTimeListener event="dashboard" />
      
      <header className="bg-white border-b border-gray-100 p-6 md:p-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <PenTool className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Aláírási Várólista</h1>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">iPad Terminal</p>
            </div>
          </div>
          <Link href="/" className="p-3 text-gray-400 hover:text-blue-600 transition-colors">
            <LayoutPanelLeft size={24} />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
        {success && (
          <div className="mb-8 bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-emerald-500 p-2 rounded-full text-white">
              <CheckCircle2 size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-emerald-900 font-black text-lg">Sikeres aláírás!</p>
              <p className="text-emerald-600 font-bold">A munkalap frissítve lett a rendszerben.</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-3">
            <PenTool size={20} className="text-blue-500" />
            Várakozó munkalapok
            <span className="bg-gray-200 text-gray-500 text-xs px-2.5 py-1 rounded-full">{queue.length}</span>
          </h2>

          <div className="grid gap-4">
            {queue.map((wo) => (
              <Link
                key={wo.id}
                href={`/sign/${wo.id}`}
                className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {wo.customerName ? wo.customerName[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{wo.customerName || 'Névtelen Ügyfél'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">#{wo.id.slice(-6)}</span>
                      <span className="text-sm text-gray-400 font-bold">{wo.deviceType}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={24} />
                </div>
              </Link>
            ))}

            {queue.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4 text-gray-300">
                  <PenTool size={48} />
                </div>
                <p className="text-gray-400 font-bold text-lg">Jelenleg nincs aláírásra váró munkalap.</p>
                <p className="text-gray-400 text-sm mt-1">A technikusnak a munkalapnál kell kérnie az aláírást.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-8 text-center">
        <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Cellnet Kft. Szerviz • iPad Signature Terminal</p>
      </footer>
    </div>
  )
}
