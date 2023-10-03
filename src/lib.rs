use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

// declare and export the program's entrypoint
entrypoint!(hello);

// program entrypoint's implementation
pub fn hello(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let input = String::from_utf8(instruction_data.to_vec()).expect("Should be UTF-8 string");
    // log a message to the blockchain
    msg!("{}", input);

    // gracefully exit the program
    Ok(())
}
