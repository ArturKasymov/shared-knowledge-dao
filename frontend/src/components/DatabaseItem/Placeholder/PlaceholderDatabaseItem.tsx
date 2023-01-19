import React from 'react';
import styled from 'styled-components';

import DatabaseItemTemplate from '../Common';

const ItemContent = styled.h3`
  align-self: center;
  font-weight: 500;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  color: ${({ theme }) => theme.colors.night[100]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface PlaceholderDatabaseItemProps {
  id: number;
  onClick: () => void;
}

const PlaceholderDatabaseItem = ({ id, onClick }: PlaceholderDatabaseItemProps): JSX.Element => (
  <DatabaseItemTemplate id={id}>
    <ItemContent role="presentation" onClick={onClick}>
      +PROPOSE
    </ItemContent>
  </DatabaseItemTemplate>
);

const MemoizedPlaceholderDatabaseItem = React.memo(PlaceholderDatabaseItem);

export default MemoizedPlaceholderDatabaseItem;
