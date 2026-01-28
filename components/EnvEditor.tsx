import React, { useState, useRef, useEffect } from 'react';
import { Copy, Download, Maximize2, Minimize2, FileText, X } from 'lucide-react';

interface EnvEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

// Função para fazer syntax highlighting do conteúdo .env
const highlightEnvContent = (content: string): React.ReactNode[] => {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    // Linha de comentário
    if (line.trim().startsWith('#')) {
      return (
        <div key={index} className="text-neutral-500 italic">
          {line}
        </div>
      );
    }

    // Linha vazia
    if (line.trim() === '') {
      return <div key={index} className="h-4">&nbsp;</div>;
    }

    // Linha com variável=valor
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const varName = line.substring(0, equalIndex);
      const varValue = line.substring(equalIndex + 1);

      // Detectar tipo de valor para colorir diferente
      let valueClass = 'text-green-400'; // String padrão

      // Número
      if (/^\d+$/.test(varValue.trim())) {
        valueClass = 'text-blue-400';
      }
      // Boolean
      else if (/^(true|false)$/i.test(varValue.trim())) {
        valueClass = 'text-purple-400';
      }
      // URL
      else if (/^https?:\/\//.test(varValue.trim())) {
        valueClass = 'text-cyan-400';
      }
      // Variável vazia
      else if (varValue.trim() === '') {
        valueClass = 'text-neutral-600';
      }
      // Valor entre aspas
      else if (/^["'].*["']$/.test(varValue.trim())) {
        valueClass = 'text-yellow-400';
      }

      return (
        <div key={index}>
          <span className="text-orange-400 font-semibold">{varName}</span>
          <span className="text-neutral-500">=</span>
          <span className={valueClass}>{varValue || <span className="text-neutral-600 italic">empty</span>}</span>
        </div>
      );
    }

    // Linha inválida ou outro formato
    return (
      <div key={index} className="text-red-400">
        {line}
      </div>
    );
  });
};

const EnvEditor: React.FC<EnvEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Cole aqui o conteúdo do arquivo .env...'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Copiar para clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  // Download como arquivo .env
  const downloadAsFile = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sincronizar scroll entre textarea e preview
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (previewRef.current) {
      previewRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Modal expandido
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[80vh] bg-neutral-900 rounded-xl border border-neutral-700 flex flex-col overflow-hidden">
          {/* Header do modal */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-white">
              <FileText size={20} className="text-lime-500" />
              <span className="font-bold">Editor .env</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-700 flex items-center gap-2"
                title="Copiar conteúdo"
              >
                <Copy size={14} />
                Copiar
              </button>
              <button
                onClick={downloadAsFile}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-700 flex items-center gap-2"
                title="Baixar como arquivo .env"
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Área de edição expandida */}
          <div className="flex-1 overflow-hidden relative">
            {readOnly ? (
              // Modo somente leitura com syntax highlighting
              <div className="absolute inset-0 p-4 overflow-auto font-mono text-sm leading-6">
                {highlightEnvContent(value)}
              </div>
            ) : (
              // Modo edição
              <div className="absolute inset-0 flex">
                {/* Preview com syntax highlighting */}
                <div
                  ref={previewRef}
                  className="absolute inset-0 p-4 overflow-auto font-mono text-sm leading-6 pointer-events-none"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {showPreview && highlightEnvContent(value)}
                </div>
                {/* Textarea transparente por cima */}
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange?.(e.target.value)}
                  onScroll={handleScroll}
                  onFocus={() => setShowPreview(false)}
                  onBlur={() => setShowPreview(true)}
                  placeholder={placeholder}
                  className="absolute inset-0 w-full h-full p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none focus:outline-none placeholder-neutral-600"
                  style={{
                    caretColor: '#84cc16',
                    color: showPreview ? 'transparent' : 'white'
                  }}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Legenda de cores */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-400"></span>
                <span className="text-neutral-400">Variável</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-400"></span>
                <span className="text-neutral-400">String</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-400"></span>
                <span className="text-neutral-400">Número</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-cyan-400"></span>
                <span className="text-neutral-400">URL</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-purple-400"></span>
                <span className="text-neutral-400">Boolean</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400"></span>
                <span className="text-neutral-400">Aspas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-neutral-500"></span>
                <span className="text-neutral-400">Comentário</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo compacto (inline)
  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-400">
          <FileText size={14} />
          Arquivo .env
        </label>
        <div className="flex items-center gap-1">
          {value && (
            <>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-1.5 text-neutral-500 hover:text-lime-500 transition-colors"
                title="Copiar conteúdo"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={downloadAsFile}
                className="p-1.5 text-neutral-500 hover:text-lime-500 transition-colors"
                title="Baixar como .env"
              >
                <Download size={14} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 text-neutral-500 hover:text-lime-500 transition-colors"
            title="Expandir editor"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Editor compacto */}
      <div className="relative rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
        {readOnly ? (
          // Modo somente leitura
          <div className="p-3 font-mono text-xs leading-5 max-h-48 overflow-auto">
            {value ? highlightEnvContent(value) : (
              <span className="text-neutral-600 italic">Nenhum conteúdo .env</span>
            )}
          </div>
        ) : (
          // Modo edição
          <div className="relative">
            {/* Preview com syntax highlighting (atrás) */}
            <div
              ref={previewRef}
              className="absolute inset-0 p-3 font-mono text-xs leading-5 overflow-auto pointer-events-none"
              style={{ minHeight: '150px' }}
            >
              {showPreview && value && highlightEnvContent(value)}
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onScroll={handleScroll}
              onFocus={() => setShowPreview(false)}
              onBlur={() => setShowPreview(true)}
              placeholder={placeholder}
              className="relative w-full p-3 bg-transparent font-mono text-xs leading-5 resize-none focus:outline-none focus:ring-1 focus:ring-lime-500 placeholder-neutral-600"
              style={{
                minHeight: '150px',
                caretColor: '#84cc16',
                color: showPreview && value ? 'transparent' : 'white'
              }}
              spellCheck={false}
              rows={6}
            />
          </div>
        )}
      </div>

      {/* Dica */}
      {!readOnly && (
        <p className="text-xs text-neutral-500 mt-1">
          Cole o conteúdo do .env • Clique no ícone de expandir para editar em tela cheia
        </p>
      )}
    </div>
  );
};

export default EnvEditor;
