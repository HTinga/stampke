import { useEffect, useRef } from 'react';
import './TextBoxContextMenu.css';

interface TextBoxContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onProperties: () => void;
}

export function TextBoxContextMenu({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onProperties,
}: TextBoxContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const style: React.CSSProperties = {
    left: x,
    top: y,
  };

  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
      style.left = window.innerWidth - rect.width - 10;
    }
    if (y + rect.height > window.innerHeight) {
      style.top = window.innerHeight - rect.height - 10;
    }
  }

  return (
    <div className="textbox-context-menu" style={style} ref={menuRef}>
      <div className="menu-item" onClick={() => { onEdit(); onClose(); }}>
        <span className="menu-icon">✏️</span>
        <span className="menu-label">Edit Text</span>
        <span className="menu-shortcut">Enter</span>
      </div>
      <div className="menu-item" onClick={() => { onProperties(); onClose(); }}>
        <span className="menu-icon">⚙️</span>
        <span className="menu-label">Properties</span>
      </div>
      <div className="menu-divider" />
      <div className="menu-item" onClick={() => { onDuplicate(); onClose(); }}>
        <span className="menu-icon">📋</span>
        <span className="menu-label">Duplicate</span>
        <span className="menu-shortcut">Ctrl+D</span>
      </div>
      <div className="menu-divider" />
      <div className="menu-item" onClick={() => { onBringToFront(); onClose(); }}>
        <span className="menu-icon">⬆️</span>
        <span className="menu-label">Bring to Front</span>
        <span className="menu-shortcut">]</span>
      </div>
      <div className="menu-item" onClick={() => { onSendToBack(); onClose(); }}>
        <span className="menu-icon">⬇️</span>
        <span className="menu-label">Send to Back</span>
        <span className="menu-shortcut">[</span>
      </div>
      <div className="menu-divider" />
      <div className="menu-item danger" onClick={() => { onDelete(); onClose(); }}>
        <span className="menu-icon">🗑️</span>
        <span className="menu-label">Delete</span>
        <span className="menu-shortcut">Del</span>
      </div>
    </div>
  );
}
