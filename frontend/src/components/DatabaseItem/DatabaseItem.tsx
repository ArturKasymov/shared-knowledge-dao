import React from 'react';
import styled from 'styled-components';

import DatabaseItemTemplate from './Common';

const ItemContent = styled.h3`
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

interface DatabaseItemProps {
  id: number;
  text: string;
  displayFullItem: (id: number) => void;
}

const DatabaseItem = ({ id, text, displayFullItem }: DatabaseItemProps): JSX.Element => (
  <DatabaseItemTemplate id={id}>
    <ItemContent role="presentation" onClick={() => displayFullItem(id)}>
      {text}
    </ItemContent>
  </DatabaseItemTemplate>
);

const MemoizedDatabaseItem = React.memo(DatabaseItem);

export default MemoizedDatabaseItem;
