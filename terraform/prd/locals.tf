locals {
  project     = "nft-indexer-evm"
  project_id  = "${local.project}-${var.env}"
  k8s_ns_name = "${local.ids_mapping[var.env]}-${local.project}-${var.env}"
  k8s_sa      = "system:serviceaccount:${local.k8s_ns_name}:${local.project}*"

  project2     = "nft-indexer"
  project_id2  = "${local.project2}-${var.env}"
  k8s_ns_name2 = "${local.ids_mapping2[var.env]}-${local.project2}-${var.env}"
  k8s_sa2      = "system:serviceaccount:${local.k8s_ns_name2}:${local.project2}"

  ids_mapping = {
    sbx = 2130
    stg = 2129
    prd = 2131
  }

  ids_mapping2 = {
    sbx = 2180
    stg = 2181
    prd = 2182
  }

  env_mapping = {
    sbx = "sandbox"
    stg = "staging"
    prd = "prod"
  }

  eks_mapping = {
    sbx = "2042"
    stg = "2021"
    prd = "2086"
  }

  db_subnet_groups = {
    sbx = "sandbox-shared"
    stg = "staging-shared"
    prd = "production-shared"
  }

  tfs_mapping = {
    sbx = {
      shared = "${local.eks_mapping[var.env]}-sandbox/global.tfstate"
      global = "0000-global/global.tfstate"
    },
    stg = {
      shared = "${local.eks_mapping[var.env]}-shared/shared.tfstate"
      global = "0001-global/global.tfstate"
    },
    prd = {
      shared = "${local.eks_mapping[var.env]}-shared/shared-application.tfstate"
      global = "0000-global/global.tfstate"
    }
  }

  eks_cluster_sg = data.terraform_remote_state.shared_application.outputs.cluster_primary_security_group_id
}
