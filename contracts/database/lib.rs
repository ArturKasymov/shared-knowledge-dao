#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod database {
    
    use ink_lang::{
        codegen::EmitEvent, reflect::ContractEventBase,
        utils::initialize_contract,
    };
    use ink_prelude::string::String;
    use ink_storage::{
        traits::{SpreadAllocate},
        Mapping,
    };

    use openbrush::{
        contracts::ownable::*,
        modifiers,
        traits::Storage,
    };

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum DatabaseError {
        IdNotFound,
        NoAccess(OwnableError),
    }

    impl From<OwnableError> for DatabaseError {
        fn from(e: OwnableError) -> Self {
            DatabaseError::NoAccess(e)
        }
    }

    pub type ItemId = u32;
    pub type Item = String;

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct DatabaseContract {
        #[storage_field]
        ownable: ownable::Data,
        items: Mapping<ItemId, Item>,
        next_item_id: ItemId,
    }

    impl Ownable for DatabaseContract {}

    impl DatabaseContract {
        #[ink(constructor)]
        pub fn new() -> Self {
            initialize_contract(|instance: &mut Self| {
                instance._init_with_owner(Self::env().caller());
            })
        }

        /// Adds the item to the database, and returns its ID
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn add_item(&mut self, item: Item) -> Result<ItemId, DatabaseError> {
            let id = self.next_item_id();
            self.items.insert(id, &item);
            Self::emit_event(Self::env(), Event::ItemAdded(ItemAdded { id }));
            Ok(id)
        }

        /// Overwrites the item identified by the given ID with the new item
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn modify_item(&mut self, id: ItemId, item: Item) -> Result<(), DatabaseError> {
            match self.items.get(id) {
                None => Err(DatabaseError::IdNotFound),
                Some(_) => {
                    self.items.insert(id, &item);
                    Self::emit_event(Self::env(), Event::ItemModified(ItemModified { id }));
                    Ok(())
                }
            }
        }

        /// More efficient than get_by_id(id).is_some()
        /// because no need to copy Strings around
        #[ink(message)]
        pub fn has_item(&self, id: ItemId) -> bool {
            self.items.contains(id)
        }

        #[ink(message)]
        pub fn get_by_id(&self, id: ItemId) -> Option<Item> {
            self.items.get(id)
        }

        #[ink(message)]
        pub fn get_items_count(&self) -> u32 {
            self.next_item_id
        }

        /// (For testing) Deletes the contract from the blockchain.
        #[ink(message)]
        pub fn suicide(&mut self) {
            self.env().terminate_contract(self.env().caller());
        }

        fn next_item_id(&mut self) -> ItemId {
            let id = self.next_item_id;
            self.next_item_id += 1;
            id
        }

        fn emit_event<EE>(emitter: EE, event: Event) where EE: EmitEvent<DatabaseContract> {
            emitter.emit_event(event);
        }
    }
    
    type Event = <DatabaseContract as ContractEventBase>::Type;

    #[ink(event)]
    pub struct ItemAdded {
        #[ink(topic)]
        id: ItemId,
    }

    #[ink(event)]
    pub struct ItemModified {
        #[ink(topic)]
        id: ItemId,
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
            let database = DatabaseContract::new();
            assert_eq!(database.next_item_id, 0);
        }

        #[ink::test]
        fn add_item_works() {
            let mut database = DatabaseContract::new();
            assert_eq!(database.add_item("1".to_string()), Ok(0));
            assert_eq!(database.add_item("2".to_string()), Ok(1));
        }

        #[ink::test]
        fn modify_item_works() {
            let mut database = DatabaseContract::new();
            database.add_item("1".to_string()).ok();
            assert!(database.modify_item(0, "2".to_string()).is_ok(), "modifying was expected to succeed");
        }

        #[ink::test]
        fn modify_wrong_id_fails() {
            let mut database = DatabaseContract::new();
            assert!(
                matches!(
                    database.modify_item(0, "test".to_string()),
                    Result::Err(DatabaseError::IdNotFound)
                ),
                "no item with ID 0 expected to exist in the database"
            );
        }

        #[ink::test]
        fn add_nonowner_fails() {
            let accounts = get_default_test_accounts();
            set_caller(accounts.alice);

            let mut database = DatabaseContract::new();

            set_caller(accounts.bob);
            assert!(
                matches!(
                    database.add_item("test".to_string()),
                    Result::Err(DatabaseError::NoAccess(_))
                ),
                "Bob expected to not have call access"
            );
        }

        #[ink::test]
        fn modify_nonowner_fails() {
            let accounts = get_default_test_accounts();
            set_caller(accounts.alice);

            let mut database = DatabaseContract::new();
            database.add_item("1".to_string()).ok();

            set_caller(accounts.bob);
            assert!(
                matches!(
                    database.modify_item(0, "2".to_string()),
                    Result::Err(DatabaseError::NoAccess(_))
                ),
                "Bob expected to not have call access"
            );
        }

        #[ink::test]
        fn event_on_add_item() {
            let mut database = DatabaseContract::new();
            database.add_item("test".to_string()).ok();
            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_expected_add_event(
                &recorded_events[0],
                0,
            );
        }

        #[ink::test]
        fn event_on_modify_item() {
            let mut database = DatabaseContract::new();
            database.add_item("1".to_string()).ok();
            database.modify_item(0, "2".to_string()).ok();
            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_expected_modify_event(
                &recorded_events.last().expect("at least 1 event expected"),
                0,
            );
        }

        #[ink::test]
        fn no_event_on_failing_modify_item() {
            let mut database = DatabaseContract::new();
            database.modify_item(0, "test".to_string()).ok();
            let recorded_events = recorded_events().collect::<Vec<_>>();
            assert_eq!(recorded_events.len(), 0);
        }

        fn assert_expected_add_event(event: &EmittedEvent, expected_id: ItemId) {
            let decoded_event = <Event as Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer");
            if let Event::ItemAdded(ItemAdded { id }) = decoded_event {
                assert_eq!(id, expected_id);
            } else {
                panic!("encountered unexpected event kind: expected {}", name_of_type!(ItemAdded));
            };
        }

        fn assert_expected_modify_event(event: &EmittedEvent, expected_id: ItemId) {
            let decoded_event = <Event as Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer");
            if let Event::ItemModified(ItemModified { id }) = decoded_event {
                assert_eq!(id, expected_id);
            } else {
                panic!("encountered unexpected event kind: expected {}", name_of_type!(ItemModified));
            };
        }

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        }
    }
}
