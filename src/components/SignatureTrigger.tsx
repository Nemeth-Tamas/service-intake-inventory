'use client'

import { useState } from 'react'
import { PenTool, Check, ExternalLink, RefreshCw } from 'lucide-react'
import { toggleSignatureQueue, voidSignature } from '@/lib/actions'
import Link from 'next/link'

interface Props {
  workOrderId: string
  isWaiting: boolean
  hasSignature: boolean
}

export default function SignatureTrigger({ workOrderId, isWaiting, hasSignature }: Props) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleSignatureQueue(workOrderId, !isWaiting)
    } finally {
      setLoading(false)
    }
  }

  const handleVoid = async () => {
    if (!confirm('Biztosan érvényteleníteni akarod az aláírást? Új aláírásra lesz szükség.')) return
    setLoading(true)
    try {
      await voidSignature(workOrderId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading || hasSignature}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all shadow-lg ${
            hasSignature 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
              : isWaiting
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {hasSignature ? (
            <><Check size={20} strokeWidth={3} /> Aláírva</>
          ) : isWaiting ? (
            <><PenTool size={20} /> Sorban áll...</>
          ) : (
            <><PenTool size={20} /> Aláírás kérése</>
          )}
        </button>

        {hasSignature ? (
          <button
            onClick={handleVoid}
            disabled={loading}
            className="p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition border border-red-100 shadow-sm"
            title="Aláírás érvénytelenítése"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        ) : isWaiting && (
          <Link
            href={`/sign/${workOrderId}`}
            className="p-4 bg-gray-800 text-white rounded-xl hover:bg-black transition shadow-lg"
            title="Aláírás megnyitása"
          >
            <ExternalLink size={20} />
          </Link>
        )}
      </div>
      
      {isWaiting && !hasSignature && (
        <p className="text-center text-xs font-bold text-orange-600 animate-pulse bg-orange-50 py-2 rounded-lg border border-orange-100">
          Várakozás az ügyfél aláírására az iPad-en...
        </p>
      )}
    </div>
  )
}
