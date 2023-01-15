import React from 'react';
import styled from 'styled-components';

import { DatabaseItem } from 'utils/getDatabaseItem';

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.backgroundDimmed};
  z-index: 3000;

  display: flex;
  justify-content: center;
  align-items: center;

  .database-item-details {
    background-color: ${({ theme }) => theme.colors.background};
    min-width: 400px;
    max-width: 1200px;
    max-height: 400px;
    overflow-wrap: break-word;
    box-shadow: ${({ theme }) => theme.colors.nightShadow};

    h3 {
      align-self: center;
      font-weight: 500;
      padding: 20px;
      width: 100%;
    }
  }

  .database-item-bottom {
    padding: 20px;
    background-color: ${({ theme }) => theme.colors.night[300]};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const DatabaseItemDetailsPopup = ({
  item,
  onPopupClose,
}: {
  item: DatabaseItem;
  onPopupClose: () => void;
}): JSX.Element => (
  <Wrapper id="database-item-details-popup-bg" role="presentation" onClick={onPopupClose}>
    <div className="database-item-details" role="presentation">
      <h3>{item.text}</h3>
      <div className="database-item-bottom">
        <p>
          <span>id:</span> {item.id}
        </p>
      </div>
    </div>
  </Wrapper>
);

export default DatabaseItemDetailsPopup;
