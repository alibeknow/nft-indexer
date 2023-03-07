# nft-indexer-metadata-v2

module "rds_sg_nft_indexer" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "4.16.2"

  name   = format("rds-%s", local.project_id)
  vpc_id = data.terraform_remote_state.global.outputs.vpc_id

  ingress_with_source_security_group_id = [
    {
      rule                     = "postgresql-tcp"
      description              = "Access from EKS cluster"
      source_security_group_id = data.terraform_remote_state.shared_application.outputs.cluster_primary_security_group_id
    },
    {
      rule        = "postgresql-tcp"
      description = "Access from bastion host"
      source_security_group_id = try(
        data.terraform_remote_state.global.outputs.platform_bastion_sg_id,
        data.terraform_remote_state.global.outputs.bastion_security_group_id,
        data.terraform_remote_state.platform[0].outputs.bastion_security_group_id
      )
    }
  ]
  egress_cidr_blocks = ["0.0.0.0/0"]
  egress_rules       = ["all-all"]
}

module "rds_nft_indexer" {
  source  = "terraform-aws-modules/rds/aws"
  version = "5.2.3"

  identifier = local.project_id

  engine               = "postgres"
  engine_version       = var.rds.pg_version
  instance_class       = var.rds.pg_instance_class
  major_engine_version = element(split(".", var.rds.pg_version), 0)
  family               = format("postgres%s", element(split(".", var.rds.pg_version), 0))

  allocated_storage = var.rds.pg_min_allocated_storage
  storage_type      = var.rds.pg_storage_type
  storage_encrypted = true

  db_name                = "nftindexer"
  username               = "nftindexer"
  create_random_password = true
  port                   = 5432


  vpc_security_group_ids = [module.rds_sg_nft_indexer.security_group_id]
  publicly_accessible    = false

  maintenance_window      = var.rds.pg_backup ? "Mon:00:00-Mon:03:00" : null
  backup_window           = var.rds.pg_backup ? "03:00-06:00" : null
  backup_retention_period = var.rds.pg_backup ? var.rds.pg_backup_retention_period : null
  apply_immediately       = true

  # DB subnet group
  subnet_ids           = data.terraform_remote_state.global.outputs.database_subnets[0]
  db_subnet_group_name = local.db_subnet_groups[var.env]

  deletion_protection = var.rds.pg_deletion_protection
  skip_final_snapshot = true

  performance_insights_enabled = var.rds.pg_performance_insights_enabled
  create_db_option_group       = true
  create_db_parameter_group    = false
}
