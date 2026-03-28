'use client';

import React from 'react';
import { useCodaStore } from '../store';
import { Trash2 } from 'lucide-react';

export default function Inspector() {
  const { elements, matches, currentMatchId, selectedElementId, updateElement, updateDecorativeElement, deleteElement, deleteDecorativeElement } = useCodaStore();
  
  const activeMatch = matches.find(m => m.id === currentMatchId);
  const decorativeElements = activeMatch?.decorativeElements || [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let selectedEl: any = elements.find(e => e.id === selectedElementId);
  let isDecorative = false;

  if (!selectedEl) {
    selectedEl = decorativeElements.find(e => e.id === selectedElementId);
    if (selectedEl) isDecorative = true;
  }

  if (!selectedEl) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-gray-500 shadow-sm z-50">
        <div className="p-4 bg-gray-50 rounded-full mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="font-medium text-sm">캔버스에서 요소를 선택하세요</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (isDecorative) {
      deleteDecorativeElement(selectedEl.id);
    } else {
      deleteElement(selectedEl.id);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = (updates: any) => {
    if (isDecorative) {
      updateDecorativeElement(selectedEl.id, updates);
    } else {
      updateElement(selectedEl.id, updates);
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col shadow-sm z-50 overflow-y-auto relative">
      <h2 className="text-lg font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4 uppercase tracking-wider">
        {selectedEl.type} 설정
      </h2>
      
      <div className="space-y-5">
        
        {/* ROW PROPERTIES */}
        {!isDecorative && selectedEl.type === 'row' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Event Code</label>
              <input type="text" value={selectedEl.code} onChange={(e) => handleUpdate({ code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">리드 타임(초)</label>
                <input type="number" value={selectedEl.leadTime || 0} onChange={(e) => handleUpdate({ leadTime: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">래그 타임(초)</label>
                <input type="number" value={selectedEl.lagTime || 0} onChange={(e) => handleUpdate({ lagTime: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">독점 그룹</label>
              <input type="text" value={selectedEl.exclusiveGroup || ''} onChange={(e) => handleUpdate({ exclusiveGroup: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 공수" />
            </div>
          </>
        )}

        {/* LABEL PROPERTIES */}
        {!isDecorative && selectedEl.type === 'label' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Group (옵션)</label>
              <input type="text" value={selectedEl.group || ''} onChange={(e) => handleUpdate({ group: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 구역" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Tag Text</label>
              <input type="text" value={selectedEl.text} onChange={(e) => handleUpdate({ text: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 좌측" />
            </div>
          </>
        )}

        {/* SHAPE PROPERTIES (Rect/Circle) */}
        {isDecorative && (selectedEl.type === 'rect' || selectedEl.type === 'circle') && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">배경색</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300">
                  <input type="color" value={selectedEl.backgroundColor} onChange={(e) => handleUpdate({ backgroundColor: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                </div>
                <input type="text" value={selectedEl.backgroundColor} onChange={(e) => handleUpdate({ backgroundColor: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">테두리 굵기</label>
                <input type="number" value={selectedEl.borderWidth} onChange={(e) => handleUpdate({ borderWidth: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" min="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">테두리 색상</label>
                <div className="flex gap-2 items-center relative h-[38px] rounded-lg overflow-hidden border border-gray-300 shadow-sm mt-1">
                   <input type="color" value={selectedEl.borderColor} onChange={(e) => handleUpdate({ borderColor: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* TEXTBOX PROPERTIES */}
        {isDecorative && selectedEl.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">텍스트 내용</label>
              <textarea value={selectedEl.text} onChange={(e) => handleUpdate({ text: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">폰트 사이즈</label>
                <input type="number" value={selectedEl.fontSize} onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 12 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" min="1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">글자 색상</label>
                <div className="flex gap-2 items-center relative h-[38px] rounded-lg overflow-hidden border border-gray-300 shadow-sm mt-1">
                   <input type="color" value={selectedEl.fontColor} onChange={(e) => handleUpdate({ fontColor: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* COUNTER PROPERTIES */}
        {isDecorative && selectedEl.type === 'counter' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">카운터 지정 명</label>
              <input type="text" value={selectedEl.label} onChange={(e) => handleUpdate({ label: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 득점 수" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">수동 데이터 기입</label>
              <input type="number" value={selectedEl.count} onChange={(e) => handleUpdate({ count: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">카드 배경색</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300">
                  <input type="color" value={selectedEl.color} onChange={(e) => handleUpdate({ color: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                </div>
                <input type="text" value={selectedEl.color} onChange={(e) => handleUpdate({ color: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono" />
              </div>
            </div>
          </>
        )}

        {/* SHARED DIMENSIONS (Applicable strictly for Rows/Labels visually handled outside Rnd) */}
        {!isDecorative && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">가로 너비</label>
              <input type="number" value={selectedEl.width} onChange={(e) => handleUpdate({ width: parseInt(e.target.value) || 100 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">세로 높이</label>
              <input type="number" value={selectedEl.height} onChange={(e) => handleUpdate({ height: parseInt(e.target.value) || 60 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        )}
        
        {/* SHARED COLOR (Row/Label/Counter) */}
        {!isDecorative && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">버튼 색상</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300">
                <input type="color" value={selectedEl.color || '#3b82f6'} onChange={(e) => handleUpdate({ color: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
              </div>
              <input type="text" value={selectedEl.color || '#3b82f6'} onChange={(e) => handleUpdate({ color: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono" />
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-100 mt-6">
          <button onClick={handleDelete} className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" /> 삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
