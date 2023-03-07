# nft-indexer-metadata-v2

###########################################
# Security group to associate OpenSearch with
###########################################

module "opensearch_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "4.9.0"

  name   = format("openseach-%s", local.project_id)
  vpc_id = data.terraform_remote_state.global.outputs.vpc_id

  ingress_with_source_security_group_id = [
    {
      rule                     = "https-443-tcp"
      source_security_group_id = local.eks_cluster_sg
    },
    {
      rule = "https-443-tcp"
      source_security_group_id = try(
        data.terraform_remote_state.global.outputs.platform_bastion_sg_id,
        data.terraform_remote_state.global.outputs.bastion_security_group_id,
        data.terraform_remote_state.platform[0].outputs.bastion_security_group_id
      )
      description = "Access ElasticSearch Endpoint from platform bastion"
    }
  ]

  egress_cidr_blocks = ["0.0.0.0/0"]
  egress_rules       = ["all-all"]
}

###########################################
# OpenSearch Domain
###########################################

resource "aws_iam_service_linked_role" "opensearch_service_linked" {
  aws_service_name = "opensearchservice.amazonaws.com"
}

resource "aws_opensearch_domain" "opensearch_domain" {
  domain_name    = local.project_id
  engine_version = var.opensearch.engine_version

  cluster_config {
    instance_count = var.opensearch.instance_count
    instance_type  = var.opensearch.instance_type
  }

  vpc_options {
    subnet_ids = [
      data.terraform_remote_state.global.outputs.private_subnets[0][0],
      var.opensearch.instance_count > 1 ? data.terraform_remote_state.global.outputs.private_subnets[0][1] : "",
      var.opensearch.instance_count > 2 ? data.terraform_remote_state.global.outputs.private_subnets[0][2] : "",
    ]
    security_group_ids = [module.opensearch_sg.security_group_id]
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  node_to_node_encryption {
    enabled = true
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.opensearch.volume_size
  }

  depends_on = [aws_iam_service_linked_role.opensearch_service_linked]
}

###########################################
# OpenSearch Policy
# Policy is set to open for AWS account
# Filtered via Security Group
###########################################

resource "aws_opensearch_domain_policy" "main" {
  domain_name = aws_opensearch_domain.opensearch_domain.domain_name

  access_policies = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = "*"
        },
        Action   = "es:*",
        Resource = "${resource.aws_opensearch_domain.opensearch_domain.arn}/*"
      }
    ]
  })
}
