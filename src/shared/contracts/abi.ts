export const ERC_721_TRANSFER_SIG = 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
export const PRE_ERC_721_ERC_20_SIG = 'event Transfer(address indexed from, address indexed to, uint256 tokenId)';
export const PRE_ERC_721_WITHOUT_INDEXED_SIG = 'event Transfer(address from, address to, uint256 tokenId)';
export const ERC_1155_TRANSFER_SINGLE_SIG = 'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)';
export const ERC_1155_TRANSFER_BATCH_SIG = 'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)';
