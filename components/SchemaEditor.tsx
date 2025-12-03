import React, { useState, useRef } from 'react';
import { FieldDefinition, ParsingStatus } from '../types';
import { analyzeSchemaWithGemini } from '../services/geminiService';
import { GripVertical, X, Plus, Sparkles, Loader2 } from 'lucide-react';

interface SchemaEditorProps {
  fields: FieldDefinition[];
  setFields: React.Dispatch<React.SetStateAction<FieldDefinition[]>>;
}

const SchemaEditor: React.FC<SchemaEditorProps> = ({ fields, setFields }) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<ParsingStatus>(ParsingStatus.IDLE);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Simple Drag and Drop Implementation
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === index) return;

    const newFields = [...fields];
    const draggedItem = newFields[draggedItemIndex];
    
    // Remove from old index
    newFields.splice(draggedItemIndex, 1);
    // Insert at new index
    newFields.splice(index, 0, draggedItem);
    
    setFields(newFields);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setStatus(ParsingStatus.ANALYZING);
    try {
      const newFields = await analyzeSchemaWithGemini(prompt);
      setFields(newFields);
      setStatus(ParsingStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(ParsingStatus.ERROR);
    }
  };

  const addField = () => {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      name: 'New Field',
      length: 10,
      color: 'bg-gray-200 text-gray-800 border-gray-300'
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, key: keyof FieldDefinition, value: string | number) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
      <div className="flex-none mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          1. Define Schema
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Describe fields or paste a sample line.
        </p>
      </div>

      {/* AI Input */}
      <div className="flex-none mb-4">
        <div className="relative">
          <textarea
            className="w-full p-3 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none font-mono text-slate-700"
            rows={2}
            placeholder="e.g. 'ID 5 chars, Name 10' or paste sample..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={status === ParsingStatus.ANALYZING || !prompt.trim()}
            className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Auto-detect Schema"
          >
            {status === ParsingStatus.ANALYZING ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
          </button>
        </div>
        {status === ParsingStatus.ERROR && (
          <p className="text-xs text-red-500 mt-1">Failed to analyze.</p>
        )}
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto min-h-0 border-t border-slate-100 pt-2">
        <div className="space-y-2 pr-1">
           {fields.length === 0 && (
             <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
               <p className="text-slate-400 text-xs">No fields defined.</p>
             </div>
           )}
           
           {fields.map((field, index) => (
             <div
               key={field.id}
               draggable
               onDragStart={() => handleDragStart(index)}
               onDragOver={(e) => handleDragOver(e, index)}
               onDragEnd={handleDragEnd}
               className={`flex items-center gap-2 p-2 bg-white border rounded-lg group transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 border-indigo-300 scale-95' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
             >
               <button className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 flex-none">
                 <GripVertical className="w-4 h-4" />
               </button>
               
               <div className={`w-2 h-8 rounded-full flex-none ${field.color.split(' ')[0]}`}></div>
               
               <div className="flex-1 min-w-0">
                 <label className="text-[10px] text-slate-400 block -mb-0.5">Name</label>
                 <input
                   type="text"
                   value={field.name}
                   onChange={(e) => updateField(field.id, 'name', e.target.value)}
                   className="w-full text-xs font-medium text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none pb-0.5 truncate"
                 />
               </div>
               <div className="w-14 flex-none">
                 <label className="text-[10px] text-slate-400 block -mb-0.5">Len</label>
                  <input
                   type="number"
                   min="1"
                   value={field.length}
                   onChange={(e) => updateField(field.id, 'length', parseInt(e.target.value) || 0)}
                   className="w-full text-xs font-mono text-slate-600 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none pb-0.5"
                 />
               </div>

               <button 
                 onClick={() => removeField(field.id)}
                 className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-none"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
             </div>
           ))}
        </div>
      </div>

      <div className="flex-none pt-3 mt-1 border-t border-slate-100">
        <button
          onClick={addField}
          className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Field
        </button>

        {/* Total Length Indicator */}
        <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
          <span>{fields.length} Fields</span>
          <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            Total Width: {fields.reduce((acc, f) => acc + f.length, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SchemaEditor;