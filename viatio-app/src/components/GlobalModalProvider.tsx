/**
 * GLOBAL MODAL PROVIDER
 *
 * Proveedor global para manejar modales desde cualquier parte de la app.
 * Se suscribe a eventos de toast.ts y muestra el CustomModal correspondiente.
 */

import React, { useEffect, useState } from 'react';
import { CustomModal } from './CustomModal';
import { subscribeToModal, ModalEvent } from '@/utils/toast';

export const GlobalModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modalConfig, setModalConfig] = useState<ModalEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToModal((event) => {
      setModalConfig(event);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    setModalConfig(null);
  };

  return (
    <>
      {children}
      {modalConfig && (
        <CustomModal
          visible={true}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={handleClose}
          primaryButton={modalConfig.primaryButton}
          secondaryButton={modalConfig.secondaryButton}
        />
      )}
    </>
  );
};
