'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaGear } from "react-icons/fa6";
import { PathConfig } from '@/components/PathConfig';

export default function NavBar() {
  const [showPathConfig, setShowPathConfig] = useState(false);

  return (
    <nav className="w-full h-12 bg-slate-800 shadow-sm fixed top-0 left-0 right-0 z-50 px-4 flex items-center justify-between">
      <Link
        href="/list-files"
        className="px-2 py-1 text-sm text-slate-200 rounded-md hover:text-white transition-colors"
      >
        首页
      </Link>
      <button
        onClick={() => setShowPathConfig(true)}
        className="flex flex-row gap-2 items-center text-slate-200 hover:text-white px-2 py-1"
        tabIndex={0}
        aria-label="配置"
      >
        <FaGear className="w-4 h-4" />
        配置
      </button>

      <PathConfig 
        show={showPathConfig}
        onClose={() => setShowPathConfig(false)}
      />
    </nav>
  );
}
