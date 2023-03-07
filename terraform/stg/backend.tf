terraform {
  backend "s3" {
    bucket         = "ledger-staging-tfstates"
    key            = "nft-indexer-evm/stg.tfstate"
    region         = "eu-west-1"
    profile        = "454902641012"
    encrypt        = true
    dynamodb_table = "ledger-staging-terraform-state-lock"
  }
}
