#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod token {
    
    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::psp22::*,
        traits::Storage,
    };

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct TokenContract {
        #[storage_field]
        psp22: psp22::Data,
    }

    impl PSP22 for TokenContract {}

    impl TokenContract {
        #[ink(constructor)]
        pub fn new(initial_supply: Balance) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Self| {
                instance._mint_to(instance.env().caller(), initial_supply).expect("Should mint");
            })
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
            let alice = get_default_test_accounts().alice;
            set_caller(alice);

            let token = TokenContract::new(100);
            assert_eq!(token.total_supply(), 100);
            assert_eq!(token.balance_of(alice), 100);
        }

        fn get_default_test_accounts() -> DefaultAccounts<ink_env::DefaultEnvironment> {
            default_accounts::<ink_env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(caller);
        }
    }
}
