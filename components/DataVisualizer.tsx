import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FieldDefinition } from '../types';
import { Layers, Wand2, Copy, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DataVisualizerProps {
  fields: FieldDefinition[];
  rawData: string;
  setRawData: (data: string) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  fieldName: string;
  fieldLength: number;
  value: string;
  rowIndex: number;
}

const DataVisualizer: React.FC<DataVisualizerProps> = ({ fields, rawData, setRawData }) => {
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ 
    visible: false, x: 0, y: 0, fieldName: '', fieldLength: 0, value: '', rowIndex: 0 
  });
  const [copied, setCopied] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalSchemaLength = useMemo(() => fields.reduce((acc, f) => acc + f.length, 0), [fields]);
  const rows = useMemo(() => rawData.split('\n'), [rawData]);

  // Handle mouse move for tooltip positioning
  const handleMouseMove = (e: React.MouseEvent, field: FieldDefinition, value: string, rowIndex: number) => {
    const x = e.clientX + 15;
    const y = e.clientY + 15;
    
    setTooltip({
      visible: true,
      x,
      y,
      fieldName: field.name,
      fieldLength: field.length,
      value,
      rowIndex: rowIndex + 1
    });
    
    setHoveredFieldId(field.id);
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredFieldId(null);
  };

  // --- Editing Logic ---

  const handlePadData = () => {
    const newRows = rows.map(line => {
      if (line.length < totalSchemaLength) {
        return line.padEnd(totalSchemaLength, ' ');
      }
      return line;
    });
    setRawData(newRows.join('\n'));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const updateCell = (rowIndex: number, fieldIndex: number, newValue: string) => {
    // 1. Calculate the start index of the field in the string
    let startIndex = 0;
    for (let i = 0; i < fieldIndex; i++) {
      startIndex += fields[i].length;
    }

    const field = fields[fieldIndex];
    const originalLine = rows[rowIndex] || "";
    
    // 2. Normalize new value (truncate or pad to match field length exactly)
    // We pad with spaces if short, slice if long to strictly enforce fixed width
    const paddedValue = newValue.padEnd(field.length, ' ').slice(0, field.length);

    // 3. Reconstruct the line
    // We need to handle cases where the original line is shorter than the start index
    const linePaddedToStart = originalLine.padEnd(startIndex, ' ');
    
    const before = linePaddedToStart.slice(0, startIndex);
    const after = linePaddedToStart.slice(startIndex + field.length);
    
    const newLine = before + paddedValue + after;

    // 4. Update state
    const newRows = [...rows];
    newRows[rowIndex] = newLine;
    setRawData(newRows.join('\n'));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden relative">
      
      {/* Header Bar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-none z-20">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Segmentation View
        </h2>
        <div className="flex items-center gap-4">
           
           <div className="flex items-center gap-4 text-xs text-slate-500 mr-2">
             <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-red-100 border border-red-300"></div>
               <span>Overflow</span>
             </div>
             <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-amber-50 border border-amber-200"></div>
               <span>Underflow</span>
             </div>
             <span className="font-mono border-l border-slate-200 pl-3 ml-1">{rows.length} Rows</span>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={handlePadData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 hover:border-indigo-300 text-slate-700 text-xs font-medium rounded shadow-sm transition-all"
                title="Automatically pad short lines with spaces to match schema length"
              >
                <Wand2 className="w-3 h-3 text-indigo-500" />
                Auto-Pad
              </button>

              <button 
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-all text-white border ${copied ? 'bg-emerald-500 border-emerald-600' : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700'}`}
                title="Copy current data to clipboard"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
           </div>
        </div>
      </div>

      {/* Main Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-white relative">
        {fields.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Layers className="w-12 h-12 mb-2 opacity-20" />
            <p className="italic">Define a schema to see visualization</p>
          </div>
        ) : (
          <div className="inline-block min-w-full pb-10 pt-2">
            
            {/* Data Rows */}
            <div className="font-mono-data text-sm bg-white">
              {rows.map((line, rowIdx) => {
                // Skip empty last line if it's just a newline created by the split
                if (rowIdx === rows.length - 1 && line === '') return null;
                
                let currentPointer = 0;
                const lineLength = line.length;
                const isLong = lineLength > totalSchemaLength;

                return (
                  <div key={rowIdx} className="flex group/row hover:bg-slate-50 transition-colors">
                    {/* Line Number */}
                    <div className="w-10 flex-none text-[10px] text-slate-400 bg-slate-50 border-r border-slate-200 flex items-center justify-end pr-2 select-none sticky left-0 z-10">
                      {rowIdx + 1}
                    </div>

                    {/* Fields */}
                    {fields.map((field, fieldIdx) => {
                      const segment = line.slice(currentPointer, currentPointer + field.length);
                      const segmentLen = segment.length;
                      const isUnderflow = segmentLen < field.length;
                      
                      const startP = currentPointer; // Capture for closure
                      currentPointer += field.length;

                      // Determine cell background
                      let bgClass = "bg-transparent";
                      if (hoveredFieldId === field.id) bgClass = "bg-indigo-50/50";
                      
                      // Highlight borders
                      const borderClass = hoveredFieldId === field.id 
                        ? "border-r border-indigo-300" 
                        : "border-r border-slate-300";

                      return (
                        <div
                          key={field.id}
                          style={{ width: `${field.length}ch` }}
                          className={`
                            h-7 flex-none flex items-center relative
                            ${bgClass} ${borderClass}
                          `}
                          onMouseMove={(e) => handleMouseMove(e, field, segment, rowIdx)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <input
                             type="text"
                             value={segment}
                             maxLength={field.length}
                             onChange={(e) => updateCell(rowIdx, fieldIdx, e.target.value)}
                             className={`
                               w-full h-full bg-transparent border-none p-0 px-1 outline-none font-mono-data text-slate-700
                               focus:bg-white focus:ring-1 focus:ring-inset focus:ring-indigo-500 z-10
                             `}
                             spellCheck={false}
                          />
                          {isUnderflow && (
                            <div className="absolute inset-0 bg-stripes-amber opacity-20 pointer-events-none z-0" />
                          )}
                        </div>
                      );
                    })}

                    {/* Overflow Content */}
                    {isLong && (
                      <div className="h-7 flex items-center px-2 bg-red-100 text-red-700 border-l border-red-300 whitespace-nowrap text-xs font-bold shadow-inner">
                        {line.slice(currentPointer)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tooltip Portal */}
      {tooltip.visible && createPortal(
        <div 
          className="fixed z-50 pointer-events-none flex flex-col gap-1 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700 backdrop-blur-sm bg-opacity-95"
          style={{ 
            left: Math.min(tooltip.x, window.innerWidth - 200), // Prevent going off right screen
            top: tooltip.y 
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-700 pb-1 mb-1">
            <span className="font-bold text-indigo-300">{tooltip.fieldName}</span>
            <span className="font-mono text-slate-400">Len: {tooltip.fieldLength}</span>
          </div>
          <div className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 break-all max-w-[200px] min-h-[20px]">
            {tooltip.value || <span className="text-slate-600 italic">empty</span>}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Row: {tooltip.rowIndex} | Length: {tooltip.value.length}
          </div>
        </div>,
        document.body
      )}

      {/* CSS for custom stripes */}
      <style>{`
        .bg-stripes-amber {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            #fcd34d 5px,
            #fcd34d 10px
          );
        }
      `}</style>
    </div>
  );
};

export default DataVisualizer;