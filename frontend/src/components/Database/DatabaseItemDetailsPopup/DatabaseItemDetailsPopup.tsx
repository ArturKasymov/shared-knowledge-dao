import React, { useRef, useState } from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea } from 'components/Widgets';

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
        <Label>
          <span>ID:</span> {item.id}
        </Label>
      }
      buttons={
        isBeingModified ? (
          <>
            <Button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" className="primary-btn" onClick={handlePropose}>
              Propose
            </Button>
          </>
        ) : (
          <Button type="button" className="primary-btn" onClick={handleModify}>
            Modify
          </Button>
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
