import { useState, useEffect } from 'preact/hooks';

const API_BASE = 'http://localhost:3456/api';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

interface FileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (paths: string[]) => void;
  multiple?: boolean;
}

export function FileBrowser({ isOpen, onClose, onSelect, multiple = true }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !currentPath) {
      // Start from current working directory
      fetchCwd();
    }
  }, [isOpen]);

  const fetchCwd = async () => {
    try {
      const res = await fetch(`${API_BASE}/fs/cwd`);
      const data = await res.json();
      loadDirectory(data.path);
    } catch (err) {
      setError('作業ディレクトリの取得に失敗しました');
    }
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/fs/list?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ディレクトリの読み込みに失敗しました');
      }
      const data = await res.json();
      setCurrentPath(data.path);
      setParentPath(data.parent);
      setEntries(data.entries);
      setSelectedPaths(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.isDirectory) {
      loadDirectory(entry.path);
    } else {
      // Toggle file selection
      setSelectedPaths(prev => {
        const next = new Set(prev);
        if (next.has(entry.path)) {
          next.delete(entry.path);
        } else {
          if (!multiple) {
            next.clear();
          }
          next.add(entry.path);
        }
        return next;
      });
    }
  };

  const handleGoUp = () => {
    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  const handleGoHome = async () => {
    try {
      const res = await fetch(`${API_BASE}/fs/home`);
      const data = await res.json();
      loadDirectory(data.path);
    } catch (err) {
      setError('ホームディレクトリの取得に失敗しました');
    }
  };

  const handleConfirm = () => {
    if (selectedPaths.size > 0) {
      onSelect(Array.from(selectedPaths));
      setSelectedPaths(new Set());
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedPaths(new Set());
    onClose();
  };

  const formatSize = (size?: number) => {
    if (size === undefined) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div class="file-browser-overlay" onClick={handleCancel}>
      <div class="file-browser" onClick={(e) => e.stopPropagation()}>
        <div class="file-browser-header">
          <h3>ファイルを選択</h3>
          <button class="btn-close" onClick={handleCancel}>×</button>
        </div>

        <div class="file-browser-toolbar">
          <button onClick={handleGoUp} disabled={!parentPath} title="上へ">
            ⬆️
          </button>
          <button onClick={handleGoHome} title="ホーム">
            🏠
          </button>
          <button onClick={() => loadDirectory(currentPath)} title="更新">
            🔄
          </button>
          <span class="current-path" title={currentPath}>
            {currentPath}
          </span>
        </div>

        <div class="file-browser-content">
          {loading && <div class="file-browser-loading">読み込み中...</div>}
          {error && <div class="file-browser-error">{error}</div>}
          {!loading && !error && entries.length === 0 && (
            <div class="file-browser-empty">ファイルがありません</div>
          )}
          {!loading && !error && entries.map((entry) => (
            <div
              key={entry.path}
              class={`file-entry ${entry.isDirectory ? 'is-directory' : ''} ${selectedPaths.has(entry.path) ? 'selected' : ''}`}
              onClick={() => handleEntryClick(entry)}
            >
              <span class="file-icon">
                {entry.isDirectory ? '📁' : '📄'}
              </span>
              <span class="file-name">{entry.name}</span>
              {!entry.isDirectory && entry.size !== undefined && (
                <span class="file-size">{formatSize(entry.size)}</span>
              )}
            </div>
          ))}
        </div>

        <div class="file-browser-footer">
          <span class="selected-count">
            {selectedPaths.size > 0 ? `${selectedPaths.size}件選択中` : ''}
          </span>
          <div class="file-browser-actions">
            <button class="btn-cancel" onClick={handleCancel}>
              キャンセル
            </button>
            <button
              class="btn-confirm"
              onClick={handleConfirm}
              disabled={selectedPaths.size === 0}
            >
              選択
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
