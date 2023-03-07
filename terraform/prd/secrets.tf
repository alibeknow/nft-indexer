resource "aws_secretsmanager_secret" "secrets" {
  name        = local.project_id
  description = "Secrets for NFT Indexer EVM application. You must use terraform to add a secret"
}

########################################################################
# Decode Secrets from KMS
# aws kms encrypt --key-id alias/ledger-global-prod --plaintext "text"
########################################################################
data "aws_kms_secrets" "kms_secrets" {
  for_each = var.secrets
  secret {
    name    = each.key
    payload = each.value
  }
}

########################
# SecretsManager entries
# key:value
########################
resource "aws_secretsmanager_secret_version" "secretsmanager_secret_version" {
  secret_id = aws_secretsmanager_secret.secrets.id
  secret_string = jsonencode(
    merge(
      {
        MONGO_PASSWORD  = random_password.documentdb_master_user_password.result
        RABBIT_PASSWORD = random_password.mq_broker_password.result
        RDS_PASSWORD    = module.rds_nft_indexer.db_instance_password
      },
      {
        for key, val in var.secrets : key => data.aws_kms_secrets.kms_secrets[key].plaintext[key]
      }
    )
  )
}

# nft-indexer-metadata-v2

resource "aws_secretsmanager_secret" "nft-secrets" {
  name        = local.project2
  description = "Secrets for NFT Indexer EVM application. You must use terraform to add a secret"
}

########################################################################
# Decode Secrets from KMS
# aws kms encrypt --key-id alias/ledger-global-prod --plaintext "text"
########################################################################
data "aws_kms_secrets" "nft-kms_secrets" {
  for_each = var.secrets
  secret {
    name    = each.key
    payload = each.value
  }
}

########################
# SecretsManager entries
# key:value
########################
resource "aws_secretsmanager_secret_version" "nft-secretsmanager_secret_version" {
  secret_id = aws_secretsmanager_secret.nft-secrets.id
  secret_string = jsonencode(
    merge(
      {
        RDS_PASSWORD = module.rds_nft_indexer.db_instance_password
      },
      {
        for key, val in var.secrets : key => data.aws_kms_secrets.nft-kms_secrets[key].plaintext[key]
      }
    )
  )
}
