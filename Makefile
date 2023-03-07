all: install helm_validate

M := $(shell printf "\033[34;1m▶\033[0m")
O := $(shell printf "  \033[32;1m✓\033[0m")
K := $(shell printf "  \033[31;1m✗\033[0m")

OS := $(shell uname)
LC_OS := $(shell echo $(OS) | tr A-Z a-z)

APP ?= nft-indexer
CHART_DIR := helm/charts/$(APP)
HELM_VALUES := $(wildcard helm/values/$(APP)/*.yaml)

TEMP_DIR := $(shell mktemp -d)
BIN_PATH := $(HOME)/.local/bin

HELM_VERSION := 3.8.2
KUBECONFORM_VERSION := 0.4.13
HELM_DOCS_VERSION := 1.10.0
CT_VERSION := 3.5.0

GH_BASE := https://github.com
HELM_BASE := https://get.helm.sh

define install_cmd
	if [ "$(*)" = "helm" ]; then \
		curl --silent --show-error --fail --location $(2) | tar -xzf - "$(LC_OS)-amd64/$(1)" --transform "s#$(LC_OS)-amd64/$(1)#$(1)#" &&\
		install $(1) $(BIN_PATH);\
	elif [ "$(*)" = "ct" ]; then \
		pip3 install -q yamale yamllint &&\
		curl --silent --show-error --fail --location $(2) | tar -xzf - &&\
		mkdir -p "$(HOME)/.ct" &&\
		mv etc/*yaml "$(HOME)/.ct" &&\
		install $(1) $(BIN_PATH);\
	else \
		curl --silent --show-error --fail --location $(2) | tar -xzf - $(1) &&\
		install $(1) $(BIN_PATH);\
	fi
endef

define ct_lint
	$(info $(M) running ct lint...)
	ct lint --config .github/ct.yaml
	$(info $(O) ct lint ok)
endef

define helm_docs
	$(info $(M) running helm-docs...)
	helm-docs
	$(info $(O) helm-docs ok)
endef

define kubeconform
	$(info $(M) running kubeconform...)
	$(foreach v,$(HELM_VALUES),helm template $(CHART_DIR) -f $(v)| \
		$(info $(O) running kubeconform on $(v)) \
		kubeconform --ignore-missing-schemas --strict -summary -verbose -exit-on-error \
		-schema-location default -schema-location 'helm/k8s-crds-schemas/{{ .ResourceKind }}{{ .KindSuffix }}.json' -
	)
	$(info $(O) kubeconform run ok)
endef

# Make is verbose in Linux. Make it silent.
MAKEFLAGS += --silent

check_deps:
ifeq ($(OS),Darwin)
	ifeq (, $(shell brew list | grep gnu-tar))
		$(error $(K) Please run : brew install gnu-tar...)
	endif
endif

install: check_deps install/kubeconform install/ct install/helm-docs install/helm

install/%:
	$(info $(M) installing $*...)
	cd $(TEMP_DIR) &&\
	if [ "$(*)" = "kubeconform" ]; then \
		$(call install_cmd,$(*),"$(GH_BASE)/yannh/$(*)/releases/download/v$(KUBECONFORM_VERSION)/$(*)-$(OS)-amd64.tar.gz"); \
	elif [ "$(*)" = "helm" ]; then \
		$(call install_cmd,$(*),"$(HELM_BASE)/$(*)-v$(HELM_VERSION)-$(LC_OS)-amd64.tar.gz"); \
	elif [ "$(*)" = "helm-docs" ]; then \
		$(call install_cmd,$(*), "$(GH_BASE)/norwoodj/$(*)/releases/download/v$(HELM_DOCS_VERSION)/$(*)_$(HELM_DOCS_VERSION)_$(OS)_x86_64.tar.gz"); \
	elif [ "$(*)" = "ct" ]; then \
		$(call install_cmd,$(*),"$(GH_BASE)/helm/chart-testing/releases/download/v$(CT_VERSION)/chart-testing_$(CT_VERSION)_$(OS)_amd64.tar.gz") ; \
	fi
	$(info $(O) $(*) installed successfully...)

helm_validate:
	$(call ct_lint)
	$(call helm_docs)
	$(call kubeconform)
