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
    Prompt {
        input: String
    },
    Config {},
}

// declare and export the program's entrypoint
entrypoint!(process_instruction);

// program entrypoint implementation
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let ins = Instruction::deserialize(&mut &instruction_data[..])?;

    let Instruction::Prompt { input } = ins else {
        return Ok(())
    };

    let Some(signer) = accounts.iter().filter(|a| a.is_signer).next() else {
       return Ok(())
    };

    msg!("PublicKey: 0x{}", hex::encode(signer.key.to_bytes()));
    msg!("Prompt: {}", input);

    // gracefully exit the program
    Ok(())
}
