import { Alert } from '@mui/material';
import { useAlert } from '../../contexts/AlertContext';


// severity: error || warning || info || success
const AlertPopup = () => {
  const { text, type } = useAlert();

  if (text && type) {
    return (
      <Alert
        severity={type}
        variant="filled"
        sx={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          color: 'white',
          zIndex: 10,
          marginBottom: '20px',
          marginLeft: '20px',
        }}
      >
        {text}
      </Alert>
    );
  } else {
    return <></>;
  }
};

export default AlertPopup;
