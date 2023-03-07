terraform {
  backend "s3" {
    bucket         = "ledger-prod-tfstates"
    key            = "nft-indexer-evm/prd.tfstate"
    region         = "eu-west-1"
    profile        = "737219370090"
    encrypt        = true
    dynamodb_table = "ledger-production-terraform-state-lock"
  }
}
