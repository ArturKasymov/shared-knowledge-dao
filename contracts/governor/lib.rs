#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod governor {
    use token::token::TokenContractRef;
    use database::database::{
        DatabaseContractRef,
        ItemId, DatabaseError,
    };

    use ink_env::{
        call::{
            ExecutionInput,
            FromAccountId,
            state::Salt,
            utils::{Set, Unset},
        },
        Error as InkEnvError,
    };
    use ink_lang::{
        codegen::EmitEvent, reflect::ContractEventBase,
        utils::initialize_contract, ToAccountId,
    };
    use ink_prelude::{format, string::String, vec::Vec};
    use ink_storage::{
        traits::{PackedLayout, SpreadLayout, SpreadAllocate},
        Mapping,
    };

    use openbrush::contracts::traits::psp34::*;

    /********** ERRORS **********/

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum GovernorError {
        ProposalNotFound,
        ProposalAlreadyExecuted,
        /// Active Modify proposal for item with given ID already exists
        ActiveProposalForItemExists(ProposalId),
        /// Active Mint/Burn proposal for given account already exists
        ActiveProposalForAccountExists(ProposalId),
        /// This account has already voted for given proposal
        AlreadyVoted,
        QuorumNotReached,
        VotePeriodEnded,
        /// Caller required to possess a token for some operations (e.g. vote)
        TokenOwnershipRequired,
        /// Payable proposals require a minimum transferred value
        InsufficientTransferQuota,
        TokenError(PSP34Error),
        DatabaseError(DatabaseError),
        InkEnvError(String),
    }

    impl From<PSP34Error> for GovernorError {
        fn from(e: PSP34Error) -> Self {
            GovernorError::TokenError(e)
        }
    }

    impl From<DatabaseError> for GovernorError {
        fn from(e: DatabaseError) -> Self {
            GovernorError::DatabaseError(e)
        }
    }

    impl From<InkEnvError> for GovernorError {
        fn from(e: InkEnvError) -> Self {
            GovernorError::InkEnvError(format!("{:?}", e))
        }
    }

    /********** STORAGE **********/
    
    #[derive(Default, Debug, PartialEq, Eq, SpreadLayout, PackedLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ProposalDatabaseKind {
        #[default]
        Add,
        Modify(ItemId),
    }

    #[derive(Debug, PartialEq, Eq, SpreadLayout, PackedLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ProposalTokenKind {
        Mint(AccountId),
        Burn(AccountId),
    }

    #[derive(Debug, PartialEq, Eq, SpreadLayout, PackedLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ProposalCategory {
        Token(ProposalTokenKind),
        Database {
            kind: ProposalDatabaseKind,
            item: String,
        },
    }

    impl Default for ProposalTokenKind {
        fn default() -> Self {
            ProposalTokenKind::Mint(AccountId::default())
        }
    }

    impl Default for ProposalCategory {
        fn default() -> Self {
            Self::Token(ProposalTokenKind::default())
        }
    }

    // 1min in Timestamp units (ms) 
    const ONE_MINUTE: u64 = 60 * 1000;

    #[derive(Default, Debug, PartialEq, Eq, PackedLayout, SpreadLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Proposal {
        category: ProposalCategory,
        /// Voting goes on until this time
        vote_end: Timestamp,
        executed: bool,
        description: String,
    }

    // A few constructors for convenience
    impl Proposal {
        fn token_mint(recipient: AccountId, description: String, vote_end: Timestamp) -> Self {
            Proposal {
                category: ProposalCategory::Token(
                    ProposalTokenKind::Mint(recipient),
                ),
                vote_end,
                executed: false,
                description,
            }
        }
        
        fn token_burn(holder: AccountId, description: String, vote_end: Timestamp) -> Self {
            Proposal {
                category: ProposalCategory::Token(
                    ProposalTokenKind::Burn(holder),
                ),
                vote_end,
                executed: false,
                description,
            }
        }

        fn item_add(item: String, description: String, vote_end: Timestamp) -> Self {
            Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Add,
                    item,
                },
                vote_end,
                executed: false,
                description,
            }
        }

        fn item_modify(item_id: ItemId, item: String, description: String, vote_end: Timestamp) -> Self {
            Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Modify(item_id),
                    item,
                },
                vote_end,
                executed: false,
                description,
            }
        }
    }

    #[derive(Default, Debug, PartialEq, Eq, PackedLayout, SpreadLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum VoteType {
        #[default]
        For, Against,
    } 

    /// range(0, 100)
    pub type Percentage = u8;

    #[derive(Default, Debug, PartialEq, Eq, PackedLayout, SpreadLayout, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ProposalVote {
        for_votes: Percentage,
        against_votes: Percentage,
    }

    pub type ProposalId = u32;

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct GovernorContract {
        /// Maps proposal to percentage of for/against votes casted
        proposal_votes: Mapping<ProposalId, ProposalVote>,
        proposals: Mapping<ProposalId, Proposal>,
        /// Set  of (P, A) s.t. account A has voted for proposal P
        votes: Mapping<(ProposalId, AccountId), ()>,
        /// Maps database items to the most recent Modify proposal
        database_proposals: Mapping<ItemId, ProposalId>,
        /// Maps accounts to the most recent Mint/Burn proposal
        token_proposals: Mapping<AccountId, ProposalId>,
        next_proposal_id: u32,
        /// "For" votes required for proposal to pass through
        quorum: Percentage,
        /// Minimum transferred value required in payable proposals
        proposal_price: u128,
        token_contract: Option<AccountId>,
        database_contract: Option<AccountId>,
    }

    /********** GOVERNOR IMPLEMENTATION **********/
    
    impl CrossContractCaller for GovernorContract {}

    impl GovernorContract {
        #[ink(constructor)]
        pub fn new(
            version: u8,
            token_owners: Vec<AccountId>,
            quorum: Percentage,
            proposal_price: u128,
            token_hash: Hash,
            database_hash: Hash,
        ) -> Self {
            let token_contract = Self
            ::instantiate_contract(TokenContractRef::new(token_owners), token_hash, version, Self::env().caller())
                .unwrap_or_else(|error| {
                    panic!("failed to instantiate the TokenContract: {:?}", error)
                });
            let database_contract = Self
            ::instantiate_contract(DatabaseContractRef::new(), database_hash, version, Self::env().caller())
                .unwrap_or_else(|error| {
                    panic!("failed to instantiate the DatabaseContract: {:?}", error)
                });


            initialize_contract(|instance: &mut Self| {
                instance.quorum = num::clamp(quorum, 0, 100);
                instance.proposal_price = proposal_price;
                instance.token_contract = Some(token_contract);
                instance.database_contract = Some(database_contract);
            })
        }

        // For use in tests:
        // doesn't call TokenContract and DatabaseContract
        #[ink(constructor)]
        pub fn test(quorum: Percentage, proposal_price: u128) -> Self {
            initialize_contract(|instance: &mut Self| {
                instance.quorum = num::clamp(quorum, 0, 100);
                instance.proposal_price = proposal_price;
                instance.token_contract = None;
                instance.database_contract = None;
            })
        }

        /********** PROPOSE **********/

        // Propose a new item to the database
        fn propose_add(&mut self, item: String, description: String) -> Result<ProposalId, GovernorError> {
            let now = self.env().block_timestamp();
            let proposal = Proposal::item_add(item, description, now + ONE_MINUTE);

            let id = self.next_proposal_id();
            self.proposals.insert(id, &proposal);
            Self::emit_event(Self::env(), Event::ProposalAdded(ProposalAdded { id }));
            
            Ok(id)
        }

        #[ink(message)]
        pub fn propose_add_governor(&mut self, item: String, description: String) -> Result<ProposalId, GovernorError> {
            self.require_token_owner(Self::env().caller())?;
            self.propose_add(item, description)
        }

        #[ink(message, payable)]
        pub fn propose_add_external(&mut self, item: String, description: String) -> Result<ProposalId, GovernorError> {
            self.require_min_transferred_value()?;
            self.propose_add(item, description)
        }
 
        // Propose modification to existing item in the database
        fn propose_modify(&mut self, item_id: ItemId, item: String, description: String) -> Result<ProposalId, GovernorError> {
            self.require_item_exists(item_id)?;
            self.require_no_active_modify_proposal(item_id)?;

            let now = self.env().block_timestamp();
            let proposal = Proposal::item_modify(item_id, item, description, now + ONE_MINUTE);

            let id = self.next_proposal_id();
            self.proposals.insert(id, &proposal);
            self.database_proposals.insert(item_id, &id);
            Self::emit_event(Self::env(), Event::ProposalAdded(ProposalAdded { id }));

            Ok(id)
        }

        #[ink(message)]
        pub fn propose_modify_governor(&mut self, item_id: ItemId, item: String, description: String) -> Result<ProposalId, GovernorError> {
            self.require_token_owner(Self::env().caller())?;
            self.propose_modify(item_id, item, description)
        }

        #[ink(message, payable)]
        pub fn propose_modify_external(&mut self, item_id: ItemId, item: String, description: String) -> Result<ProposalId, GovernorError> {
            self.require_min_transferred_value()?;
            self.propose_modify(item_id, item, description)
        }

        #[ink(message)]
        pub fn propose_mint(&mut self, recipient: AccountId, description: String) -> Result<ProposalId, GovernorError> {
            self.require_token_owner(Self::env().caller())?;
            self.require_no_active_token_proposal(&recipient)?;   
            
            let now = self.env().block_timestamp();
            let proposal = Proposal::token_mint(recipient, description, now + ONE_MINUTE);

            let id = self.next_proposal_id();
            self.proposals.insert(id, &proposal);
            self.token_proposals.insert(recipient, &id);
            Self::emit_event(Self::env(), Event::ProposalAdded(ProposalAdded { id }));

            Ok(id)
        } 
        
        #[ink(message)]
        pub fn propose_burn(&mut self, holder: AccountId, description: String) -> Result<ProposalId, GovernorError> {
            self.require_token_owner(Self::env().caller())?;
            self.require_no_active_token_proposal(&holder)?;   

            let now = self.env().block_timestamp();
            let proposal = Proposal::token_burn(holder, description, now + ONE_MINUTE);

            let id = self.next_proposal_id();
            self.proposals.insert(id, &proposal);
            self.token_proposals.insert(holder, &id);
            Self::emit_event(Self::env(), Event::ProposalAdded(ProposalAdded { id }));

            Ok(id)
        }

        /********** VOTE **********/ 
        
        #[ink(message)]
        pub fn vote(&mut self, proposal_id: ProposalId, vote: VoteType) -> Result<(), GovernorError> {
            // No need to require_token here, because in that case weight of the vote will be 0
            let proposal = self.require_proposal(proposal_id)?;
            Self::require_proposal_not_executed(&proposal)?;
            Self::require_before_vote_deadline(&proposal)?;

            let caller = self.env().caller();
            self.require_not_voted_before(proposal_id, caller)?;

            self.votes.insert(&(proposal_id, caller), &());

            let weight = self.account_weight(caller);
            let mut proposal_vote = self.proposal_votes.get(proposal_id).unwrap_or_default();
            match vote {
                VoteType::For => proposal_vote.for_votes += weight,
                VoteType::Against => proposal_vote.against_votes += weight,
            }
            self.proposal_votes.insert(&proposal_id, &proposal_vote);
            Self::emit_event(Self::env(), Event::VoteCasted(VoteCasted { proposal_id, weight }));

            Ok(())
        }
    
        /********** EXECUTE **********/

        /// Executes the proposal, and returns the item id in the database (if relevant)
        #[ink(message)]
        pub fn execute(&mut self, proposal_id: ProposalId) -> Result<Option<ItemId>, GovernorError> {
            let mut proposal = self.require_proposal(proposal_id)?;
            Self::require_proposal_not_executed(&proposal)?;
            self.require_quorum_reached(proposal_id)?;

            let item_id = self._execute(&proposal)?;
            proposal.executed = true;
            self.proposals.insert(&proposal_id, &proposal);
            Self::emit_event(Self::env(), Event::ProposalExecuted(ProposalExecuted { id: proposal_id }));

            Ok(item_id)
        }

        // Executes the proposal, assuming quorum is reached and it's not been executed yet
        fn _execute(&self, proposal: &Proposal) -> Result<Option<ItemId>, GovernorError> {
            match &proposal.category {
                 ProposalCategory::Token(kind) => {
                    if let Some(token_contract) = self.token_contract {
                        let mut token = Self
                            ::contract_from_account_id::<TokenContractRef>(token_contract);
                        match kind {
                            ProposalTokenKind::Mint(recipient) =>
                                _ = token.mint(*recipient)?,
                            ProposalTokenKind::Burn(holder) =>
                                token.burn(*holder)?,
                        }
                    }
                },
                ProposalCategory::Database { kind, item } => {
                    if let Some(database_contract) = self.database_contract {
                        let mut database = Self
                            ::contract_from_account_id::<DatabaseContractRef>(database_contract);
                        match kind {
                            ProposalDatabaseKind::Add =>
                                return Ok(Some(database.add_item(item.clone())?)),
                            ProposalDatabaseKind::Modify(item_id) => {
                                database.modify_item(*item_id, item.clone())?;
                            }
                        }
                    }
                }
            }
            Ok(None)
        }

        /********** GETTERS **********/

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

        #[ink(message)]
        pub fn get_quorum(&self) -> Percentage {
            self.quorum
        }

        #[ink(message)]
        pub fn get_proposal_price(&self) -> u128 {
            self.proposal_price
        }

        #[ink(message)]
        pub fn get_database(&self) -> Option<AccountId> {
            self.database_contract
        }

        #[ink(message)]
        pub fn get_token(&self) -> Option<AccountId> {
            self.token_contract
        }

        #[ink(message)]
        pub fn get_proposals_count(&self) -> u32 {
            self.next_proposal_id
        }

        #[ink(message)]
        pub fn get_vote_weight(&self, account: AccountId) -> Percentage {
            self.account_weight(account)
        }

        /// (For testing) Deletes the contract from the blockchain.
        #[ink(message)]
        pub fn suicide(&mut self) {
            self.env().terminate_contract(self.env().caller());
        }

        /********** PRECONDITIONS **********/
        
        fn require_item_exists(&self, item_id: ItemId) -> Result<(), GovernorError> {
            if !self.is_item_in_database(item_id) {
                return Err(GovernorError::DatabaseError(DatabaseError::IdNotFound));
            }
            Ok(())
        }
        
        fn require_proposal(&self, id: ProposalId) -> Result<Proposal, GovernorError> {
            self.proposals.get(&id).ok_or(GovernorError::ProposalNotFound)
        }

        fn require_proposal_not_executed(proposal: &Proposal) -> Result<(), GovernorError> {
            if proposal.executed {
                return Err(GovernorError::ProposalAlreadyExecuted);
            }
            Ok(())
        }

        fn require_before_vote_deadline(proposal: &Proposal) -> Result<(), GovernorError> {
            let now = Self::env().block_timestamp();
            if now > proposal.vote_end {
                return Err(GovernorError::VotePeriodEnded);
            }
            Ok(())
        }

        fn require_not_voted_before(&self, proposal_id: ProposalId, account: AccountId) -> Result<(), GovernorError> {
            if self.votes.get(&(proposal_id, account)).is_some() {
                return Err(GovernorError::AlreadyVoted);
            }
            Ok(())
        }

        fn require_quorum_reached(&self, proposal_id: ProposalId) -> Result<(), GovernorError> {
            let proposal_vote = self.proposal_votes.get(proposal_id).unwrap_or_default();
            if proposal_vote.for_votes < self.quorum {
                return Err(GovernorError::QuorumNotReached);
            }
            Ok(())
        }

        fn require_no_active_modify_proposal(&self, item_id: ItemId) -> Result<(), GovernorError> {
            if let Some(proposal_id) = self.database_proposals.get(item_id) {
                if self.is_proposal_active(proposal_id) {
                    return Err(GovernorError::ActiveProposalForItemExists(proposal_id));
                }
            }
            Ok(())
        }

        fn require_no_active_token_proposal(&self, account: &AccountId) -> Result<(), GovernorError> {
            if let Some(proposal_id) = self.token_proposals.get(account) {
                if self.is_proposal_active(proposal_id) {
                    return Err(GovernorError::ActiveProposalForAccountExists(proposal_id));
                }
            }
            Ok(())
        }
        
        fn require_token_owner(&self, caller: AccountId) -> Result<(), GovernorError> {
            if let Some(token_contract) = self.token_contract {
                let balance = PSP34Ref::balance_of(&token_contract, caller);
                if balance == 0 {
                    return Err(GovernorError::TokenOwnershipRequired);
                }
            }
            Ok(())
        }
        
        fn require_min_transferred_value(&self) -> Result<(), GovernorError> {
            if self.env().transferred_value() < self.proposal_price {
                return Err(GovernorError::InsufficientTransferQuota);
            }
            Ok(())
        }
        
        /********** HELPER METHODS **********/

        fn is_item_in_database(&self, id: ItemId) -> bool {
            if let Some(database_contract) = self.database_contract {
                let database = Self
                    ::contract_from_account_id::<DatabaseContractRef>(database_contract);
                database.has_item(id)
            } else {
                true
            }
        }

        // Proposal is active iff it's not executed and quorum may still be reached
        fn is_proposal_active(&self, id: ProposalId) -> bool {
            let proposal = self.proposals.get(id).unwrap();
            let proposal_vote = self.proposal_votes.get(id);
            let against_votes = proposal_vote.map(|v| v.against_votes).unwrap_or_default();
            let now = self.env().block_timestamp();
            return now <= proposal.vote_end
                && against_votes <= 100 - self.quorum
                && !proposal.executed;
        }

        fn account_weight(&self, caller: AccountId) -> Percentage {
            if let Some(token_contract) = self.token_contract {
                let balance = PSP34Ref::balance_of(&token_contract, caller);
                let total_supply = PSP34Ref::total_supply(&token_contract) as u32;
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

        fn emit_event<EE>(emitter: EE, event: Event) where EE: EmitEvent<GovernorContract> {
            emitter.emit_event(event);
        }
    }
        
    /********** EVENTS **********/
    
    type Event = <GovernorContract as ContractEventBase>::Type;

    #[ink(event)]
    pub struct ProposalAdded {
        #[ink(topic)]
        id: ProposalId,
    }

    #[ink(event)]
    pub struct VoteCasted {
        #[ink(topic)]
        proposal_id: ProposalId,
        weight: Percentage,
    }

    #[ink(event)]
    pub struct ProposalExecuted {
        #[ink(topic)]
        id: ProposalId,
    }

    trait CrossContractCaller {
        fn contract_from_account_id<TContract>(id: AccountId) -> TContract
            where TContract: FromAccountId<Environment>
        {
            <TContract as FromAccountId<super::governor::Environment>>
                ::from_account_id(id)
        }

        fn instantiate_contract<TContract, TArgList>(
            contract_builder: ink_env::call::CreateBuilder<
                Environment,
                Unset<Hash>,
                Unset<u64>,
                Unset<Balance>,
                Set<ExecutionInput<TArgList>>,
                Unset<Salt>,
                TContract>,
            code_hash: Hash,
            version: u8,
            caller: AccountId,
        ) -> Result<AccountId, InkEnvError>
            where
                TArgList: scale::Encode,
                TContract: ToAccountId<Environment> + FromAccountId<Environment>
        {
            let contract_ref = contract_builder
                .code_hash(code_hash)
                .salt_bytes([version.to_le_bytes().as_ref(), caller.as_ref()].concat())
                .endowment(0)
                .instantiate()?;

            Ok(<TContract as ToAccountId<super::governor::Environment>>
                ::to_account_id(&contract_ref))
        }
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

        use nameof::name_of_type;

        #[ink::test]
        fn constructor_works() {
            let governor = GovernorContract::test(75, 100);
            assert_eq!(governor.quorum, 75);
            assert_eq!(governor.proposal_price, 100);
        }

        #[ink::test]
        fn propose_add_works() {
            let mut governor = GovernorContract::test(75, 100);
            assert_eq!(governor.propose_add("test".to_string(), "test desc".to_string()), Ok(0));
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Add,
                    item: "test".to_string(),
                },
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_add_external_works() {
            use ink::codegen::Env;

            let mut governor = GovernorContract::test(75, 100);
            let accounts = get_default_test_accounts();
            let contract_account = governor.env().account_id();

            set_balance(accounts.bob, 300);
            set_balance(contract_account, 0);
            set_caller(accounts.bob);

            assert_eq!(
                ink_env::pay_with_call!(
                    governor.propose_add_external("test".to_string(), "test desc".to_string()),
                    100
                ),
                Ok(0)
            );
            assert_eq!(get_balance(contract_account), 100);
            assert_eq!(get_balance(accounts.bob), 200);
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Add,
                    item: "test".to_string(),
                },
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_add_external_fails() {
            let mut governor = GovernorContract::test(75, 100);
            let accounts = get_default_test_accounts();
            set_caller(accounts.bob);

            assert_eq!(governor.propose_add_external("test".to_string(), "test desc".to_string()),
                       Result::Err(GovernorError::InsufficientTransferQuota))
        }

        #[ink::test]
        fn propose_modify_works() {
            let mut governor = GovernorContract::test(75, 100);
            // NOTE: not testing modification of non-existing items, because
            // injecting a database contract instance is problematic
            assert_eq!(governor.propose_modify(0, "test".to_string(), "test desc".to_string()), Ok(0));
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Modify(0),
                    item: "test".to_string(),
                },
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_modify_external_works() {
            use ink::codegen::Env;

            let mut governor = GovernorContract::test(75, 100);
            let accounts = get_default_test_accounts();
            let contract_account = governor.env().account_id();

            set_balance(accounts.bob, 300);
            set_balance(contract_account, 0);
            set_caller(accounts.bob);

            assert_eq!(
                ink_env::pay_with_call!(
                    governor.propose_modify_external(0, "test".to_string(), "test desc".to_string()),
                    100
                ),
                Ok(0)
            );
            assert_eq!(get_balance(contract_account), 100);
            assert_eq!(get_balance(accounts.bob), 200);
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Database {
                    kind: ProposalDatabaseKind::Modify(0),
                    item: "test".to_string(),
                },
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_modify_external_fails() {
            let mut governor = GovernorContract::test(75, 100);
            let accounts = get_default_test_accounts();
            set_caller(accounts.bob);

            assert_eq!(governor.propose_modify_external(0, "test".to_string(), "test desc".to_string()),
                       Result::Err(GovernorError::InsufficientTransferQuota))
        }

        #[ink::test]
        fn propose_modify_same_item_executed_works() {
            let mut governor = GovernorContract::test(25, 100);
            governor.propose_modify_governor(0, "a".to_string(), "desc".to_string()).ok();
            governor.vote(0, VoteType::For).ok();
            governor.execute(0).ok();

            assert_eq!(
                governor.propose_modify_governor(0, "b".to_string(), "desc".to_string()),
                Ok(1));
        }
        
        #[ink::test]
        fn propose_modify_same_item_rejected_works() {
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_modify_governor(0, "a".to_string(), "desc".to_string()).ok();
            governor.vote(0, VoteType::Against).ok();

            assert_eq!(
                governor.propose_modify_governor(0, "b".to_string(), "desc".to_string()),
                Ok(1));
        }

        #[ink::test]
        fn propose_modify_same_item_after_deadline_works() {
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_modify_governor(0, "a".to_string(), "desc".to_string()).ok();
            
            for _ in 0..60*200 {
                ink_env::test::advance_block::<ink_env::DefaultEnvironment>();
            }

            assert_eq!(
                governor.propose_modify_governor(0, "b".to_string(), "desc".to_string()),
                Ok(1));
        }

        #[ink::test]
        fn propose_modify_same_item_fails() {
            let mut governor = GovernorContract::test(25, 100);
            governor.propose_modify_governor(0, "a".to_string(), "desc".to_string()).ok();
            governor.vote(0, VoteType::Against).ok();
            
            assert_eq!(
                governor.propose_modify_governor(0, "b".to_string(), "desc".to_string()),
                Result::Err(GovernorError::ActiveProposalForItemExists(0)));
        }

        #[ink::test]
        fn propose_mint_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            assert_eq!(governor.propose_mint(alice, "test desc".to_string()), Ok(0));
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Token(
                    ProposalTokenKind::Mint(alice),
                ),
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_burn_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            assert_eq!(governor.propose_burn(alice, "test desc".to_string()), Ok(0));
            assert_eq!(governor.next_proposal_id, 1);
            assert_eq!(governor.get_proposal(0), Some(Proposal {
                category: ProposalCategory::Token(
                    ProposalTokenKind::Burn(alice),
                ),
                vote_end: 60 * 1000,
                executed: false,
                description: "test desc".to_string(),
            }));
        }

        #[ink::test]
        fn propose_burn_same_account_executed_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(25, 100);
            governor.propose_burn(alice, "desc".to_string()).ok();
            governor.vote(0, VoteType::For).ok();
            governor.execute(0).ok();

            assert_eq!(
                governor.propose_burn(alice, "desc".to_string()),
                Ok(1));
        }

        #[ink::test]
        fn propose_burn_same_account_rejected_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_burn(alice, "desc".to_string()).ok();
            governor.vote(0, VoteType::Against).ok();

            assert_eq!(
                governor.propose_burn(alice, "desc".to_string()),
                Ok(1));
        }
        
        #[ink::test]
        fn propose_mint_same_account_after_deadline_works() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_burn(alice, "desc".to_string()).ok();
            
            for _ in 0..60*200 {
                ink_env::test::advance_block::<ink_env::DefaultEnvironment>();
            }

            assert_eq!(
                governor.propose_burn(alice, "desc".to_string()),
                Ok(1));
        }


        #[ink::test]
        fn propose_mint_same_account_fails() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(25, 100);
            governor.propose_burn(alice, "desc".to_string()).ok();
            governor.vote(0, VoteType::Against).ok();

            assert_eq!(
                governor.propose_burn(alice, "desc".to_string()),
                Result::Err(GovernorError::ActiveProposalForAccountExists(0)));
        }


        #[ink::test]
        fn vote_works() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();

            set_caller(accounts.alice);
            assert!(governor.vote(0, VoteType::For).is_ok(), "voting was expected to succeed");
            assert!(governor.has_voted(0, accounts.alice), "Alice was expected to have voted");
            assert_eq!(governor.get_proposal_vote(0), Some(ProposalVote { for_votes: 50, against_votes: 0 }));
            
            set_caller(accounts.bob);
            assert!(governor.vote(0, VoteType::Against).is_ok(), "voting was expected to succeed");
            assert!(governor.has_voted(0, accounts.bob), "Bob was expected to have voted");
            assert_eq!(governor.get_proposal_vote(0), Some(ProposalVote { for_votes: 50, against_votes: 50 }));
        }

        #[ink::test]
        fn vote_wrong_proposal_id_fails() {
            let mut governor = GovernorContract::test(75, 100);
            assert_eq!(governor.vote(0, VoteType::For), Result::Err(GovernorError::ProposalNotFound));
        }

        #[ink::test]
        fn vote_double_vote_fails() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(alice);
            governor.vote(0, VoteType::For).ok();
            assert_eq!(governor.vote(0, VoteType::Against), Result::Err(GovernorError::AlreadyVoted));
        }

        #[ink::test]
        fn vote_for_executed_proposal_fails() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0, VoteType::For).ok();
            set_caller(accounts.bob);
            governor.vote(0, VoteType::For).ok();
            governor.execute(0).ok();
            assert_eq!(
                governor.vote(0, VoteType::Against),
                Result::Err(GovernorError::ProposalAlreadyExecuted));
        }

        #[ink::test]
        fn execute_works() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0, VoteType::For).ok();
            set_caller(accounts.bob);
            governor.vote(0, VoteType::For).ok();
            assert!(governor.execute(0).is_ok(), "executing a proposal was expected to succeed");
            assert_eq!(governor.get_proposal_vote(0), Some(ProposalVote { for_votes: 100, against_votes: 0 }));
            assert!(governor.get_proposal(0).unwrap().executed, "Proposal was expected to change execution status");
        }

        #[ink::test]
        fn execute_wrong_proposal_id_fails() {
            let mut governor = GovernorContract::test(75, 100);
            assert_eq!(governor.execute(0), Result::Err(GovernorError::ProposalNotFound));
        }

        #[ink::test]
        fn execute_no_quorum_fails() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(alice);
            governor.vote(0, VoteType::For).ok();
            assert_eq!(governor.execute(0), Result::Err(GovernorError::QuorumNotReached));
        }

        #[ink::test]
        fn execute_executed_proposal_fails() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0, VoteType::For).ok();
            set_caller(accounts.bob);
            governor.vote(0, VoteType::For).ok();
            governor.execute(0).ok();
            assert_eq!(governor.execute(0), Result::Err(GovernorError::ProposalAlreadyExecuted));
        }

        #[ink::test]
        fn event_on_proposal_added() {
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            governor.propose_modify(0, "test".to_string(), "test desc".to_string()).ok();

            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_expected_propose_event(
                &recorded_events[0],
                0,
            );
            assert_expected_propose_event(
                &recorded_events[1],
                1,
            );
        }

        #[ink::test]
        fn event_on_vote_casted() {
            let alice = get_default_test_accounts().alice;
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(alice);
            governor.vote(0, VoteType::For).ok();

            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_expected_vote_event(
                &recorded_events.last().expect("at least 1 event expected"),
                0,
                50,
            );
        }

        #[ink::test]
        fn event_on_proposal_executed() {
            let accounts = get_default_test_accounts();
            let mut governor = GovernorContract::test(75, 100);
            governor.propose_add("test".to_string(), "test desc".to_string()).ok();
            set_caller(accounts.alice);
            governor.vote(0, VoteType::For).ok();
            set_caller(accounts.bob);
            governor.vote(0, VoteType::For).ok();
            governor.execute(0).ok();

            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_expected_execute_event(
                &recorded_events.last().expect("at least 1 event expected"),
                0,
            );
        }

        fn assert_expected_propose_event(event: &EmittedEvent, expected_id: ProposalId) {
            let decoded_event = decode_event(&event);
            if let Event::ProposalAdded(ProposalAdded { id }) = decoded_event {
                assert_eq!(id, expected_id);
            } else {
                panic!("encountered unexpected event kind: expected {}", name_of_type!(ProposalAdded));
            };
        }

        fn assert_expected_vote_event(event: &EmittedEvent,
                                      expected_id: ProposalId,
                                      expected_weight: Percentage) {
            let decoded_event = decode_event(&event);
            if let Event::VoteCasted(VoteCasted { proposal_id, weight }) = decoded_event {
                assert_eq!(proposal_id, expected_id);
                assert_eq!(weight, expected_weight);
            } else {
                panic!("encountered unexpected event kind: expected {}", name_of_type!(VoteCasted));
            };
        }

        fn assert_expected_execute_event(event: &EmittedEvent, expected_id: ProposalId) {
            let decoded_event = decode_event(&event);
            if let Event::ProposalExecuted(ProposalExecuted { id }) = decoded_event {
                assert_eq!(id, expected_id);
            } else {
                panic!("encountered unexpected event kind: expected {}", name_of_type!(ProposalExecuted));
            };
        }

        fn decode_event(event: &EmittedEvent) -> Event {
            <Event as Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer")
        }

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        }

        fn get_balance(account_id: AccountId) -> Balance {
            ink_env::test::get_account_balance::<ink_env::DefaultEnvironment>(
                account_id,
            )
                .expect("Cannot get account balance")
        }

        fn set_balance(account_id: AccountId, balance: Balance) {
            ink_env::test::set_account_balance::<ink_env::DefaultEnvironment>(
                account_id, balance,
            )
        }
    }
}
