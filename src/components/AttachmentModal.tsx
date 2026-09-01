import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  title: string;
  src: string;
  contentType?: string;
  onClose: () => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  title,
  src,
  contentType,
  onClose,
}) => {
  if (!isOpen || !src) return null;

  const isImage =
    src.startsWith('data:image/') || (contentType && contentType.startsWith('image/'));
  const isPdf =
    src.startsWith('data:application/pdf') ||
    contentType === 'application/pdf' ||
    src.toLowerCase().includes('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-5 shadow-2xl relative text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider truncate max-w-md">
              {title || 'Document Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={src}
              download="document"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition flex items-center gap-1 text-xs font-medium"
              title="Open or Download"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <img
              src={src}
              alt="Attachment"
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
            />
          ) : isPdf ? (
            <iframe
              src={src}
              title="PDF Viewer"
              className="w-full h-[65vh] rounded-lg border-none"
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Preview not directly supported for this format.
              </p>
              <a
                href={src}
                download="attachment"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
