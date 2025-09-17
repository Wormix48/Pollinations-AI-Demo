import React, { useState, useEffect, useRef } from 'react';
import type { SavedPrompt } from '../types';
import { EditIcon, DeleteIcon, CheckIcon, AddTextIcon } from './Icons';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPrompt[];
  onUpdate: (prompt: SavedPrompt) => void;
  onDelete: (id: number) => void;
  onUse: (text: string) => void;
  onAppend: (text: string) => void;
}

const PromptItem: React.FC<{
  prompt: SavedPrompt;
  onUpdate: (prompt: SavedPrompt) => void;
  onDelete: (id: number) => void;
  onUse: (text: string) => void;
  onAppend: (text: string) => void;
}> = ({ prompt, onUpdate, onDelete, onUse, onAppend }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(prompt.name);
  const [editedText, setEditedText] = useState(prompt.text);

  const handleSave = () => {
    onUpdate({ ...prompt, name: editedName, text: editedText });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedName(prompt.name);
    setEditedText(prompt.text);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg flex flex-col gap-3">
      {isEditing ? (
        <div className="flex flex-col gap-2">
           <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm font-semibold"
          />
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={3}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm resize-y"
          />
        </div>
      ) : (
        <div>
          <h4 className="font-semibold text-gray-200">{prompt.name}</h4>
          <p className="text-sm text-gray-400 mt-1 break-words">{prompt.text}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-700/50">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="flex-1 text-sm flex items-center justify-center gap-2 text-green-400 hover:text-green-300 p-2 rounded-md hover:bg-green-500/10 transition-colors">
              <CheckIcon className="w-4 h-4" /> Save
            </button>
            <button onClick={handleCancel} className="flex-1 text-sm flex items-center justify-center gap-2 text-gray-400 hover:text-gray-300 p-2 rounded-md hover:bg-gray-500/10 transition-colors">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onUse(prompt.text)} className="flex-1 text-sm text-indigo-300 hover:text-indigo-200 p-2 rounded-md hover:bg-indigo-500/10 transition-colors">
                Use
            </button>
            <button onClick={() => onAppend(prompt.text)} className="flex-1 text-sm flex items-center justify-center gap-1 text-indigo-300 hover:text-indigo-200 p-2 rounded-md hover:bg-indigo-500/10 transition-colors">
                <AddTextIcon className="w-4 h-4" /> Add
            </button>
            <div className="border-l border-gray-700/50 h-6 mx-1"></div>
            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors" title="Edit prompt">
              <EditIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(prompt.id)} className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors" title="Delete prompt">
              <DeleteIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};


export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({ isOpen, onClose, savedPrompts, ...handlers }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-library-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 id="prompt-library-title" className="text-lg font-bold text-white">Prompt Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          {savedPrompts.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>Your library is empty.</p>
              <p className="text-sm mt-1">Save prompts from the main screen to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPrompts.slice().reverse().map(prompt => (
                <PromptItem key={prompt.id} prompt={prompt} {...handlers} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
