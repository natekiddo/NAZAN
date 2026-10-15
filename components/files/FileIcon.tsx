import React from 'react';
import {
  FileCode2,
  FileImage,
  FileText,
  FileArchive,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  File,
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  mimeType?: string;
  className?: string;
}

export default function FileIcon({ fileName, mimeType = '', className = 'w-5 h-5' }: FileIconProps) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['ts', 'tsx', 'js', 'jsx', 'py', 'sql', 'json', 'html', 'css', 'go', 'rs', 'c', 'cpp', 'java'].includes(ext) || mimeType.includes('javascript') || mimeType.includes('json')) {
    return <FileCode2 className={`${className} text-cyan-500`} />;
  }

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mimeType.startsWith('image/')) {
    return <FileImage className={`${className} text-purple-500`} />;
  }

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return <FileText className={`${className} text-rose-500`} />;
  }

  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext) || mimeType.includes('zip') || mimeType.includes('archive')) {
    return <FileArchive className={`${className} text-amber-500`} />;
  }

  if (['csv', 'xlsx', 'xls'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('csv')) {
    return <FileSpreadsheet className={`${className} text-emerald-500`} />;
  }

  if (mimeType.startsWith('audio/')) {
    return <FileAudio className={`${className} text-pink-500`} />;
  }

  if (mimeType.startsWith('video/')) {
    return <FileVideo className={`${className} text-indigo-500`} />;
  }

  if (['md', 'txt', 'rtf', 'doc', 'docx'].includes(ext)) {
    return <FileText className={`${className} text-blue-500`} />;
  }

  return <File className={`${className} text-slate-400`} />;
}
