import { createContext, useState } from 'react';

const ALERT_TIME = 3000;
const initialState = {
  text: '',
  type: '',
};

export const AlertContext = createContext({
  ...initialState,
  setAlert: () => {},
});

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(initialState);

  const showAlert = (text, type) => {
    setAlert({ text, type });

    setTimeout(() => {
      setAlert(initialState);
    }, ALERT_TIME);
  };

  return (
    <AlertContext.Provider
      value={{
        ...alert,
        setAlert: showAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};