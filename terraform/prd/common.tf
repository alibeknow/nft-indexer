data "terraform_remote_state" "shared_application" {
  backend = "s3"
  config = {
    bucket  = "ledger-${local.env_mapping[var.env]}-tfstates"
    key     = local.tfs_mapping[var.env].shared
    region  = var.region
    profile = var.profile
  }
}

data "terraform_remote_state" "global" {
  backend = "s3"
  config = {
    bucket  = "ledger-${local.env_mapping[var.env]}-tfstates"
    key     = local.tfs_mapping[var.env].global
    region  = var.region
    profile = var.profile
  }
}

data "terraform_remote_state" "platform" {
  count   = var.env == "stg" ? 0 : 1
  backend = "s3"
  config = {
    bucket  = "ledger-${local.env_mapping[var.env]}-tfstates"
    key     = "2020-platform/platform.tfstate"
    region  = var.region
    profile = var.profile
  }
}
