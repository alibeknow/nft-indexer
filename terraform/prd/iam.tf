# nft-indexer-metadata-v1

data "aws_iam_policy_document" "nft_indexer_evm_s3_policy_document" {
  statement {
    sid    = "NftindexerS3Objects"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "${module.nft_indexer_evm_s3.s3_bucket_arn}/*"
    ]
  }
  statement {
    sid       = "NftindexerS3Bucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [module.nft_indexer_evm_s3.s3_bucket_arn]
  }
}

module "iam_policy_nft_indexer_evm_s3" {
  source      = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version     = "5.1.0"
  name        = "${replace(local.project_id, "-", "_")}_sqs_policy"
  description = "Grant access to ${local.project_id} S3 bucket"

  policy = data.aws_iam_policy_document.nft_indexer_evm_s3_policy_document.json
}

data "aws_iam_policy_document" "nft_indexer_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [data.terraform_remote_state.shared_application.outputs.oidc_provider_arn]
    }
    condition {
      test     = "StringLike"
      variable = "${replace(data.terraform_remote_state.shared_application.outputs.cluster_oidc_issuer_url, "https://", "")}:sub"
      values = [
        local.k8s_sa,
      ]
    }
  }
}

resource "aws_iam_role" "nft_indexer_evm_k8s_role" {
  name               = "${local.project}-k8s-role"
  assume_role_policy = data.aws_iam_policy_document.nft_indexer_assume_role.json
}

resource "aws_iam_role_policy_attachment" "nft_indexer_evm_s3" {
  policy_arn = module.iam_policy_nft_indexer_evm_s3.arn
  role       = aws_iam_role.nft_indexer_evm_k8s_role.name
}

# nft-indexer-metadata-v2

#### Policy Document ####

data "aws_iam_policy_document" "nft_metadata_indexer_document" {
  statement {
    sid = "NFTMetadataIndexerS3ReadWrite"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]

    resources = [
      "${module.s3_bucket_nft_indexer.s3_bucket_arn}/*"
    ]
  }
  statement {
    sid = "NFMetadataIndexerListBucket"

    actions = [
      "s3:ListBucket"
    ]

    resources = [
      module.s3_bucket_nft_indexer.s3_bucket_arn
    ]
  }
}
####

#### SA user ####
module "iam_nft_metadata_indexer" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-user"
  version                       = "5.11.1"
  name                          = local.project_id2
  create_iam_user_login_profile = false
  create_iam_access_key         = false
  force_destroy                 = true
}

module "iam_policy_nft_metadata_indexer_sa" {
  source      = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version     = "5.11.1"
  name        = "${upper(local.project_id2)}-AccessPolicy"
  path        = "/"
  description = "Allow ${local.project_id2} access to s3 bucket"
  policy      = data.aws_iam_policy_document.nft_metadata_indexer_document.json
}

resource "aws_iam_user_policy_attachment" "nft_metadata_indexer_sa_policy_attach" {
  user       = module.iam_nft_metadata_indexer.iam_user_name
  policy_arn = module.iam_policy_nft_metadata_indexer_sa.arn
}
####


#### S3 Assume Role ####
module "iam_policy_nft_metadata_indexer_s3" {
  source      = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version     = "5.11.1"
  name        = "${replace(local.project_id2, "-", "_")}_s3_policy"
  description = "Grant access to ${local.project_id2} S3 bucket"

  policy = data.aws_iam_policy_document.nft_metadata_indexer_document.json
}

data "aws_iam_policy_document" "nft_metadata_indexer_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [data.terraform_remote_state.shared_application.outputs.oidc_provider_arn]
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    condition {
      test     = "StringEquals"
      variable = "${replace(data.terraform_remote_state.shared_application.outputs.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(data.terraform_remote_state.shared_application.outputs.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["${local.k8s_sa2}"]
    }
  }
}

resource "aws_iam_role" "nft_metadata_indexer_k8s_role" {
  name               = "${local.project_id2}-k8s-role"
  assume_role_policy = data.aws_iam_policy_document.nft_metadata_indexer_assume_role.json
}

resource "aws_iam_role_policy_attachment" "nft_metadata_indexer_s3" {
  policy_arn = module.iam_policy_nft_metadata_indexer_s3.arn
  role       = aws_iam_role.nft_metadata_indexer_k8s_role.name
}
####
