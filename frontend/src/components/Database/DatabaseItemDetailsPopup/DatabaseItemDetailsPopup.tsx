import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { Button, TextArea } from 'components/Widgets';

import { DatabaseItem } from 'utils/getDatabaseItem';

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
    <PopupTemplate
      leftBottom={
        <p style={{ height: '100%', fontWeight: '60' }}>
          <span>ID:</span> {item.id}
        </p>
      }
      buttons={
        isBeingModified ? (
          <>
            <Button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </Button>
            <button type="button" className="primary-btn" onClick={handlePropose}>
              Propose
            </button>
          </>
        ) : (
          <button type="button" className="primary-btn" onClick={handleModify}>
            Modify
          </button>
        )
      }
      onPopupClose={onPopupClose}
    >
      <TextArea
        ref={textAreaRef}
        defaultValue={item.text}
        disabled={!isBeingModified || undefined}
      />
    </PopupTemplate>
  );
};

export default DatabaseItemDetailsPopup;
