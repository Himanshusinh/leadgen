"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const links = [
    {
      href: "/dashboard",
      label: "Campaigns & Leads",
      activePattern: /^\/dashboard(\/campaigns\/[^/]+)?$/,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      href: "/dashboard/template",
      label: "Email Template",
      activePattern: /^\/dashboard\/template$/,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/custom-send",
      label: "Email Custom List",
      activePattern: /^\/dashboard\/custom-send$/,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Collapsible Left Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-40 ${
          isExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          {isExpanded && (
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase select-none">
              Menu Navigation
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition shrink-0 ${
              !isExpanded ? "mx-auto" : ""
            }`}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {links.map((link) => {
            const isActive = link.activePattern.test(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3.5 px-3 py-2.5 text-sm font-semibold rounded-lg transition group relative ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                } ${!isExpanded ? "justify-center" : ""}`}
                title={!isExpanded ? link.label : undefined}
              >
                <div className={`shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {link.icon}
                </div>
                {isExpanded && <span className="truncate">{link.label}</span>}
                
                {/* Tooltip for Collapsed State */}
                {!isExpanded && (
                  <span className="absolute left-14 z-50 scale-0 group-hover:scale-100 rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white transition-all duration-100 origin-left shadow-md">
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-grow min-w-0 overflow-x-hidden flex flex-col h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
