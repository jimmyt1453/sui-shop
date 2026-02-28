/// Jimmy's SUI Shop - On-chain digital goods marketplace
/// Supports any coin type (USDC on testnet/mainnet) via generics
#[allow(lint(public_entry))]
module jimmys_sui_shop::shop {
    use sui::coin::{Self, Coin};
    use sui::clock::Clock;
    use sui::dynamic_field;
    use sui::event;

    // ===== Error codes =====
    const ENotOwner: u64 = 0;
    const EProductNotFound: u64 = 1;
    const EProductNotActive: u64 = 2;
    const EInsufficientPayment: u64 = 3;
    const EInvalidPrice: u64 = 4;

    // ===== Structs =====

    /// Admin capability - only holder can modify shop
    public struct AdminCap has key, store {
        id: UID,
        shop_id: ID,
    }

    /// The Shop shared object - holds product catalog
    public struct Shop has key {
        id: UID,
        owner: address,
        merchant_address: address,
        product_count: u64,
        name: vector<u8>,
    }

    /// Product info stored as dynamic fields on Shop
    public struct Product has store, copy, drop {
        id: u64,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        image_url: vector<u8>,
        active: bool,
    }

    /// Dynamic field key for products
    public struct ProductKey has store, copy, drop {
        product_id: u64,
    }

    /// Order receipt - transferred to buyer after purchase
    public struct OrderReceipt has key, store {
        id: UID,
        order_number: u64,
        product_id: u64,
        product_name: vector<u8>,
        price: u64,
        buyer: address,
        email: vector<u8>,
        timestamp: u64,
        shop_id: ID,
    }

    // ===== Events =====

    public struct ShopCreated has copy, drop {
        shop_id: ID,
        owner: address,
        name: vector<u8>,
    }

    public struct ProductAdded has copy, drop {
        shop_id: ID,
        product_id: u64,
        name: vector<u8>,
        price: u64,
    }

    public struct OrderPlaced has copy, drop {
        order_receipt_id: ID,
        order_number: u64,
        shop_id: ID,
        product_id: u64,
        product_name: vector<u8>,
        price: u64,
        buyer: address,
        timestamp: u64,
    }

    // ===== Order counter as dynamic field =====
    public struct OrderCounterKey has store, copy, drop {}

    // ===== Functions =====

    /// Create a new shop. The caller becomes the owner and receives AdminCap.
    public entry fun create_shop(
        name: vector<u8>,
        merchant_address: address,
        ctx: &mut TxContext,
    ) {
        let mut shop_uid = object::new(ctx);
        let shop_id = object::uid_to_inner(&shop_uid);

        // Initialize order counter before creating Shop struct
        dynamic_field::add(&mut shop_uid, OrderCounterKey {}, 0u64);

        let shop = Shop {
            id: shop_uid,
            owner: tx_context::sender(ctx),
            merchant_address,
            product_count: 0,
            name,
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
            shop_id,
        };

        event::emit(ShopCreated {
            shop_id,
            owner: tx_context::sender(ctx),
            name,
        });

        transfer::share_object(shop);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Add a product to the shop (admin only)
    public entry fun add_product(
        shop: &mut Shop,
        admin_cap: &AdminCap,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        image_url: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        assert!(admin_cap.shop_id == object::uid_to_inner(&shop.id), ENotOwner);
        assert!(price > 0, EInvalidPrice);

        let product_id = shop.product_count;
        let product = Product {
            id: product_id,
            name,
            description,
            price,
            image_url,
            active: true,
        };

        dynamic_field::add(&mut shop.id, ProductKey { product_id }, product);
        shop.product_count = product_id + 1;

        event::emit(ProductAdded {
            shop_id: object::uid_to_inner(&shop.id),
            product_id,
            name: product.name,
            price,
        });
    }

    /// Purchase a product with any coin type (e.g., USDC)
    /// Creates an OrderReceipt owned by the buyer
    /// Sends payment to the merchant address
    public entry fun purchase<T>(
        shop: &mut Shop,
        product_id: u64,
        mut payment: Coin<T>,
        email: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Verify product exists and is active
        let key = ProductKey { product_id };
        assert!(dynamic_field::exists_(&shop.id, key), EProductNotFound);

        let product = *dynamic_field::borrow<ProductKey, Product>(&shop.id, key);
        assert!(product.active, EProductNotActive);

        // Verify payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= product.price, EInsufficientPayment);

        // If overpaid, split and return change
        if (payment_amount > product.price) {
            let change = coin::split(&mut payment, payment_amount - product.price, ctx);
            transfer::public_transfer(change, tx_context::sender(ctx));
        };

        // Transfer payment to merchant
        transfer::public_transfer(payment, shop.merchant_address);

        // Increment order counter
        let order_counter = dynamic_field::borrow_mut<OrderCounterKey, u64>(&mut shop.id, OrderCounterKey {});
        let order_number = *order_counter;
        *order_counter = order_number + 1;

        // Create order receipt
        let receipt_uid = object::new(ctx);
        let receipt_id = object::uid_to_inner(&receipt_uid);
        let timestamp = sui::clock::timestamp_ms(clock);

        let receipt = OrderReceipt {
            id: receipt_uid,
            order_number,
            product_id,
            product_name: product.name,
            price: product.price,
            buyer: tx_context::sender(ctx),
            email,
            timestamp,
            shop_id: object::uid_to_inner(&shop.id),
        };

        event::emit(OrderPlaced {
            order_receipt_id: receipt_id,
            order_number,
            shop_id: object::uid_to_inner(&shop.id),
            product_id,
            product_name: product.name,
            price: product.price,
            buyer: tx_context::sender(ctx),
            timestamp,
        });

        // Transfer receipt to buyer
        transfer::transfer(receipt, tx_context::sender(ctx));
    }

    /// Deactivate a product (admin only)
    public entry fun deactivate_product(
        shop: &mut Shop,
        admin_cap: &AdminCap,
        product_id: u64,
        _ctx: &mut TxContext,
    ) {
        assert!(admin_cap.shop_id == object::uid_to_inner(&shop.id), ENotOwner);
        let key = ProductKey { product_id };
        assert!(dynamic_field::exists_(&shop.id, key), EProductNotFound);

        let product = dynamic_field::borrow_mut<ProductKey, Product>(&mut shop.id, key);
        product.active = false;
    }

    /// Reactivate a product (admin only)
    public entry fun activate_product(
        shop: &mut Shop,
        admin_cap: &AdminCap,
        product_id: u64,
        _ctx: &mut TxContext,
    ) {
        assert!(admin_cap.shop_id == object::uid_to_inner(&shop.id), ENotOwner);
        let key = ProductKey { product_id };
        assert!(dynamic_field::exists_(&shop.id, key), EProductNotFound);

        let product = dynamic_field::borrow_mut<ProductKey, Product>(&mut shop.id, key);
        product.active = true;
    }

    /// Update price of an existing product (admin only)
    public entry fun update_price(
        shop: &mut Shop,
        admin_cap: &AdminCap,
        product_id: u64,
        new_price: u64,
        _ctx: &mut TxContext,
    ) {
        assert!(admin_cap.shop_id == object::uid_to_inner(&shop.id), ENotOwner);
        assert!(new_price > 0, EInvalidPrice);
        let key = ProductKey { product_id };
        assert!(dynamic_field::exists_(&shop.id, key), EProductNotFound);

        let product = dynamic_field::borrow_mut<ProductKey, Product>(&mut shop.id, key);
        product.price = new_price;
    }

    /// Update merchant address (admin only)
    public entry fun update_merchant_address(
        shop: &mut Shop,
        admin_cap: &AdminCap,
        new_address: address,
        _ctx: &mut TxContext,
    ) {
        assert!(admin_cap.shop_id == object::uid_to_inner(&shop.id), ENotOwner);
        shop.merchant_address = new_address;
    }

    // ===== View functions =====

    /// Get product details
    public fun get_product(shop: &Shop, product_id: u64): &Product {
        let key = ProductKey { product_id };
        assert!(dynamic_field::exists_(&shop.id, key), EProductNotFound);
        dynamic_field::borrow<ProductKey, Product>(&shop.id, key)
    }

    public fun product_name(product: &Product): vector<u8> { product.name }
    public fun product_description(product: &Product): vector<u8> { product.description }
    public fun product_price(product: &Product): u64 { product.price }
    public fun product_active(product: &Product): bool { product.active }
    public fun product_image_url(product: &Product): vector<u8> { product.image_url }

    public fun shop_name(shop: &Shop): vector<u8> { shop.name }
    public fun shop_owner(shop: &Shop): address { shop.owner }
    public fun shop_merchant_address(shop: &Shop): address { shop.merchant_address }
    public fun shop_product_count(shop: &Shop): u64 { shop.product_count }

    public fun receipt_order_number(receipt: &OrderReceipt): u64 { receipt.order_number }
    public fun receipt_product_id(receipt: &OrderReceipt): u64 { receipt.product_id }
    public fun receipt_product_name(receipt: &OrderReceipt): vector<u8> { receipt.product_name }
    public fun receipt_price(receipt: &OrderReceipt): u64 { receipt.price }
    public fun receipt_buyer(receipt: &OrderReceipt): address { receipt.buyer }
    public fun receipt_email(receipt: &OrderReceipt): vector<u8> { receipt.email }
    public fun receipt_timestamp(receipt: &OrderReceipt): u64 { receipt.timestamp }
}
