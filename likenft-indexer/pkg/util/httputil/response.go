package httputil

import (
	"errors"
	"net/http"
)

var ErrNotFound = errors.New("err not found")

func HandleResponseStatus(
	resp *http.Response,
) error {
	if resp.StatusCode >= 400 {
		if resp.StatusCode == 404 {
			return errors.Join(ErrNotFound, errors.New(resp.Status))
		}
		return errors.New(resp.Status)
	}
	return nil
}
