module nft_creator::mint_ai {
    // use sui::tx_context::{Self, TxContext}; 
    // use sui::object::{Self, UID};   
    // use sui::transfer;  
    use sui::package;   
    use sui::display;   
    use std::string::{Self, String};   

    public struct ChatNFT has key, store {
        id: UID,
        name: String,
        description: String,
        walrus_blob_id: String,
        walrus_sui_object: String,
    }

    public struct MINT_AI has drop{} 

    const ENO_EMPTY_NAME: u64 = 0;     // Error code for empty name
    const ENO_EMPTY_BLOB_ID: u64 = 1;  // Error code for empty blob ID

    fun init(witness: MINT_AI, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
        ];
        
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/{walrus_blob_id}")
        ];
        
        let publisher = package::claim(witness, ctx);
        let mut display = display::new_with_fields<ChatNFT>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display);
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    public entry fun mint_nft(
        name: String,
        description: String,
        walrus_blob_id: String,
        walrus_sui_object: String,
        ctx: &mut TxContext
    ) {
        assert!(!string::is_empty(&name), ENO_EMPTY_NAME);
        assert!(!string::is_empty(&walrus_blob_id), ENO_EMPTY_BLOB_ID);

        let nft = ChatNFT {
            id: object::new(ctx),
            name,
            description,
            walrus_blob_id,
            walrus_sui_object,
        };

        transfer::transfer(nft, tx_context::sender(ctx));
    }

  
}