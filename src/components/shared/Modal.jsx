export default function Modal({ id, titulo, children, onClose }) {
  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
