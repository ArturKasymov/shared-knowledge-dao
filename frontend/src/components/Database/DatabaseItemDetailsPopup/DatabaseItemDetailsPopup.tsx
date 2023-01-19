import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { DatabaseItem } from 'utils/getDatabaseItem';

import { DatabaseItemPopupTemplate } from '../Common';

interface DatabaseItemDetailsPopupProps {
  item: DatabaseItem;
  onPopupClose: () => void;
  onItemPropose: (id: number, text: string) => void;
}

const DatabaseItemDetailsPopup = ({
  item,
  onPopupClose,
  onItemPropose,
}: DatabaseItemDetailsPopupProps): JSX.Element => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isBeingModified, setIsBeingModified] = useState(false);

  const handleCancel = () => {
    setIsBeingModified(false);
    if (textAreaRef.current) {
      textAreaRef.current.value = item.text;
    }
  };

  const handlePropose = () => {
    setIsBeingModified(false);
    if (textAreaRef.current) {
      onItemPropose(item.id, textAreaRef.current.value);
    }
  };

  const handleModify = () => {
    setIsBeingModified(true);
  };

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <DatabaseItemPopupTemplate
      textArea={
        <textarea
          ref={textAreaRef}
          defaultValue={item.text}
          disabled={!isBeingModified || undefined}
        />
      }
      leftBottomText={
        <>
          <span>ID:</span> {item.id}
        </>
      }
      buttons={
        isBeingModified ? (
          <>
            <button type="button" className="cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" onClick={handlePropose}>
              Propose
            </button>
          </>
        ) : (
          <button type="button" onClick={handleModify}>
            Modify
          </button>
        )
      }
      onPopupClose={onPopupClose}
    />
  );
};

export default DatabaseItemDetailsPopup;
