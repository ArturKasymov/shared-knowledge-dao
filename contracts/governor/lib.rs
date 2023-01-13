#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod governor {

    use database::database::{
        DatabaseContractRef,
    };
    
    use ink_env::{
        call::FromAccountId,
        Error as InkEnvError,
    };
    use ink_lang::{
        codegen::EmitEvent, reflect::ContractEventBase,
        utils::initialize_contract, ToAccountId,
    };
    use ink_prelude::{format, string::String};
    use ink_storage::{
        traits::{PackedLayout, SpreadLayout, SpreadAllocate},
        Mapping,
    };

    use openbrush::contracts::traits::psp22::*;

    use nameof::name_of_type;

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum GovernorError {
        ProposalNotFound,
        ProposalAlreadyExecuted,
        AlreadyVoted,
        QuorumNotReached,
        InkEnvError(String),
    }

    impl From<InkEnvError> for GovernorError {
        fn from(e: InkEnvError) -> Self {
            GovernorError::InkEnvError(format!("{:?}", e))
        }
    }

    type Event = <GovernorContract as ContractEventBase>::Type;

    #[derive(Default, Debug, PartialEq, Eq, PackedLayout, SpreadLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Proposal {
        item: String,
        executed: bool,
    }

    // range(0, 100)
    pub type Percentage = u8;
    
    #[derive(Default, Debug, PartialEq, Eq, PackedLayout, SpreadLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ProposalVote {
        for_votes: Percentage,
    }

    pub type ProposalId = u32;

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct GovernorContract {
        proposal_votes: Mapping<ProposalId, ProposalVote>,
        proposals: Mapping<ProposalId, Proposal>,
        votes: Mapping<(ProposalId, AccountId), ()>,
        next_proposal_id: u32,
        quorum: Percentage,
        token_contract: Option<AccountId>,
        database_contract: Option<AccountId>,
    }

    impl GovernorContract {
        #[ink(constructor)]
        pub fn new(version: u8, quorum: Percentage, token_contract: AccountId, database_hash: Hash) -> Self {
            let database_ref = DatabaseContractRef::new()
                .code_hash(database_hash)
                .salt_bytes([version.to_le_bytes().as_ref(), Self::env().caller().as_ref()].concat())
                .endowment(0)
                .instantiate()
                .unwrap_or_else(|error| {
                    panic!("failed to instantiate the {} contract: {:?}", name_of_type!(database::database::DatabaseContract), error)
                });
            let database_contract = <DatabaseContractRef as ToAccountId<super::governor::Environment>>::to_account_id(&database_ref);

            initialize_contract(|instance: &mut Self| {
                instance.quorum = num::clamp(quorum, 0, 100);
                instance.token_contract = Some(token_contract);
                instance.database_contract = Some(database_contract);
            })
        }

        // For use in tests:
        // doesn't call TokenContract and DatabaseContract
        #[ink(constructor)]
        pub fn test(quorum: Percentage) -> Self {
            initialize_contract(|instance: &mut Self| {
                instance.quorum = num::clamp(quorum, 0, 100);
                instance.token_contract = None;
                instance.database_contract = None;
            })
        }

        // Propose a new item to the database
        #[ink(message)]
        pub fn propose(&mut self, item: String) -> Result<ProposalId, GovernorError> {
            let proposal = Proposal {
                item,
                executed: false,
            };

            let id = self.next_proposal_id();
            self.proposals.insert(id, &proposal);

            Ok(id)
        }

        // Vote "for" this proposal
        // Not voting is equivalent to "against", for now
        #[ink(message)]
        pub fn vote(&mut self, proposal_id: ProposalId) -> Result<(), GovernorError> {
            let caller = self.env().caller();
            let proposal = self.proposals.get(&proposal_id).ok_or(GovernorError::ProposalNotFound)?;
            if proposal.executed {
                return Err(GovernorError::ProposalAlreadyExecuted)
            }
            
            if self.votes.get(&(proposal_id, caller)).is_some() {
                return Err(GovernorError::AlreadyVoted)
            }

            self.votes.insert(&(proposal_id, caller), &());

            let weight = self.account_weight(caller);
            let mut proposal_vote = self.proposal_votes.get(proposal_id).unwrap_or_default();
            proposal_vote.for_votes += weight;
            self.proposal_votes.insert(&proposal_id, &proposal_vote);
            Ok(())
        }

        #[ink(message)]
        pub fn execute(&mut self, proposal_id: ProposalId) -> Result<(), GovernorError> {
            let mut proposal = self.proposals.get(&proposal_id).ok_or(GovernorError::ProposalNotFound)?;
            if proposal.executed {
                return Err(GovernorError::ProposalAlreadyExecuted);
            }

            let proposal_vote = self.proposal_votes.get(proposal_id).unwrap_or_default();
            if proposal_vote.for_votes < self.quorum {
                return Err(GovernorError::QuorumNotReached)
            }

            self._execute(&proposal)?;
            proposal.executed = true;
            self.proposals.insert(&proposal_id, &proposal);

            Ok(())
        }

        #[ink(message)]
        pub fn get_proposal_vote(&self, proposal_id: ProposalId) -> Option<ProposalVote> {
            self.proposal_votes.get(proposal_id)
        }

        #[ink(message)]
        pub fn get_proposal(&self, proposal_id: ProposalId) -> Option<Proposal> {
            self.proposals.get(proposal_id)
        }

        #[ink(message)]
        pub fn has_voted(&self, proposal_id: ProposalId, account_id: AccountId) -> bool {
            self.votes.get(&(proposal_id, account_id)).is_some()
        }

        fn _execute(&self, proposal: &Proposal) -> Result<(), GovernorError> {
            if let Some(database_contract) = self.database_contract {
                <DatabaseContractRef as FromAccountId<super::governor::Environment>>
                    ::from_account_id(database_contract)
                    .add_item(proposal.item.clone());
                Ok(())
            } else {
                Ok(())
            }
        }

        fn account_weight(&self, caller: AccountId) -> Percentage {
            if let Some(token_contract) = self.token_contract {
                let balance = PSP22Ref::balance_of(&token_contract, caller);
                let total_supply = PSP22Ref::total_supply(&token_contract);
                (balance * 100 / total_supply) as Percentage
            } else {
                // just set 50% to every vote in tests
                50 as Percentage
            }
        }

        fn next_proposal_id(&mut self) -> ProposalId {
            let id = self.next_proposal_id;
            self.next_proposal_id += 1;
            id
        }

        //fn emit_event<EE>(emitter: EE, event: Event) where EE: EmitEvent<GovernorContract> {
        //    emitter.emit_event(event);
        //}
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        
        use ink_lang as ink;

        use ink_env::test::{
            default_accounts, recorded_events,
            DefaultAccounts, EmittedEvent,
        };
        use scale::Decode;

        #[ink::test]
        fn constructor_works() {
            let governor = GovernorContract::test(75);
            assert_eq!(governor.quorum, 75);
        }

        #[ink::test]
        fn propose_works() {
            let mut governor = GovernorContract::test(75);
            assert_eq!(governor.propose("test".to_string()), Ok(0));
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                item: "test".to_string(),
                executed: false,
            }));
        }
        
        #[ink::test]
        fn vote_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75);
            governor.propose("test".to_string()).ok();
            set_caller(alice);
            assert!(governor.vote(0).is_ok(), "voting was expected to succeed");
            assert!(governor.has_voted(0, alice), "Alice was expected to have voted");
            assert_eq!(governor.get_proposal_vote(0), Some(ProposalVote { for_votes: 50 }));
        }

        #[ink::test]
        fn vote_wrong_proposal_id_fails() {
            let mut governor = GovernorContract::test(75);
            assert_eq!(governor.vote(0), Result::Err(GovernorError::ProposalNotFound));
        }

        #[ink::test]
        fn vote_double_vote_fails() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75);
            governor.propose("test".to_string()).ok();
            set_caller(alice);
            governor.vote(0).ok();
            assert_eq!(governor.vote(0), Result::Err(GovernorError::AlreadyVoted));
        }

        #[ink::test]
        fn vote_for_executed_proposal_fails() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75);
            governor.propose("test".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0).ok();
            set_caller(accounts.bob);
            governor.vote(0).ok();
            governor.execute(0).ok();
            assert_eq!(governor.vote(0), Result::Err(GovernorError::ProposalAlreadyExecuted));
        }
        
        #[ink::test]
        fn execute_works() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75);
            governor.propose("test".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0).ok();
            set_caller(accounts.bob);
            governor.vote(0).ok();
            assert!(governor.execute(0).is_ok(), "executing a proposal was expected to succeed");
            assert_eq!(governor.get_proposal_vote(0), Some(ProposalVote { for_votes: 100 }));
            assert!(governor.get_proposal(0).unwrap().executed, "Proposal was expected to change execution status");
        }

        #[ink::test]
        fn execute_wrong_proposal_id_fails() {
            let mut governor = GovernorContract::test(75);
            assert_eq!(governor.execute(0), Result::Err(GovernorError::ProposalNotFound));
        }

        #[ink::test]
        fn execute_no_quorum_fails() {
           let alice = get_default_test_accounts().alice;
           let mut governor = GovernorContract::test(75);
           governor.propose("test".to_string()).ok();
           set_caller(alice);
           governor.vote(0).ok();
           assert_eq!(governor.execute(0), Result::Err(GovernorError::QuorumNotReached));
        }

        #[ink::test]
        fn execute_executed_proposal_fails() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75);
            governor.propose("test".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0).ok();
            set_caller(accounts.bob);
            governor.vote(0).ok();
            governor.execute(0).ok();
            assert_eq!(governor.execute(0), Result::Err(GovernorError::ProposalAlreadyExecuted));
        }

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        } 
    }
}
