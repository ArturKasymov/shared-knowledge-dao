#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod token {
   
    use ink_prelude::vec::Vec;
    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::{
            ownable::*,
            psp34::extensions::enumerable::*,
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
        psp34: psp34::Data<enumerable::Balances>,
        /// Vec of accounts possessing >= 1 token
        holders: Vec<AccountId>,
        next_id: u8,
    }

    impl PSP34 for TokenContract {}
    impl PSP34Enumerable for TokenContract {}

    impl TokenContract {
        #[ink(constructor)]
        pub fn new(holders: Vec<AccountId>) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Self| {
                instance._init_with_owner(Self::env().caller());
                instance.holders = holders.clone();
                instance.next_id = holders.len() as u8;
                for (i, account) in holders.iter().enumerate() {
                    instance._mint_to(*account, Id::U8(i as u8)).expect("Should mint");
                }
            })
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn mint(&mut self, recipient: AccountId) -> Result<Id, PSP34Error> {
            let id = self.next_id();
            self._mint_to(recipient, Id::U8(id))?;
            if self.balance_of(recipient) == 1 {
                self.holders.push(recipient);
            }
            Ok(Id::U8(id))
        }
        
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn burn(&mut self, holder: AccountId) -> Result<(), PSP34Error> {
            let token_id = self.psp34
                .balances
                .enumerable
                .get_value(&Some(&holder), &0)
                .ok_or(PSP34Error::TokenNotExists)?;
            self._burn_from(holder.clone(), token_id)?;
            
            if self.balance_of(holder) == 0 {
                self.holders.retain(|account| account != &holder);
            }
            Ok(())
        }

        #[ink(message)]
        pub fn get_holders(&self) -> Vec<AccountId> {
            self.holders.clone()
        }

        /// (For testing) Deletes the contract from the blockchain.
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
            assert_eq!(token.get_holders(), vec![accounts.alice, accounts.bob]);
        }

        #[ink::test]
        fn mint_works() {
            let accounts = get_default_test_accounts();
            let mut token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            assert!(token.mint(accounts.frank).is_ok(), "Expected to mint");
            assert_eq!(token.total_supply(), 3);
            assert_eq!(token.balance_of(accounts.frank), 1);
            assert_eq!(token.get_holders(), vec![accounts.alice, accounts.bob, accounts.frank]);
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
            assert!(token.burn(accounts.alice).is_ok(), "Expected to burn");
            assert_eq!(token.total_supply(), 1);
            assert_eq!(token.balance_of(accounts.alice), 0);
            assert_eq!(token.get_holders(), vec![accounts.bob]);
        }
        
        #[ink::test]
        fn burn_nonowner_fails() {
            let accounts = get_default_test_accounts();
            set_caller(accounts.alice);

            let mut token = TokenContract::new(vec![accounts.alice, accounts.bob]);
            
            set_caller(accounts.bob);
            assert!(token.burn(accounts.alice).is_err(), "Bob expected to have no call access");
        }

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        }
    }
}
