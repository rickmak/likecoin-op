.PHONY: fmt
fmt: GOIMPORT_CMD := go run -mod=mod golang.org/x/tools/cmd/goimports@v0.30.0
fmt:
	find ./cmd -name '*.go' -not -name 'wire_gen.go' -not -name '*_mock_test.go' | \
		sort | \
		xargs $(GOIMPORT_CMD) -w -format-only -local github.com/likecoin/likecoin-op/op-2-base

.PHONY: lint
lint: GOLANGCI_LINT_CMD := go run -mod=mod github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.4.0
lint:
	$(GOLANGCI_LINT_CMD) run ./cmd/... --timeout 7m
	go vet ./cmd/...

.PHONY: test
test:
	go test ./...
