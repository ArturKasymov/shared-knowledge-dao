import React from 'react';
import styled from 'styled-components';

const DatabaseItemWrapper = styled.div`
  width: 75%;
  height: max-content;
  border: 2px solid ${({ theme }) => theme.colors.night[300]};
  border-radius: 2px;
  display: flex;
  flex-direction: column;
`;

const Item = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin: auto;

  .id-div {
    height: 45px;
    width: 50px;
    position: relative;
    margin: 12px;
    align-self: center;
    border: 2px solid transparent;
    border-color: #0ae0df;
    border-radius: 50%;
    text-align: center;
    display: inline-block;
    font-size: 2rem;
    /*align-items: center;
    justify-content: space-between;
    top: -6px;
    left: -6px;*/
  }
`;

interface DatabaseItemTemplateProps {
  id: number;
  children: React.ReactNode;
}

const DatabaseItemTemplate = ({ id, children }: DatabaseItemTemplateProps): JSX.Element => (
  <DatabaseItemWrapper>
    <Item>
      <div className="id-div">{id}</div>
      {children}
    </Item>
  </DatabaseItemWrapper>
);

export default DatabaseItemTemplate;
