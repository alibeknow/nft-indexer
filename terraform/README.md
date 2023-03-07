## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | ~> 1.3.2 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | 4.18.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 4.18.0 |
| <a name="provider_random"></a> [random](#provider\_random) | n/a |
| <a name="provider_terraform"></a> [terraform](#provider\_terraform) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_documentdb_cluster"></a> [documentdb\_cluster](#module\_documentdb\_cluster) | cloudposse/documentdb-cluster/aws | 0.14.1 |
| <a name="module_dynamodb_table"></a> [dynamodb\_table](#module\_dynamodb\_table) | terraform-aws-modules/dynamodb-table/aws | 2.0.0 |
| <a name="module_iam_policy_nft_indexer_evm_dynamodb"></a> [iam\_policy\_nft\_indexer\_evm\_dynamodb](#module\_iam\_policy\_nft\_indexer\_evm\_dynamodb) | terraform-aws-modules/iam/aws//modules/iam-policy | 5.1.0 |
| <a name="module_iam_policy_nft_indexer_evm_s3"></a> [iam\_policy\_nft\_indexer\_evm\_s3](#module\_iam\_policy\_nft\_indexer\_evm\_s3) | terraform-aws-modules/iam/aws//modules/iam-policy | 5.1.0 |
| <a name="module_iam_policy_nft_indexer_evm_sqs"></a> [iam\_policy\_nft\_indexer\_evm\_sqs](#module\_iam\_policy\_nft\_indexer\_evm\_sqs) | terraform-aws-modules/iam/aws//modules/iam-policy | 5.1.0 |
| <a name="module_mq_broker_sg"></a> [mq\_broker\_sg](#module\_mq\_broker\_sg) | terraform-aws-modules/security-group/aws | 4.9.0 |
| <a name="module_nft_indexer_evm_s3"></a> [nft\_indexer\_evm\_s3](#module\_nft\_indexer\_evm\_s3) | terraform-aws-modules/s3-bucket/aws | ~> 3.0.0 |
| <a name="module_opensearch_sg"></a> [opensearch\_sg](#module\_opensearch\_sg) | terraform-aws-modules/security-group/aws | 4.9.0 |

## Resources

| Name | Type |
|------|------|
| [aws_iam_role.nft_indexer_evm_k8s_role](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/iam_role) | resource |
| [aws_iam_role_policy_attachment.nft_indexer_evm_dynamodb](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/iam_role_policy_attachment) | resource |
| [aws_iam_role_policy_attachment.nft_indexer_evm_s3](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/iam_role_policy_attachment) | resource |
| [aws_iam_role_policy_attachment.nft_indexer_evm_sqs](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/iam_role_policy_attachment) | resource |
| [aws_iam_service_linked_role.opensearch_service_linked](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/iam_service_linked_role) | resource |
| [aws_mq_broker.mq_broker](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/mq_broker) | resource |
| [aws_opensearch_domain.opensearch_domain](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/opensearch_domain) | resource |
| [aws_opensearch_domain_policy.main](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/opensearch_domain_policy) | resource |
| [aws_secretsmanager_secret.secrets](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/secretsmanager_secret) | resource |
| [aws_secretsmanager_secret_version.secretsmanager_secret_version](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/secretsmanager_secret_version) | resource |
| [aws_sqs_queue.sqs_queue](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/resources/sqs_queue) | resource |
| [random_password.documentdb_master_user_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.mq_broker_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [aws_iam_policy_document.nft_indexer_assume_role](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.nft_indexer_evm_dynamodb_policy_document](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.nft_indexer_evm_s3_policy_document](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.nft_indexer_evm_sqs_policy_document](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/data-sources/iam_policy_document) | data source |
| [aws_kms_secrets.kms_secrets](https://registry.terraform.io/providers/hashicorp/aws/4.18.0/docs/data-sources/kms_secrets) | data source |
| [terraform_remote_state.global](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [terraform_remote_state.platform](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [terraform_remote_state.shared_application](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_documentdb"></a> [documentdb](#input\_documentdb) | n/a | <pre>object({<br>    cluster_size   = number<br>    instance_class = string<br>    cluster_parameters = list(object({<br>      apply_method = string<br>      name         = string<br>      value        = string<br>    }))<br>  })</pre> | n/a | yes |
| <a name="input_env"></a> [env](#input\_env) | The environment used to create resources | `string` | n/a | yes |
| <a name="input_opensearch"></a> [opensearch](#input\_opensearch) | n/a | <pre>object({<br>    engine_version = string<br>    instance_count = number<br>    instance_type  = string<br>    volume_size    = number<br>  })</pre> | n/a | yes |
| <a name="input_profile"></a> [profile](#input\_profile) | The profile to use for aws provider setup | `string` | n/a | yes |
| <a name="input_queues"></a> [queues](#input\_queues) | n/a | <pre>map(object({<br>    target              = set(string)<br>    type                = string<br>    deduplication_scope = string<br>    })<br>  )</pre> | n/a | yes |
| <a name="input_rabbitmq"></a> [rabbitmq](#input\_rabbitmq) | n/a | <pre>object({<br>    username       = string<br>    instance_class = string<br>    engine_version = string<br>  })</pre> | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The region to use for aws provider setup | `string` | `"eu-west-1"` | no |
| <a name="input_secrets"></a> [secrets](#input\_secrets) | n/a | `map(string)` | `{}` | no |
| <a name="input_tables"></a> [tables](#input\_tables) | n/a | <pre>map(object({<br>    hash_key       = string<br>    table_class    = string<br>    attribute_name = string<br>    attribute_type = string<br>    })<br>  )</pre> | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | The tags to use to decorate aws resources. | `map(string)` | <pre>{<br>  "owner": "team-sre@ledger.fr",<br>  "project": "nft-indexer-evm",<br>  "terraform": "true"<br>}</pre> | no |

## Outputs

No outputs.
