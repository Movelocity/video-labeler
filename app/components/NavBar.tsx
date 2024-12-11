'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaGear } from "react-icons/fa6";
import { PathConfig } from '@/components/PathConfig';

export default function NavBar() {
  const [showPathConfig, setShowPathConfig] = useState(false);

  return (
    <nav className="w-full h-10 bg-slate-800 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="px-4 h-full flex items-center justify-between">
        <Link
          href="/list-files"
          className="px-2 py-1 text-sm text-slate-200 rounded-md hover:text-white transition-colors"
        >
          Home
        </Link>
        <button
          onClick={() => setShowPathConfig(true)}
          className="text-sm flex flex-row items-center text-slate-200 hover:text-white px-2 py-1"
          tabIndex={0}
          aria-label="配置"
        >
          <FaGear className="mr-1" />
          配置
        </button>
      </div>
      <PathConfig 
        show={showPathConfig}
        onClose={() => setShowPathConfig(false)}
      />
    </nav>
  );
}
