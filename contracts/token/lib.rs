#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod token {
   
    use ink_prelude::vec::Vec;
    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::psp34::extensions::mintable::*,
        contracts::psp34::extensions::burnable::*,
        traits::Storage,
    };

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct TokenContract {
        #[storage_field]
        psp34: psp34::Data,
    }

    impl PSP34 for TokenContract {}
    impl PSP34Mintable for TokenContract {}
    impl PSP34Burnable for TokenContract {}

    impl TokenContract {
        #[ink(constructor)]
        pub fn new(owners: Vec<AccountId>) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Self| {
                for (i, account) in owners.iter().enumerate() {
                    instance._mint_to(*account, Id::U8(i as u8)).expect("Should mint");
                }
            })
        }

        // (For testing) Deletes the contract from the blockchain.
        #[ink(message)]
        pub fn suicide(&mut self) {
            self.env().terminate_contract(self.env().caller());
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
            assert!(token.mint(accounts.frank, Id::U8(2)).is_ok(), "Expected to mint");
            assert_eq!(token.total_supply(), 3);
            assert_eq!(token.balance_of(accounts.frank), 1);
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
    }
}
