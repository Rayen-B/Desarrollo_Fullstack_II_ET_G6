import React from 'react';

// Logo de X (ex Twitter). Font Awesome 6.0 no lo trae, así que se dibuja como SVG.
// Toma el color y el tamaño del texto que lo rodea, igual que los íconos <i className="fab ...">.
// Ícono de Font Awesome Free 6.7.2 (CC BY 4.0).
export default function IconoX() {
  return (
    <svg viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  );
}
