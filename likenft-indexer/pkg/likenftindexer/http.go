package likenftindexer

import (
	"net/http"
	"time"
)

type authTransport struct {
	apiKey           string
	nextRoundTripper http.RoundTripper
}

func NewAuthTransport(
	apiKey string,
	nextRoundTripper http.RoundTripper,
) *authTransport {
	return &authTransport{
		apiKey,
		nextRoundTripper,
	}
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("X-Index-Action-Api-Key", t.apiKey)
	req.Header.Set("Content-Type", "application/json")
	return t.nextRoundTripper.RoundTrip(req)
}

func NewHTTPClient(apiKey string) *http.Client {
	return &http.Client{
		Timeout:   10 * time.Second,
		Transport: NewAuthTransport(apiKey, http.DefaultTransport),
	}
}
