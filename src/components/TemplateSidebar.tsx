'use client';

import React, { useState } from 'react';
import { useCodaStore } from '../store';
import { Save, Download, Trash2, LayoutTemplate } from 'lucide-react';

export default function TemplateSidebar() {
  const { templates, saveAsNewTemplate, loadTemplate, deleteTemplate } = useCodaStore();
  const [newName, setNewName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      saveAsNewTemplate(newName.trim());
      setNewName('');
    }
  };

  const handleLoad = (id: string, name: string) => {
    if (window.confirm(`'${name}' 템플릿을 불러오시겠습니까? 현재 화면의 세팅은 모두 덮어씌워집니다.`)) {
      loadTemplate(id);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`'${name}' 템플릿을 삭제하시겠습니까?`)) {
      deleteTemplate(id);
    }
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col shadow-sm z-10 overflow-hidden relative">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-blue-600" /> 템플릿 보관함
        </h2>
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <input 
            type="text" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder="새 템플릿 이름..." 
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="submit" 
            disabled={!newName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> Save Template
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {templates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-xs font-medium">저장된 템플릿이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-colors group">
                <h3 className="text-sm font-bold text-gray-800 mb-1 truncate" title={tmpl.name}>{tmpl.name}</h3>
                <p className="text-[10px] text-gray-400 mb-3">{new Date(tmpl.updatedAt || parseInt(tmpl.id)).toLocaleString()}</p>
                <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleLoad(tmpl.id, tmpl.name)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-gray-200"
                  >
                    <Download className="w-3 h-3" /> Load
                  </button>
                  <button 
                    onClick={() => handleDelete(tmpl.id, tmpl.name)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-md transition-colors border border-transparent shadow-sm"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
