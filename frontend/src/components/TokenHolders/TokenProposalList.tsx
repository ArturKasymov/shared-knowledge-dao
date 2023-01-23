import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';

import { ProposalToken } from 'components/Proposal';
import { displayErrorToast } from 'components/NotificationToast';
import ToggleSwitch from 'components/ToggleSwitch';
import SmoothOptional from 'components/SmoothOptional';
import PlaceholderProposal from 'components/Proposal/Placeholder';

import { proposeMint as proposeMintToken } from 'utils/proposeToken';
import { ErrorToastMessages } from 'shared/constants';
import { RootState } from 'redux/store';
import {
  setAllProposals,
  setSelfVoteWeight,
  onProposed as addProposal,
  onVoted as updateProposalSelfVoted,
  onExecuted as updateProposalExecuted,
} from 'redux/slices/proposalsSlice';
import { queries } from 'shared/layout';
import { getProposalsIds } from 'utils/getProposalsIds';
import { getProposal } from 'utils/getProposal';
import { getVoteWeight } from 'utils/getVoteWeight';
import {
  isQuorumReached,
  isActive as isActiveProposal,
  isTokenProposal,
  newMintProposal,
  Proposal as ProposalModel,
  ProposalToken as ProposalTokenModel,
} from 'utils/model/proposal';
import { voteForProposal } from 'utils/voteGovernor';
import { executeProposal } from 'utils/executeGovernor';

import { ProposalTokenDetailsPopup } from './ProposalDetailsPopup';
import TokenProposeMintPopup from './TokenProposePopup';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 4%;

  .toggle-switch-wrapper {
    width: 100%;
    position: fixed;
    top: 480px;
    left: 60px;
  }
`;

const ProposalsContainer = styled.div`
  width: 75%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  z-index: 10;

  ${queries.tablet} {
  }
`;

interface TokenProposalListProps {
  api: ApiPromise | null;
}

const TokenProposalList = ({ api }: TokenProposalListProps): JSX.Element => {
  const [proposals, setProposals] = useState<ProposalModel[]>([]);
  const dispatch = useDispatch();
  const loggedAccount = useSelector((state: RootState) => state.walletAccounts.account);
  const testProposals = useSelector((state: RootState) => state.proposals.proposals).filter(
    isTokenProposal
  );
  const [showInactiveProposals, setShowInactiveProposals] = useState(false);
  const [proposalDetailsDisplay, setProposalDetailsDisplay] = useState<ProposalTokenModel | null>(
    null
  );
  const [proposeTokenDisplay, setProposeTokenDisplay] = useState(false);

  const getAllProposalsIds = useCallback(async () => api && getProposalsIds(api), [api]);
  const getProposalById = useCallback(
    async (id: number) => api && getProposal(id, loggedAccount, api),
    [loggedAccount, api]
  );

  const getSelfVoteWeight = useCallback(
    async () => api && loggedAccount && getVoteWeight(loggedAccount.address, api),
    [loggedAccount, api]
  );

  useEffect(() => {
    const getProposals = async () => {
      const ids = await getAllProposalsIds();
      const allProposals = ids?.map(async (id) => getProposalById(id));
      if (allProposals) {
        Promise.all(allProposals).then((p) => p && setProposals(p as ProposalModel[]));
      }
    };
    getProposals();
  }, [getAllProposalsIds, getProposalById]);

  useEffect(() => {
    dispatch(setAllProposals(proposals));
  }, [proposals, dispatch]);

  useEffect(() => {
    (async () => {
      const selfVoteWeight = await getSelfVoteWeight();
      dispatch(setSelfVoteWeight(selfVoteWeight));
    })();
  }, [getSelfVoteWeight, dispatch]);

  const handleVote = (proposalId: number, isFor: boolean) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      voteForProposal(proposalId, isFor, loggedAccount, api).then(() => {
        setProposalDetailsDisplay(null);
        dispatch(updateProposalSelfVoted(proposalId));
      });
    }
  };

  const handleExecute = (proposalId: number) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      executeProposal(proposalId, loggedAccount, api).then(() => {
        setProposalDetailsDisplay(null);
        dispatch(updateProposalExecuted(proposalId));
      });
    }
  };

  const handleProposeMint = (recipientAddress: string, description: string) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      proposeMintToken(recipientAddress, description, loggedAccount, api, (proposalId) =>
        dispatch(addProposal(newMintProposal(proposalId, recipientAddress, description)))
      ).then(() => setProposeTokenDisplay(false));
    }
  };

  const displayProposalDetails = (id: number) => {
    // TODO: is it efficient to use testProposals here?
    const proposalToBeDisplayed = testProposals.find((proposal) => proposal.id === id);
    if (!proposalToBeDisplayed) return;
    setProposalDetailsDisplay(proposalToBeDisplayed);
  };

  const proposalToReactNode = (proposal: ProposalTokenModel) => (
    <ProposalToken
      key={proposal.id}
      id={proposal.id}
      action={proposal.kind === 'tokenMint' ? 'Mint' : 'Burn'}
      accountAddress={proposal.kind === 'tokenMint' ? proposal.recipient : proposal.holder}
      isActive={isActiveProposal(proposal)}
      displayDetails={displayProposalDetails}
    />
  );

  const proposalToPopup = (proposal: ProposalTokenModel) => {
    const canVote = !!loggedAccount && !proposal.hasSelfVoted;
    const canExecute = !!loggedAccount && !proposal.executed && isQuorumReached(proposal);
    const accountAddress = proposal.kind === 'tokenMint' ? proposal.recipient : proposal.holder;
    return (
      <ProposalTokenDetailsPopup
        id={proposal.id}
        action={proposal.kind === 'tokenMint' ? 'Mint' : 'Burn'}
        accountAddress={accountAddress}
        description={proposal.description}
        votes={proposal.votes}
        voteDeadline={new Date(proposal.voteEnd)}
        canVote={canVote}
        canExecute={canExecute}
        onPopupClose={() => setProposalDetailsDisplay(null)}
        onVote={handleVote}
        onExecute={handleExecute}
      />
    );
  };

  return (
    <>
      <>
        {proposeTokenDisplay && (
          <TokenProposeMintPopup
            onPopupClose={() => setProposeTokenDisplay(false)}
            onPropose={handleProposeMint}
          />
        )}
        {proposalDetailsDisplay && proposalToPopup(proposalDetailsDisplay)}
      </>
      <Wrapper>
        <div className="toggle-switch-wrapper">
          <ToggleSwitch checked={showInactiveProposals} onChange={setShowInactiveProposals} />
        </div>
        <ProposalsContainer>
          {testProposals.map((p) => (
            <SmoothOptional key={p.id} show={showInactiveProposals || isActiveProposal(p)}>
              {proposalToReactNode(p)}
            </SmoothOptional>
          ))}
          <PlaceholderProposal action="M" onClick={() => setProposeTokenDisplay(true)} />
        </ProposalsContainer>
      </Wrapper>
    </>
  );
};

export default TokenProposalList;
