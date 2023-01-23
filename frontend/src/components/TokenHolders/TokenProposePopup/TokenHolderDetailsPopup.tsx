import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { AddressInput, Button, Label, TextArea } from 'components/Widgets';

const AddressInputWrapper = styled.div`
  width: 480px;
`;

interface TokenHolderDetailsPopupProps {
  address: string;
  balance: number;
  onPopupClose: () => void;
  onProposeBurn: (address: string, description: string) => void;
}

export default ({
  address,
  balance,
  onPopupClose,
  onProposeBurn,
}: TokenHolderDetailsPopupProps): JSX.Element => {
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);
  const [isBeingModified, setIsBeingModified] = useState(false);

  const handleCancel = useCallback(() => {
    setIsBeingModified(false);
  }, []);

  const handlePropose = useCallback(() => {
    setIsBeingModified(false);
    if (textAreaDescRef.current) {
      onProposeBurn(address, textAreaDescRef.current.value);
    }
  }, [address, onProposeBurn]);
  
  // TODO: maybe disable propose button when wallet not connected?
  return (
  <PopupTemplate
    leftBottom={
      <Label>
        <span>BALANCE:</span> {balance}
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
          <Button type="button" className="primary-btn" onClick={() => setIsBeingModified(true)}>
            Burn
          </Button>
        )
    }
    onPopupClose={onPopupClose}
  >
    <AddressInputWrapper>
      <AddressInput disabled value={address} valid />
    </AddressInputWrapper>
      {isBeingModified && <>
        <hr/>
        <TextArea
          ref={textAreaDescRef}
          placeholder='Description...'
        />
      </>}
  </PopupTemplate>
  );
};
