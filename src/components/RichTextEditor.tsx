'use client'

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-2xl border border-gray-200" />
})

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function RichTextEditor({ value, onChange }: Props) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet'
  ]

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="text-gray-800"
      />
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 8px 12px;
        }
        .ql-container.ql-snow {
          border: none;
          min-height: 250px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .ql-editor {
          padding: 16px;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
