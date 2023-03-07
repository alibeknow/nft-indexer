variable "region" {
  default     = "eu-west-1"
  type        = string
  description = "The region to use for aws provider setup"
}

variable "profile" {
  type        = string
  description = "The profile to use for aws provider setup"
}

variable "env" {
  type        = string
  description = "The environment used to create resources"
}

variable "tags" {
  type        = map(string)
  description = "The tags to use to decorate aws resources."
}

variable "documentdb" {
  type = object({
    cluster_size   = number
    instance_class = string
    cluster_parameters = list(object({
      apply_method = string
      name         = string
      value        = string
    }))
  })
}

variable "rabbitmq" {
  type = object({
    username       = string
    instance_class = string
    engine_version = string
  })
}

variable "opensearch" {
  type = object({
    engine_version = string
    instance_count = number
    instance_type  = string
    volume_size    = number
  })
}

variable "rds" {
  type = object({
    pg_version                      = string
    pg_instance_class               = string
    pg_storage_type                 = string
    pg_backup                       = bool
    pg_min_allocated_storage        = number
    pg_backup_retention_period      = number
    pg_performance_insights_enabled = bool
    pg_deletion_protection          = bool
  })
}

variable "secrets" {
  default = {}
  type    = map(string)
}
