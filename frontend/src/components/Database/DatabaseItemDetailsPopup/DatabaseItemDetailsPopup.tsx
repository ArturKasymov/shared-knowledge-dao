import React, { useRef, useState } from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label, TextArea } from 'components/Widgets';

import { DatabaseItem } from 'utils/getDatabaseItem';

interface DatabaseItemDetailsPopupProps {
  item: DatabaseItem;
  onPopupClose: () => void;
  onItemPropose: (id: number, text: string, description: string) => void;
}

const DatabaseItemDetailsPopup = ({
  item,
  onPopupClose,
  onItemPropose,
}: DatabaseItemDetailsPopupProps): JSX.Element => {
  const textAreaItemRef = useRef<HTMLTextAreaElement>(null);
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);

  const [isBeingModified, setIsBeingModified] = useState(false);

  const handleCancel = () => {
    setIsBeingModified(false);
    if (textAreaItemRef.current) {
      textAreaItemRef.current.value = item.text;
    }
  };

  const handlePropose = () => {
    setIsBeingModified(false);
    if (textAreaItemRef.current && textAreaDescRef.current) {
      onItemPropose(item.id, textAreaItemRef.current.value, textAreaDescRef.current.value);
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
        ref={textAreaItemRef}
        defaultValue={item.text}
        disabled={!isBeingModified || undefined}
      />
      {isBeingModified && (
        <>
          <hr />
          <TextArea ref={textAreaDescRef} placeholder="Description..." />
        </>
      )}
    </PopupTemplate>
  );
};

export default DatabaseItemDetailsPopup;
