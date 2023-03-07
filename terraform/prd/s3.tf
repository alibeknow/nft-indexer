module "nft_indexer_evm_s3" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.6.0"
  bucket  = local.project_id
  acl     = "private"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# nft-indexer-metadata-v2
module "s3_bucket_nft_indexer" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.6.0"
  bucket  = local.project_id2
  acl     = "private"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
