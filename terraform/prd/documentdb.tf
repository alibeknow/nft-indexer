# nft-indexer-metadata-v1

resource "random_password" "documentdb_master_user_password" {
  length  = 16
  special = false
}

module "documentdb_cluster" {
  source  = "cloudposse/documentdb-cluster/aws"
  version = "0.14.1"

  enabled         = true
  id_length_limit = 0
  name            = local.project_id
  subnet_ids      = data.terraform_remote_state.global.outputs.private_subnets[0]
  vpc_id          = data.terraform_remote_state.global.outputs.vpc_id
  cluster_size    = var.documentdb.cluster_size
  master_username = "nft"
  master_password = random_password.documentdb_master_user_password.result
  instance_class  = var.documentdb.instance_class
  allowed_security_groups = [
    local.eks_cluster_sg,
    try(
      data.terraform_remote_state.global.outputs.platform_bastion_sg_id,
      data.terraform_remote_state.global.outputs.bastion_security_group_id,
      data.terraform_remote_state.platform[0].outputs.bastion_security_group_id
    )
  ]
  cluster_parameters = var.documentdb.cluster_parameters
}
