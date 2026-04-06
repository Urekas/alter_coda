'use client';

import React, { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useCodaStore, UIElement, RowElement } from '../store';

export default function Canvas() {
  const store = useCodaStore();
  const { 
    mode, elements, matches, currentMatchId, selectedElementId, 
    selectElement, updateElement, updateDecorativeElement, incrementCounter,
    timerStatus, currentTime, addInstance, addLabelToCurrentInstance,
    activeRows, setActiveRows, deleteElement, deleteDecorativeElement
  } = store;
  
  const isRecording = timerStatus === 'running';
  const activeMatch = matches.find(m => m.id === currentMatchId);
  const decorativeElements = activeMatch?.decorativeElements || [];

  const containerRef = useRef<HTMLDivElement>(null);

  const handleElementClick = (e: React.MouseEvent, el: UIElement) => {
    e.stopPropagation();
    if (mode === 'design') {
      selectElement(el.id);
    } else {
      if (timerStatus !== 'running') return;
      const now = currentTime;

      if (el.type === 'row') {
        const lead = el.leadTime || 0;
        const lag = el.lagTime || 0;

        if (lead > 0 || lag > 0) {
          if (!store.overlapEnabled && activeRows[el.id]) {
            return; // 중복 방지가 켜져있으면(overlapEnabled가 false) 이미 활성화된 버튼 무시
          }
          
          const start = Math.max(0, now - lead);
          const end = now + lag;
          addInstance(el.code, start, end);
          
          // 중복을 허용하는 경우(overlapEnabled=true)에도 고유 타임아웃을 위해 timestamp 활용
          const stampId = store.overlapEnabled ? `${el.id}_${Date.now()}` : el.id;
          
          setActiveRows(prev => ({ ...prev, [stampId]: { startTime: now, labels: [] } }));
          setTimeout(() => {
            setActiveRows(prev => {
              const next = { ...prev };
              delete next[stampId];
              return next;
            });
          }, 500);
        } else {
          if (activeRows[el.id]) {
            const start = activeRows[el.id].startTime;
            const end = now;
            const bufferedLabels = activeRows[el.id].labels;
            addInstance(el.code, start, end);
            bufferedLabels.forEach(label => addLabelToCurrentInstance(label.group, label.text));
            setActiveRows(prev => {
              const next = { ...prev };
              delete next[el.id];
              return next;
            });
          } else {
            setActiveRows(prev => {
              const next = { ...prev };
              if (el.exclusiveGroup) {
                const rowElements = elements.filter(e => e.type === 'row') as RowElement[];
                Object.keys(next).forEach(activeId => {
                  const activeEl = rowElements.find(e => e.id === activeId);
                  if (activeEl && activeEl.exclusiveGroup === el.exclusiveGroup) {
                    const start = next[activeId].startTime;
                    const end = now;
                    const bufferedLabels = next[activeId].labels;
                    addInstance(activeEl.code, start, end);
                    bufferedLabels.forEach(label => addLabelToCurrentInstance(label.group, label.text));
                    delete next[activeId];
                  }
                });
              }
              next[el.id] = { startTime: now, labels: [] };
              return next;
            });
          }
        }
      } else if (el.type === 'label') {
        const newLabel = { group: el.group, text: el.text };
        setActiveRows(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(eventId => {
             next[eventId] = { ...next[eventId], labels: [...next[eventId].labels, newLabel] };
          });
          return next;
        });
        addLabelToCurrentInstance(el.group, el.text);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDecorativeElement = (el: any) => {
    const isSelected = selectedElementId === el.id;
    let content = null;
    let baseStyle: React.CSSProperties = {
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', boxSizing: 'border-box'
    };

    if (el.type === 'rect' || el.type === 'circle') {
      baseStyle = { ...baseStyle, backgroundColor: el.backgroundColor, border: `${el.borderWidth}px solid ${el.borderColor}`, borderRadius: el.type === 'circle' ? '50%' : '0' };
    } else if (el.type === 'text') {
      baseStyle = { ...baseStyle, color: el.fontColor, fontSize: `${el.fontSize}px`, fontWeight: 'bold' };
      content = el.text;
    } else if (el.type === 'counter') {
      baseStyle = { ...baseStyle, backgroundColor: el.color, color: '#fff', flexDirection: 'column', borderRadius: '8px', fontWeight: 'bold' };
      content = (
        <>
          <span className="text-sm opacity-90">{el.label}</span>
          <span className="text-3xl mt-1">{el.count}</span>
        </>
      );
    }

    return (
      <Rnd
        key={el.id}
        size={{ width: el.size.width, height: el.size.height }}
        position={{ x: el.position.x, y: el.position.y }}
        onDragStop={(e, d) => updateDecorativeElement(el.id, { position: { x: Math.round(d.x), y: Math.round(d.y) } })}
        onResizeStop={(e, dir, ref, delta, position) => {
          updateDecorativeElement(el.id, {
            size: { width: ref.offsetWidth, height: ref.offsetHeight },
            position: { x: Math.round(position.x), y: Math.round(position.y) }
          });
        }}
        disableDragging={mode !== 'design'}
        enableResizing={mode === 'design' ? { bottom: true, bottomRight: true, right: true, top: true, topLeft: true, bottomLeft: true, left: true, topRight: true } : false}
        bounds="parent"
        style={{ zIndex: 5, cursor: mode === 'design' ? 'grab' : (el.type === 'counter' ? 'pointer' : 'default') }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (mode === 'design') {
            selectElement(el.id);
          } else if (mode === 'code' && el.type === 'counter') {
            incrementCounter(el.id);
          }
        }}
        className={isSelected && mode === 'design' ? 'ring-4 ring-blue-500 ring-offset-2 rounded-sm' : ''}
      >
        <div style={baseStyle}>{content}</div>
        {mode === 'design' && (
          <button 
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md z-50 hover:bg-red-600 w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); deleteDecorativeElement(el.id); }}
            title="삭제"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </Rnd>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 relative overflow-hidden" ref={containerRef} onClick={() => mode === 'design' && selectElement(null)}>
      {decorativeElements.map(renderDecorativeElement)}
      {elements.map((el) => {
        const isSelected = selectedElementId === el.id;
        
        // Use Object.keys to check if any activeRow key starts with el.id
        const isActiveCode = mode === 'code' && el.type === 'row' && Object.keys(activeRows).some(key => key === el.id || key.startsWith(`${el.id}_`));
        
        return (
          <Rnd
            key={el.id}
            bounds="parent"
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            onDragStop={(e, d) => updateElement(el.id, { x: Math.round(d.x), y: Math.round(d.y) })}
            onResizeStop={(e, dir, ref, delta, position) => {
              updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: Math.round(position.x), y: Math.round(position.y) });
            }}
            disableDragging={mode !== 'design'}
            enableResizing={mode === 'design' ? { bottom: true, bottomRight: true, right: true, top: true, topLeft: true, bottomLeft: true, left: true, topRight: true } : false}
            style={{ zIndex: 10 }}
            onClick={(e: React.MouseEvent) => handleElementClick(e, el)}
            className={isSelected && mode === 'design' ? 'ring-4 ring-blue-500 ring-offset-2 rounded-sm' : ''}
          >
            <div
              style={{
                width: '100%', height: '100%',
                backgroundColor: el.type === 'row' ? el.color : (el.color || '#3b82f6'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600',
                borderRadius: '8px', cursor: mode === 'design' ? 'grab' : (isRecording ? 'pointer' : 'not-allowed'),
                border: isSelected && mode === 'design' ? '3px solid #2563eb' : (isActiveCode ? '3px solid white' : 'none'),
                boxShadow: isSelected ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : (isActiveCode ? '0 0 0 4px #10b981' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'),
                opacity: mode === 'code' && !isRecording ? 0.6 : 1,
                boxSizing: 'border-box'
              }}
              className={`transition-all select-none ${isActiveCode ? 'brightness-125' : ''} ${mode === 'code' && isRecording ? 'hover:shadow-lg hover:scale-[1.02] active:scale-95' : ''}`}
            >
              {el.type === 'row' ? el.code : el.text}
              {isActiveCode && <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />}
            </div>
            {mode === 'design' && (
              <button 
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md z-50 hover:bg-red-600 w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                title="삭제"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </Rnd>
        );
      })}
      
      {elements.length === 0 && decorativeElements.length === 0 && mode === 'design' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 font-medium text-lg">상단 버튼을 눌러 요소를 추가하세요</p>
        </div>
      )}
      
      {mode === 'code' && !isRecording && (elements.length > 0 || decorativeElements.length > 0) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full font-medium shadow-xl opacity-80 pointer-events-none transition-opacity z-50">
          기록을 시작하려면 우측 상단의 &apos;타이머 시작&apos; 버튼을 누르세요.
        </div>
      )}
    </div>
  );
}
