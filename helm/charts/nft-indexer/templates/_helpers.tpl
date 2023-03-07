{{/*
Expand the name of the chart.
*/}}
{{- define "nft-indexer.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "nft-indexer.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and build as used by the chart label.
*/}}
{{- define "nft-indexer.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nft-indexer.labels" -}}
helm.sh/chart: {{ .Chart.Name }}
{{- if .deployName }}
app.kubernetes.io/name: {{ .deployName }}
{{- else }}
app.kubernetes.io/name: {{ .Chart.Name }}
{{- end }}
{{- if $.ChartAppVersion }}
app.kubernetes.io/build: {{ .Chart.Version }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service}}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "nft-indexer.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .deployName }}
app.kubernetes.io/name: {{ .deployName }}
{{- else }}
app.kubernetes.io/name: {{ .Chart.Name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "nft-indexer.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nft-indexer.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create datadog labels
*/}}
{{- define "nft-indexer.datadogLabels" -}}
tags.datadoghq.com/env: {{ .env  }}
tags.datadoghq.com/service: {{ .service }}
tags.datadoghq.com/version: {{ .version }}
{{- end }}
