import React from 'react';
import styled from 'styled-components';

import { ReactComponent as TokenIcon } from 'assets/TokenIcon.svg';

const TokenHolderWrapper = styled.div`
  width: 100%;
  height: max-content;
  border: 2px solid ${({ theme }) => theme.colors.night[300]};
  border-radius: 2px;
  display: flex;
  flex-direction: column;
`;

const Holder = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin: auto;

  .id-div {
    position: relative;
    margin: 12px;
    align-self: center;
    font-size: 2rem;
    /*align-items: center;
    justify-content: space-between;
    top: -6px;
    left: -6px;*/
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 4px;

    .token-icon {
      width: 24px;
      height: 24px;
      transform: translateY(15%);
    }
  }
`;

const Address = styled.h3`
  align-self: center;
  font-weight: 500;
  padding: 20px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  min-height: 60px;
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.night[300]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface TokenHolderProps {
  address: string;
  balance: number;
  displayDetails: (address: string) => void;
}

export default ({ address, balance, displayDetails }: TokenHolderProps): JSX.Element => (
  <TokenHolderWrapper>
    <Holder>
      <div className="id-div">
        <TokenIcon className="token-icon" />
        <span>{balance}</span>
      </div>
      <Address role="presentation" onClick={() => displayDetails(address)}>
        {address}
      </Address>
    </Holder>
  </TokenHolderWrapper>
);
