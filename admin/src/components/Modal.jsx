import { FiX } from 'react-icons/fi';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer = null }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close">
            <FiX size={24} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && (
          <div className="card-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
