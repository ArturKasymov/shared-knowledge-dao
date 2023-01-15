import React from 'react';
import styled from 'styled-components';

const DatabaseItemWrapper = styled.div`
  width: 75%;
  height: max-content;
  border: 2px solid ${({ theme }) => theme.colors.night[300]};
  border-radius: 2px;
  display: flex;
  flex-direction: column;

  h3 {
    align-self: center;
    font-weight: 500;
    padding: 20px;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .database-item-bottom {
    min-height: 60px;
    padding: 10px;
    background-color: ${({ theme }) => theme.colors.night[300]};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  p {
    span {
      font-weight: 700;
    }
  }

  button {
    height: 36px;
    width: max-content;
    color: ${({ theme }) => theme.colors.primaryDarker};
    background: ${({ theme }) => theme.colors.button.secondary};
    border-radius: 18px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8.5px 16px;
    gap: 8px;
    justify-self: end;
    position: relative;
    transition: background-color 0.4s ease, opacity 0.4s ease;
    will-change: background-color, opacity;
    justify-self: center;

    &:hover {
      background: ${({ theme }) => theme.colors.button.secondaryHover};
    }
  }
`;

interface DatabaseItemProps {
  id: number;
  text: string;
  displayFullItem: (id: number) => void;
}

const DatabaseItem = ({ id, text, displayFullItem }: DatabaseItemProps): JSX.Element => (
  <DatabaseItemWrapper className="">
    <h3 role="presentation" className="database-item-bottom" onClick={() => displayFullItem(id)}>
      {text}
    </h3>
  </DatabaseItemWrapper>
);

const MemoizedDatabaseItem = React.memo(DatabaseItem);

export default MemoizedDatabaseItem;
