import { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [notice, setNotice] = useState('');
  const toast = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(''), 4000);
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {notice && <div className="toast">{notice}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
