# nft-indexer

![Version: 0.2.0](https://img.shields.io/badge/Version-0.2.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.2.0](https://img.shields.io/badge/AppVersion-0.2.0-informational?style=flat-square)

This is a helm chart for nft-indexer

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| SRE | <team-sre@ledger.fr> |  |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | The affinity setup |
| autoscaling.enabled | bool | `false` | Autoscaling enablement. |
| autoscaling.maxReplicas | int | `10` | Autoscaling max replicas |
| autoscaling.minReplicas | int | `1` | Autoscaling min replicas |
| autoscaling.targetCPUUtilizationPercentage | int | `80` | Autoscaling metric watch condition |
| containerPort | int | `8000` | The application container port that will be exposed as a service. |
| datadog | bool | `false` | Activate datadog |
| defaultProbes.httpGet.path | string | `"/_health"` | The endpoint used as default for http probes. |
| defaultProbes.httpGet.port | int | `8000` |  |
| defaultProbes.initialDelaySeconds | int | `5` | Number of seconds after the container has started before liveness or readiness probes are initiated. |
| defaultProbes.periodSeconds | int | `10` | Number of seconds between probes. |
| defaultProbes.timeoutSeconds | int | `2` | Number of seconds after which the probes time out. |
| environment.normal | object | `{}` | Declare here all normal environments variables, which are not provided by secrets. |
| environment.secrets | object | `{}` | Declare here all secrets environments variables. If set, name should be one from externalSecrets and key should be available in SecretsManager. |
| externalSecrets | object | `{}` | This map contains external secrets to be retrieved in AWS secret manager. If pull key is set, those secrets will be added to imagePullSecrets. |
| fullnameOverride | string | `"nft-indexer"` | fullnameOverride is used to override full app name |
| host | string | `"nft-indexer-sbx.sbx.aws.ledger.fr"` | the host to use on ingress settings. |
| images.main.pullPolicy | string | `"Always"` | The main image pull policy. |
| images.main.repository | string | `"ghcr.io/ledgerhq/nft-indexer"` | Repository to use to download main image. |
| images.main.tag | string | `"main"` | Overrides the image tag whose default is the chart appVersion. |
| ingress.annotations."cert-manager.io/cluster-issuer" | string | `"letsencrypt-prod"` | Cert issuer should be kept with default. |
| ingress.annotations."nginx.ingress.kubernetes.io/whitelist-source-range" | string | `"0.0.0.0/32"` | Whitelist annotation to filter authorized ips. |
| ingress.className | string | `"nginx"` | The ingress classname |
| ingress.enabled | bool | `true` | The ingress enablement |
| ingress.hosts[0] | object | `{"host":"nft-indexer-sbx.sbx.aws.ledger.fr","paths":[{"path":"/","pathType":"Prefix"}]}` | The application dns host and path configuration |
| ingress.tls | list | `[{"hosts":["nft-indexer-sbx.sbx.aws.ledger.fr"],"secretName":"nft-indexer-sbx-tls"}]` | The application tls endpoints |
| nameOverride | string | `""` | nameOverride is used to override app name. |
| nodeSelector | object | `{}` | The node selector setup |
| podAnnotations | object | `{}` | Add here required pod annotations |
| podSecurityContext | object | `{}` |  |
| probes.liveness | object | `{"<<":{"httpGet":{"path":"/_health","port":8000},"initialDelaySeconds":5,"periodSeconds":10,"timeoutSeconds":2}}` | The liveness probe setup : indicates whether the container is running. If the liveness probe fails, the kubelet kills the container. |
| probes.liveness.<<.httpGet.path | string | `"/_health"` | The endpoint used as default for http probes. |
| probes.liveness.<<.initialDelaySeconds | int | `5` | Number of seconds after the container has started before liveness or readiness probes are initiated. |
| probes.liveness.<<.periodSeconds | int | `10` | Number of seconds between probes. |
| probes.liveness.<<.timeoutSeconds | int | `2` | Number of seconds after which the probes time out. |
| probes.readiness | object | `{"<<":{"httpGet":{"path":"/_health","port":8000},"initialDelaySeconds":5,"periodSeconds":10,"timeoutSeconds":2}}` | The readiness probe setup : indicates whether the container is ready to respond to requests. If the readiness probe fails, the endpoints controller removes the Pod's IP address from the endpoints of all Services that match the Pod. |
| probes.readiness.<<.httpGet.path | string | `"/_health"` | The endpoint used as default for http probes. |
| probes.readiness.<<.initialDelaySeconds | int | `5` | Number of seconds after the container has started before liveness or readiness probes are initiated. |
| probes.readiness.<<.periodSeconds | int | `10` | Number of seconds between probes. |
| probes.readiness.<<.timeoutSeconds | int | `2` | Number of seconds after which the probes time out. |
| probes.startup | object | `{"<<":{"httpGet":{"path":"/_health","port":8000},"initialDelaySeconds":5,"periodSeconds":10,"timeoutSeconds":2},"failureThreshold":10}` | The startup probe setup : Indicates whether the application within the container is started. All other probes are disabled if a startup probe is provided, until it succeeds. |
| probes.startup.<<.httpGet.path | string | `"/_health"` | The endpoint used as default for http probes. |
| probes.startup.<<.initialDelaySeconds | int | `5` | Number of seconds after the container has started before liveness or readiness probes are initiated. |
| probes.startup.<<.periodSeconds | int | `10` | Number of seconds between probes. |
| probes.startup.<<.timeoutSeconds | int | `2` | Number of seconds after which the probes time out. |
| rbac.create | bool | `false` | Specifies whether a rbac role should be created. When activated, the corresponding rolebinding will be created too. |
| rbac.name | string | `"nft-indexer"` | Specifies the role name : it will be appended to the app fullname. |
| rbac.rules | list | `[{"apiGroups":["apps"],"resources":["deployments"],"verbs":["get","list","watch"]}]` | Rules to apply for the rbac role. |
| rbac.rules[0] | object | `{"apiGroups":["apps"],"resources":["deployments"],"verbs":["get","list","watch"]}` | apiGroups used by service |
| rbac.rules[0].resources | list | `["deployments"]` | resources allowed by this role |
| rbac.rules[0].verbs | list | `["get","list","watch"]` | verbs allowed by this role |
| replicaCount | int | `1` | Number of replicas to use for main service |
| resources | object | `{"limits":{"cpu":"0.5","memory":"1Gi"},"requests":{"cpu":"0.5","memory":"1Gi"}}` | The resources setup to use for pods. |
| resources.limits | object | `{"cpu":"0.5","memory":"1Gi"}` | The pod resource limits. |
| resources.requests | object | `{"cpu":"0.5","memory":"1Gi"}` | The pod resource requests. |
| securityContext | object | `{}` |  |
| service | object | `{"port":80,"targetPort":8000,"type":"ClusterIP"}` | The service exposing the application. |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| tolerations | list | `[]` | The tolerations setup |
| whitelistSourceRanges | string | `"0.0.0.0/32"` | This whitelist range allows to access the service from declared source ips. |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.0](https://github.com/norwoodj/helm-docs/releases/v1.11.0)
