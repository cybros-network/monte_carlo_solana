use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq, Eq)]
pub enum Instruction {
    Config,
    Prompt {
        input: String
    },
}

// declare and export the program's entrypoint
entrypoint!(hello);

// program entrypoint implementation
pub fn hello(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let ins = Instruction::deserialize(&mut &instruction_data[..])?;

    let Instruction::Prompt { input } = ins else {
        return Ok(())
    };

    // log a message to the blockchain
    msg!("Prompt: {}", input);

    // gracefully exit the program
    Ok(())
}
