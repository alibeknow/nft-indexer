export type ContractFeature = {
    api?: string;
    tokenMetadata?: boolean;
  };

export type ContractObject = {
    address: string;
    abi: string[];
    name?: string;
    features?: ContractFeature;
  };
