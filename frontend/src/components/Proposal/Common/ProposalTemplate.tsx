import React from 'react';
import styled from 'styled-components';

const ProposalWrapper = styled.div`
  width: 100%;
  height: max-content;
  border: 2px solid ${({ theme }) => theme.colors.night[300]};
  border-radius: 2px;
  display: flex;
  flex-direction: column;

  &:not(.executed) {
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const Proposal = styled.div`
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

interface ProposalTemplateProps {
  action: string;
  isExecuted: boolean;
  children: React.ReactNode;
}

const ProposalTemplate = ({ action, isExecuted, children }: ProposalTemplateProps): JSX.Element => (
  <ProposalWrapper className={isExecuted ? 'executed' : ''}>
    <Proposal>
      <div className="id-div">{action}</div>
      {children}
    </Proposal>
  </ProposalWrapper>
);

export default ProposalTemplate;
