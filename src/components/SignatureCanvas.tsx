'use client'

import { useRef, useState } from 'react'
import SignaturePad from 'react-signature-canvas'
import { Check, X, Eraser } from 'lucide-react'
import { saveSignature } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'

interface Props {
  workOrderId: string
  customerName: string
  declarationText: string
}

export default function SignatureCanvas({ workOrderId, customerName, declarationText }: Props) {
  const sigPad = useRef<SignaturePad>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const clear = () => {
    sigPad.current?.clear()
  }

  const save = async () => {
    if (sigPad.current?.isEmpty()) {
      alert('Kérjük, írja alá a dokumentumot!')
      return
    }

    setLoading(true)
    try {
      const data = sigPad.current?.getTrimmedCanvas().toDataURL('image/png')
      if (data) {
        await saveSignature(workOrderId, data)
        router.push(`/t/${workOrderId}`)
      }
    } catch (error) {
      console.error('Failed to save signature:', error)
      alert('Hiba történt az aláírás mentése közben.')
    } finally {
      setLoading(false)
    }
  }

  const sanitizedDeclaration = DOMPurify.sanitize(declarationText, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: [],
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        <section className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <h2 className="text-2xl font-black text-gray-900 mb-6 border-bottom-2 border-blue-500 pb-2">NYILATKOZAT</h2>
          
          <div className="space-y-4 text-[15px]">
            <div 
              className="font-medium text-gray-800 bg-gray-50 p-6 rounded-2xl border border-gray-100 declaration-content max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: `
                  <style>
                    .declaration-content p { margin-bottom: 0.5rem !important; line-height: 1.5; min-height: 1em; }
                    .declaration-content p:empty::before { content: "\\00a0"; }
                    .declaration-content ul { list-style-type: disc !important; padding-left: 1.25rem !important; margin-top: 0.25rem !important; margin-bottom: 0.75rem !important; }
                    .declaration-content li { margin-bottom: 0.25rem !important; padding-left: 0.25rem; display: list-item !important; }
                    .declaration-content p:last-child, .declaration-content ul:last-child { margin-bottom: 0 !important; }
                    .declaration-content { word-break: break-word !important; overflow-wrap: break-word !important; }
                  </style>
                  ${sanitizedDeclaration.replace(/&nbsp;/g, ' ')}
                `
              }}
            />
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ügyfél neve</p>
              <p className="text-xl font-black text-gray-900">{customerName}</p>
            </div>
            <button 
              onClick={clear}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-bold transition-colors text-sm bg-gray-50 px-4 py-2 rounded-lg"
            >
              <Eraser size={16} /> Aláírás törlése
            </button>
          </div>
          
          <div className="relative h-64 md:h-80 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <SignaturePad
              ref={sigPad}
              canvasProps={{
                className: "w-full h-full cursor-crosshair"
              }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Aláírás helye</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-600 px-6 py-4 rounded-2xl font-bold border border-gray-200 hover:bg-gray-100 transition shadow-sm"
        >
          <X size={20} /> Mégse
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-extrabold hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Check size={20} strokeWidth={3} /> Elfogadom és Aláírom</>
          )}
        </button>
      </div>
    </div>
  )
}
