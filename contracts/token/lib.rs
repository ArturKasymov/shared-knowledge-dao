#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod token {
   
    use ink_prelude::vec::Vec;
    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::{
            ownable::*,
            psp34::extensions::burnable::*,
        },
        modifiers,
        traits::Storage,
    };

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct TokenContract {
        #[storage_field]
        ownable: ownable::Data,
        #[storage_field]
        psp34: psp34::Data,
        next_id: u8,
    }

    impl PSP34 for TokenContract {}
    impl PSP34Burnable for TokenContract {}

    impl TokenContract {
        #[ink(constructor)]
        pub fn new(owners: Vec<AccountId>) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Self| {
                instance._init_with_owner(Self::env().caller());
                instance.next_id = owners.len() as u8;
                for (i, account) in owners.iter().enumerate() {
                    instance._mint_to(*account, Id::U8(i as u8)).expect("Should mint");
                }
            })
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn mint(&mut self, recipient: AccountId) -> Result<Id, PSP34Error> {
            let id = self.next_id();
            self._mint_to(recipient, Id::U8(id))?;
            Ok(Id::U8(id))
        }

        // (For testing) Deletes the contract from the blockchain.
        #[ink(message)]
        pub fn suicide(&mut self) {
            self.env().terminate_contract(self.env().caller());
        }

        fn next_id(&mut self) -> u8 {
            let id = self.next_id;
            self.next_id += 1;
            id
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        
        use ink_lang as ink;
        use ink_env::test::{
            default_accounts, DefaultAccounts
        };

        #[ink::test]
        fn constructor_works() {
            let accounts = get_default_test_accounts();
            let token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            assert_eq!(token.total_supply(), 2);
            assert_eq!(token.balance_of(accounts.alice), 1);
            assert_eq!(token.balance_of(accounts.bob), 1);
        }

        #[ink::test]
        fn mint_works() {
            let accounts = get_default_test_accounts();
            let mut token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            assert!(token.mint(accounts.frank).is_ok(), "Expected to mint");
            assert_eq!(token.total_supply(), 3);
            assert_eq!(token.balance_of(accounts.frank), 1);
        }

        #[ink::test]
        fn mint_nonowner_fails() {
            let accounts = get_default_test_accounts();
            set_caller(accounts.alice);

            let mut token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            
            set_caller(accounts.bob);
            assert!(token.mint(accounts.frank).is_err(), "Bob expected to have no call access");
        }    

        #[ink::test]
        fn burn_works() {
            let accounts = get_default_test_accounts();
            let mut token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            assert!(token.burn(accounts.alice, Id::U8(0)).is_ok(), "Expected to burn");
            assert_eq!(token.total_supply(), 1);
            assert_eq!(token.balance_of(accounts.alice), 0);
        }    

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        }
    }
}
