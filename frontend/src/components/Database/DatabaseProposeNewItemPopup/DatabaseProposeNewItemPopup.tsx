import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { DatabaseItemPopupTemplate } from '../Common';

interface DatabaseProposeNewItemPopupProps {
  onPopupClose: () => void;
  onItemPropose: (text: string) => void;
}

const DatabaseProposeNewItemPopup = ({
  onPopupClose,
  onItemPropose,
}: DatabaseProposeNewItemPopupProps): JSX.Element => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handlePropose = () => {
    if (textAreaRef.current) {
      onItemPropose(textAreaRef.current.value);
    }
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <DatabaseItemPopupTemplate
      textArea={<textarea ref={textAreaRef} />}
      leftBottomText={<span>NEW</span>}
      buttons={
        <>
          <button type="button" className="cancel" onClick={onPopupClose}>
            Cancel
          </button>
          <button type="button" onClick={handlePropose}>
            Propose
          </button>
        </>
      }
      onPopupClose={onPopupClose}
    />
  );
};

export default DatabaseProposeNewItemPopup;
