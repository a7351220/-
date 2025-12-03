import React, { useState } from 'react';
import SchemaEditor from './components/SchemaEditor';
import DataVisualizer from './components/DataVisualizer';
import { FieldDefinition } from './types';
import { ScanBarcode, FileText } from 'lucide-react';

const App: React.FC = () => {
  // Initial demo state
  const [fields, setFields] = useState<FieldDefinition[]>([
    { id: '1', name: 'ID', length: 5, color: 'bg-red-200 text-red-900 border-red-300' },
    { id: '2', name: 'Name', length: 15, color: 'bg-blue-200 text-blue-900 border-blue-300' },
    { id: '3', name: 'Date', length: 8, color: 'bg-emerald-200 text-emerald-900 border-emerald-300' },
  ]);

  const [rawData, setRawData] = useState<string>(
    "12345John Doe       20231001\n98765Jane Smith     20231002\n11222ShortName      202310  \n99999OverflowUser   20231005EXTRA_DATA_HERE"
  );

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 flex-none z-30 shadow-sm">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-sm shadow-indigo-200">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">FixedWidth Lens</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
             <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">Powered by Gemini</a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 gap-4 min-h-0 overflow-hidden">
        
        {/* Top Section: Inputs */}
        <div className="flex-none h-[45%] flex gap-4 min-h-[300px]">
          
          {/* Left: Schema Editor */}
          <div className="w-[350px] flex-none h-full">
            <SchemaEditor fields={fields} setFields={setFields} />
          </div>

          {/* Right: Data Input */}
          <div className="flex-1 h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-200 bg-slate-50 flex-none flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Raw Data Input
                </h2>
                <span className="text-xs text-slate-400">Paste your fixed-width file content</span>
             </div>
             <div className="flex-1 relative">
               <textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Paste your fixed-width data here..."
                  className="absolute inset-0 w-full h-full p-4 text-sm font-mono-data bg-white focus:bg-slate-50 outline-none resize-none text-slate-700 whitespace-pre border-none"
                  spellCheck={false}
                />
             </div>
          </div>
        </div>

        {/* Bottom Section: Visualizer (Takes remaining space) */}
        <div className="flex-1 min-h-0 flex flex-col">
           <DataVisualizer fields={fields} rawData={rawData} setRawData={setRawData} />
        </div>

      </main>
    </div>
  );
};

export default App;