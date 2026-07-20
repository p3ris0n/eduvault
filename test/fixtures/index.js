export const users = {
    creator: {
        _id: "user_creator_1",
        walletAddress: "GBBD47IF6LWK7P7MDEVSCWRZDPOVPOFWLYERWFBN4JSE3OUQTISLV5EX",
        email: "creator@eduvault.test",
        fullName: "Alice Educator",
    },
    buyer: {
        _id: "user_buyer_1",
        walletAddress: "GA5ZSEJYB37JDD5G3LYVYF77RD7QFGHSXPJNKXJFUMIVYQ33HE6IGM4Y",
        email: "buyer@eduvault.test",
        fullName: "Bob Student",
    }
};

export const materials = {
    draft: {
        _id: "mat_draft_123",
        title: "Draft Macroeconomics Notes",
        description: "In-progress notes.",
        userAddress: users.creator.walletAddress,
        creatorWallet: users.creator.walletAddress,
        status: "draft",
        price: "10",
        asset: "XLM",
        storageKey: "https://eduvault.test/files/draft.pdf",
    },
    published: {
        _id: "mat_pub_456",
        title: "Published Microeconomics Notes",
        description: "Complete notes.",
        creatorWallet: users.creator.walletAddress,
        status: "published",
        price: "15",
        asset: "USDC",
        contractId: "C_SOROBAN_CONTRACT_ID_789",
        ipfsHash: "QmTestHash...",
    }
};
