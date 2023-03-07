###########################################
# Security group to associate RabbitMQ with
###########################################

module "mq_broker_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "4.9.0"

  name   = format("rabbitmq-%s", local.project_id)
  vpc_id = data.terraform_remote_state.global.outputs.vpc_id

  ingress_with_source_security_group_id = [
    {
      rule                     = "rabbitmq-5671-tcp"
      source_security_group_id = local.eks_cluster_sg
    },
    {
      rule = "https-443-tcp"
      source_security_group_id = try(
        data.terraform_remote_state.global.outputs.platform_bastion_sg_id,
        data.terraform_remote_state.global.outputs.bastion_security_group_id,
        data.terraform_remote_state.platform[0].outputs.bastion_security_group_id
      )
      description = "Access Web Console from platform bastion"
    }
  ]

  egress_cidr_blocks = ["0.0.0.0/0"]
  egress_rules       = ["all-all"]
}

###########################################
# Password for RabbitMQ
###########################################

resource "random_password" "mq_broker_password" {
  length  = 16
  special = false
}

###########################################
# RabbitMQ Broker
###########################################

resource "aws_mq_broker" "mq_broker" {
  broker_name = local.project_id

  engine_type        = "RabbitMQ"
  engine_version     = var.rabbitmq.engine_version
  host_instance_type = var.rabbitmq.instance_class
  security_groups    = [module.mq_broker_sg.security_group_id]
  subnet_ids         = [data.terraform_remote_state.global.outputs.private_subnets[0][0]]

  logs {
    general = true
  }

  user {
    username = var.rabbitmq.username
    password = random_password.mq_broker_password.result
  }
}
