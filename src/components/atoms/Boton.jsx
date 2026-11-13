import React from 'react';
import { Button } from 'react-bootstrap';

export default function Boton({ children, variant = 'primary', size, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      type={type}
      className={className}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
