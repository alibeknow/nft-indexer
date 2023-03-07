terraform {
  backend "s3" {
    bucket         = "ledger-sandbox-tfstates"
    key            = "nft-indexer-evm/sbx.tfstate"
    region         = "eu-west-1"
    profile        = "364737596256"
    encrypt        = true
    dynamodb_table = "ledger-sandbox-terraform-state-lock"
  }
}
