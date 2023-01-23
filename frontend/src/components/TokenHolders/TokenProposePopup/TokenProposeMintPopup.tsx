import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import PopupTemplate from 'components/PopupTemplate';
import { AddressInput, Button, Label, TextArea } from 'components/Widgets';

import checkIfAddressIsValid from 'utils/checkIfAddressIsValid';

const AddressInputWrapper = styled.div`
  min-width: 480px;
  width: 100%;
`;

interface TokenProposeMintPopupProps {
  onPopupClose: () => void;
  onPropose: (address: string, description: string) => void;
}

const TokenProposeMintPopup = ({
  onPopupClose,
  onPropose,
}: TokenProposeMintPopupProps): JSX.Element => {
  const [address, setAddress] = useState('');
  const textAreaDescRef = useRef<HTMLTextAreaElement>(null);

  const isAddressValid = useCallback(() => checkIfAddressIsValid(address), [address]);

  const handlePropose = useCallback(() => {
    if (textAreaDescRef.current) {
      onPropose(address, textAreaDescRef.current.value);
    }
  }, [address, onPropose]);

  // TODO: maybe disable propose button when wallet not connected?
  return (
    <PopupTemplate
      leftBottom={
        <Label>
          <span>MINT</span>
        </Label>
      }
      buttons={
        <>
          <Button type="button" className="cancel-btn" onClick={onPopupClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePropose} disabled={!isAddressValid()}>
            Propose
          </Button>
        </>
      }
      onPopupClose={onPopupClose}
    >
      <AddressInputWrapper>
        <AddressInput valid={isAddressValid()} onInputChange={setAddress} />
      </AddressInputWrapper>
      <hr/>
      <TextArea ref={textAreaDescRef} placeholder='Description...' />
    </PopupTemplate>
  );
};

export default TokenProposeMintPopup;
