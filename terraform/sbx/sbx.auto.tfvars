env     = "sbx"
profile = "364737596256"

tags = {
  terraform    = "true"
  environment  = "sbx"
  owner        = "team-infra-sre@ledger.fr"
  project      = "2130"
  organization = "consumer"
  service      = "nft-indexer-evm"
}

documentdb = {
  cluster_size   = 1
  instance_class = "db.r5.large"
  cluster_parameters = [
    {
      apply_method = "pending-reboot"
      name         = "tls"
      value        = "disabled"
    }
  ]
}

rabbitmq = {
  username       = "nft"
  instance_class = "mq.m5.large"
  engine_version = "3.9.16"
}

opensearch = {
  engine_version = "OpenSearch_2.3"
  instance_count = 1
  instance_type  = "m5.large.search"
  volume_size    = 200
}

rds = {
  pg_version                      = "14.5"
  pg_instance_class               = "db.r5.xlarge"
  pg_storage_type                 = "gp3"
  pg_backup                       = true
  pg_min_allocated_storage        = 200
  pg_backup_retention_period      = 7
  pg_performance_insights_enabled = false
  pg_deletion_protection          = false
}

secrets = {
  NODE_PASSWORD                         = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQGTR2jaa3kVNFEUZlYza0FLAAAAfTB7BgkqhkiG9w0BBwagbjBsAgEAMGcGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM2kaVZ3AF8aM+uHVAAgEQgDqKFDj+Ea7X78HvgLks15QL+gmXWZOUyysx6dY0U+q1qGudsj9TmL3/t+G7KvJV8gsT1pz/FPCELmVU"
  PROXY_CREDENTIALS                     = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQGGRAJ2X6ilrWnzvoC0bcu3AAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDBmrXgPm4lpU+j0CTgIBEIBwZFKCpZU0O6cQT5Haj+hs6f8iAArpyrLsaPgv0WoYpLv38JatDvzMZtHhyK94sZgS9Gneg7JEu69OtlFsDg9J8r0V1ui9FPrOtNxQ5fSBRfGM9EYP7Qce16fDt1RQfVCK8Jsy819edAn/irPuXCdXeA=="
  ETH_NODE_USERNAME                     = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFRf/ZJm+dJrHXhinabAW2QAAAAZDBiBgkqhkiG9w0BBwagVTBTAgEAME4GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMJzreszLnHDdNdzMuAgEQgCGnLBqMoyEJQB/Q0SWot0o5Wlu0sSuNUlEYv7si108YBSk="
  ETH_NODE_PASSWORD                     = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFNIU8jWiJi+n7PaMzuqjeQAAAAfTB7BgkqhkiG9w0BBwagbjBsAgEAMGcGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM2rWgsG/+mzmhJk0cAgEQgDrzeawFI3Qvpy2b7/Dd5K6F3drlDKuRls/ZtlyCa8dNyKnaR4Dw8FLrX7ASX7x8UFKUZrCFmh4+kPD6"
  MATIC_NODE_USERNAME                   = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQE0bMmB6fdHzRgwGiY1UB10AAAAZTBjBgkqhkiG9w0BBwagVjBUAgEAME8GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMITMN+i/gG0cn5S/eAgEQgCLyuw8+dlSeRx95el6MXioxr7KGanNc9E64HHhRJOUPhvdw"
  MATIC_NODE_PASSWORD                   = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFu/9Gh0zLdEZVjnWvxCkvIAAAAeTB3BgkqhkiG9w0BBwagajBoAgEAMGMGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMNEkqnNOSKvAAKioAAgEQgDYPpeYGZU/M2LkjEFqVWUpPBxVFZ2GY2OIEa5BhVLt2Psbs8pa9CQDQJhOOeQ5ophUOisSKzIw="
  METADATA_STORAGE_S3_ACCESS_KEY_ID     = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFRSbOnwJ1c/3ljBXRYH4R9AAAAcjBwBgkqhkiG9w0BBwagYzBhAgEAMFwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMLhn14G83Irg21j/0AgEQgC9VFEs6W7epZcT5udMJw4/E4JxaM10VggHh5gjCUnyB5WCyxBfmqEjQ5jxMpEampA=="
  METADATA_STORAGE_S3_SECRET_ACCESS_KEY = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQGDEkwD1QImY8BFsnbex/I9AAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDJMKrY3SOK2Ap6ZgBgIBEIBDNS9M5HkZtWJHbbl/llvVBqnIJjLtX/NyBEkK1YV2/y5qGE53PXoXlpZGulgbPmALe/uO8dcszF5EuNkTL/mA3yYxrA=="
  DATABASE_URL                          = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQG1FtWs5IG4FC09K5oj0DQlAAAA2DCB1QYJKoZIhvcNAQcGoIHHMIHEAgEAMIG+BgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDD7H207A4epAyK6L6AIBEICBkGBPfO/+ntfUG/KM4tbjro159lK6y7M4CXWiKLeGbicouheTOy83ZiDr/m4u34b3c8cpt0vNggkE51VSSFHC9ml79pwy4V8L5tAvm1GUrANusD06w7CLhrxU0eOBC6GAKpN1uOeS64IVBrwHFXLYOpvMtfZjnkh0KdjqMiK2CENmxpC3YNBFuL1KGJa6T3NeXQ=="
  SEARCH_URL                            = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQHj9nI5WMkt7VXhfEDSGYNpAAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDMsO3hdij3YaYowtmQIBEIBwxZoMEdnU/bsyTUUhrHgsO51LRWUBQyO3wzFP8x2lztNhZ5htNwm/vXKUhY98rnr3aO55KNMkaLHLDu2K1r/DZ8GZ8K2nwkk5XYWJL09WyhHPHwywRowWakyKB3v95pYGT/iFp1ZG+9M9bcMdhf/ypg=="
  ETH_GOERLI_NODE_USERNAME              = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQGZoz2VckrgJMV+PY+ydjShAAAAZzBlBgkqhkiG9w0BBwagWDBWAgEAMFEGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMmDhsUR5sXATUi5MTAgEQgCQqElQQ9h9TGy94vJujxRP5Y50TmOSeYXNiXunS+Ml17WMrldE="
  ETH_GOERLI_NODE_PASSWORD              = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQHM3hHrp3ro3STshYpiPSZcAAAAbjBsBgkqhkiG9w0BBwagXzBdAgEAMFgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMGCkpbACHuKW9e/rEAgEQgCuCQjDMlVI3qJN5+SYw/FNZUrD/T/ESJ5ZQrLZieVEzqtzdE3/tUxUt4Eny"
  IPFS_PINATA_TOKEN                     = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFZCMH5SUKajyBG1LbC0CUTAAAAojCBnwYJKoZIhvcNAQcGoIGRMIGOAgEAMIGIBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDPp8ZGC/W0bDi03XSgIBEIBbQpPBBD7j85VZj1VNezIN0nE6dGgwmGue8RQfn0Q1gW5rNtjbq6drTOcC2zpUR0tZDy9EZPkPZMAKjCfHlnN3qXsz/jtTIu8ShWeQ/1hnZ5dh1BTVRvdtpxk03g=="
  OPENSEA_API_KEY                       = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQFxJdmJ871v8dhOUbDbnHjhAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMn9wzdViPGQ0gjh8DAgEQgDuZ/doFlVqHdzxjMpUHNcZqKMYk+9z6tT2fk+heu8n9LKiWoi2UzZwd70XT0Pub643F7ClUv+9W/AQKIg=="
}
