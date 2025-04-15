'use client';

import { useState, useEffect } from 'react';
import { UserButton } from "@clerk/nextjs";
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/phones"
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Gerenciar Números</h2>
            <p className="text-gray-600">
              Adicione, edite e gerencie os números de telefone cadastrados.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
} 