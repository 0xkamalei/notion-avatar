import { useState } from 'react';

export const useModalStates = <T extends Record<string, unknown>>(
  modalKeyMap: T,
) => {
  const initModalStates = (Object.keys(modalKeyMap) as Array<keyof T>).reduce(
    (prev, cur) => ({ ...prev, [cur]: false }),
    {} as Record<keyof T, boolean>,
  );
  const [modalStates, setModalStates] = useState(initModalStates);

  const toggleModal = (key: keyof T) => {
    setModalStates({ ...initModalStates, [key]: !modalStates[key] });
  };

  return { modalStates, toggleModal };
};
